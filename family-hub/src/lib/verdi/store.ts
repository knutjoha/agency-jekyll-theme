import "server-only";
import { fixtureVerdi } from "@/data/verdi";
import { mondayOf } from "@/lib/calendar-view";
import { osloDateKey } from "@/lib/oslo";
import { getSupabase } from "@/lib/supabase/admin";
import {
  DEFAULT_BASICS,
  VERDI_DAUGHTERS,
  parseBasicWrite,
  parseExtraCreate,
  parseExtraDelete,
  parseExtraPatch,
  parseLockWrite,
  parseMondayWeek,
  parseSkipWrite,
  weekFromParts,
  type VerdiBasic,
  type VerdiDaughterId,
  type VerdiWeek,
} from "./model";

export type VerdiLoad = {
  source: "supabase" | "fixture";
  persisted: boolean;
  week: VerdiWeek;
};

export type WriteResult = {
  persisted: boolean;
};

type WeekRow = { id: string; locked: boolean; locked_at: string | null };
type SkipRow = { person_id: string; skips: number };
type ExtraRow = { id: string; person_id: string; title: string; amount_nok: number; sort_order: number };
type BasicRow = { id: string; title: string; sort_order: number };

function safeError(error: { code?: string; message?: string }): string {
  const message = error.message ?? "unknown";
  if (/sb_secret|service_role|eyJ|supabase\.co|bearer/i.test(message)) return error.code ?? "request failed";
  return `${error.code ?? ""} ${message}`.trim();
}

function logFailure(area: string, error: { code?: string; message?: string }) {
  console.error(`[family-hub] ${area} failed: ${safeError(error)}`);
}

function fixtureLoad(now?: Date): VerdiLoad {
  return { source: "fixture", persisted: false, week: fixtureVerdi(now) };
}

export function currentMonday(now = new Date()): string {
  return mondayOf(osloDateKey(now));
}

function basicsFromRows(rows: BasicRow[] | null): VerdiBasic[] {
  if (!rows?.length) return DEFAULT_BASICS.map((basic) => ({ ...basic }));
  const byId = new Map(rows.map((row) => [row.id, row]));
  return DEFAULT_BASICS.map((seed) => {
    const row = byId.get(seed.id);
    const title = row?.title?.trim();
    return { id: seed.id, title: title || seed.title };
  });
}

function weekFromRows(
  monday: string,
  week: WeekRow | null,
  skips: SkipRow[],
  extras: ExtraRow[],
  basics: VerdiBasic[],
): VerdiWeek | null {
  const skipMap: Partial<Record<VerdiDaughterId, number>> = {};
  for (const row of skips) {
    if ((VERDI_DAUGHTERS as readonly string[]).includes(row.person_id)) {
      skipMap[row.person_id as VerdiDaughterId] = row.skips;
    }
  }
  const ordered = extras
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id));
  return weekFromParts({
    week: monday,
    locked: Boolean(week?.locked),
    lockedAt: week?.locked_at ?? null,
    basics,
    skips: skipMap,
    extras: ordered.map((row) => ({
      id: row.id,
      personId: row.person_id,
      title: row.title,
      amountNok: row.amount_nok,
    })),
  });
}

export async function loadVerdi(options?: { snapshot?: boolean; now?: Date }): Promise<VerdiLoad> {
  const now = options?.now ?? new Date();
  if (options?.snapshot) return fixtureLoad(now);
  const supabase = getSupabase();
  if (!supabase) return fixtureLoad(now);
  const monday = currentMonday(now);

  const [weekResult, skipResult, extraResult, basicResult] = await Promise.all([
    supabase.from("verdi_week").select("id, locked, locked_at").eq("id", monday).maybeSingle(),
    supabase.from("verdi_skips").select("person_id, skips").eq("week_id", monday),
    supabase.from("verdi_extras").select("id, person_id, title, amount_nok, sort_order").eq("week_id", monday),
    supabase.from("verdi_basics").select("id, title, sort_order").order("sort_order", { ascending: true }),
  ]);

  if (weekResult.error || skipResult.error || extraResult.error || basicResult.error) {
    if (weekResult.error) logFailure("verdi week read", weekResult.error);
    if (skipResult.error) logFailure("verdi skips read", skipResult.error);
    if (extraResult.error) logFailure("verdi extras read", extraResult.error);
    if (basicResult.error) logFailure("verdi basics read", basicResult.error);
    return fixtureLoad(now);
  }

  const week = weekFromRows(
    monday,
    (weekResult.data as WeekRow | null) ?? null,
    (skipResult.data as SkipRow[]) ?? [],
    (extraResult.data as ExtraRow[]) ?? [],
    basicsFromRows((basicResult.data as BasicRow[]) ?? []),
  );
  if (!week) return fixtureLoad(now);
  return { source: "supabase", persisted: true, week };
}

async function weekIsLocked(week: string): Promise<boolean | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("verdi_week").select("locked").eq("id", week).maybeSingle();
  if (error) {
    logFailure("verdi lock read", error);
    return null;
  }
  return Boolean((data as { locked?: boolean } | null)?.locked);
}

async function ensureWeek(week: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("verdi_week").upsert(
    { id: week, locked: false },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    logFailure("verdi week ensure", error);
    return false;
  }
  return true;
}

export async function saveSkip(input: unknown): Promise<WriteResult> {
  const parsed = parseSkipWrite(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  if (!(await ensureWeek(parsed.value.week))) return { persisted: false };
  const locked = await weekIsLocked(parsed.value.week);
  if (locked !== false) return { persisted: false };

  const { error } = await supabase.from("verdi_skips").upsert(
    {
      week_id: parsed.value.week,
      person_id: parsed.value.personId,
      skips: parsed.value.skips,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "week_id,person_id" },
  );
  if (error) {
    logFailure("verdi skip", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function createExtra(input: unknown): Promise<WriteResult> {
  const parsed = parseExtraCreate(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  if (!(await ensureWeek(parsed.value.week))) return { persisted: false };
  const locked = await weekIsLocked(parsed.value.week);
  if (locked !== false) return { persisted: false };

  const { data: latest, error: latestError } = await supabase
    .from("verdi_extras")
    .select("sort_order")
    .eq("week_id", parsed.value.week)
    .eq("person_id", parsed.value.personId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (latestError) {
    logFailure("verdi extra sort", latestError);
    return { persisted: false };
  }
  const sortOrder = ((latest?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1;
  const { error } = await supabase.from("verdi_extras").insert({
    id: parsed.value.id,
    week_id: parsed.value.week,
    person_id: parsed.value.personId,
    title: parsed.value.title,
    amount_nok: parsed.value.amountNok,
    sort_order: sortOrder,
  });
  if (error) {
    logFailure("verdi extra insert", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function updateExtra(input: unknown): Promise<WriteResult> {
  const parsed = parseExtraPatch(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  const locked = await weekIsLocked(parsed.value.week);
  if (locked !== false) return { persisted: false };

  const patch: { title?: string; amount_nok?: number; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.value.title !== undefined) patch.title = parsed.value.title;
  if (parsed.value.amountNok !== undefined) patch.amount_nok = parsed.value.amountNok;
  const { data, error } = await supabase
    .from("verdi_extras")
    .update(patch)
    .eq("id", parsed.value.id)
    .eq("week_id", parsed.value.week)
    .select("id");
  if (error || !data?.length) {
    if (error) logFailure("verdi extra update", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function deleteExtra(input: unknown): Promise<WriteResult> {
  const parsed = parseExtraDelete(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  const locked = await weekIsLocked(parsed.value.week);
  if (locked !== false) return { persisted: false };

  const { data, error } = await supabase
    .from("verdi_extras")
    .delete()
    .eq("id", parsed.value.id)
    .eq("week_id", parsed.value.week)
    .select("id");
  if (error || !data?.length) {
    if (error) logFailure("verdi extra delete", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function saveBasic(input: unknown): Promise<WriteResult> {
  const parsed = parseBasicWrite(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  const monday = parseMondayWeek(isRecord(input) ? input.week : null) ?? currentMonday();
  const locked = await weekIsLocked(monday);
  if (locked !== false) return { persisted: false };

  const { data, error } = await supabase.from("verdi_basics").update({ title: parsed.value.title }).eq("id", parsed.value.id).select("id");
  if (error || !data?.length) {
    if (error) logFailure("verdi basic", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function lockWeek(input: unknown): Promise<WriteResult> {
  const parsed = parseLockWrite(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  if (!(await ensureWeek(parsed.value.week))) return { persisted: false };
  const locked = await weekIsLocked(parsed.value.week);
  if (locked === null) return { persisted: false };
  if (locked) return { persisted: true };

  const { data, error } = await supabase
    .from("verdi_week")
    .update({ locked: true, locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", parsed.value.week)
    .eq("locked", false)
    .select("id");
  if (error || !data?.length) {
    if (error) logFailure("verdi lock", error);
    return { persisted: false };
  }
  return { persisted: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
