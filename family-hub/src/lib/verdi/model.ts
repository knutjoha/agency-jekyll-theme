import { addIsoDays, mondayOf, parseIsoDate } from "../calendar-view";
import { isoWeekNumber, osloDateKey } from "../oslo";

export const BASE_NOK = 50;
export const SKIP_NOK = 10;
export const MINUS = "\u2212";

export const VERDI_DAUGHTERS = ["amelia", "hedda", "maja"] as const;
export type VerdiDaughterId = (typeof VERDI_DAUGHTERS)[number];
export const POOL_ID = "pool" as const;
export type VerdiOwnerId = VerdiDaughterId | typeof POOL_ID;

export const DEFAULT_BASICS: VerdiBasic[] = [
  { id: "gangen", title: "Ryddig i gangen" },
  { id: "gymbag", title: "Ta ut av gymbagen" },
  { id: "matpakke", title: "Ta opp matpakke" },
  { id: "rommet", title: "Rydde rommet på fredag" },
];

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;
const BASIC_IDS = new Set(DEFAULT_BASICS.map((basic) => basic.id));

export type VerdiBasic = {
  id: string;
  title: string;
};

export type VerdiExtra = {
  id: string;
  title: string;
  amountNok: number;
  done: boolean;
  editing?: boolean;
};

export type VerdiLane = {
  personId: VerdiDaughterId;
  skips: number;
  extras: VerdiExtra[];
};

export type VerdiWeek = {
  week: string;
  period: string;
  weekNumber: number;
  locked: boolean;
  lockedAt: string | null;
  basics: VerdiBasic[];
  pool: VerdiExtra[];
  lanes: VerdiLane[];
};

type Parsed<T> = { ok: true; value: T } | { ok: false };

export type SkipWrite = { week: string; personId: VerdiDaughterId; skips: number };
export type ExtraCreate = { week: string; personId: VerdiOwnerId; id: string; title: string; amountNok: number; done?: boolean };
export type ExtraPatch = { week: string; id: string; title?: string; amountNok?: number; personId?: VerdiOwnerId; done?: boolean };
export type ExtraDelete = { week: string; id: string };
export type BasicWrite = { id: string; title: string };
export type LockWrite = { week: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > max || text.includes("\u0000")) return null;
  return text;
}

function cleanId(value: unknown): string | null {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) return null;
  return value;
}

export function isVerdiDaughter(value: string): value is VerdiDaughterId {
  return (VERDI_DAUGHTERS as readonly string[]).includes(value);
}

export function isVerdiOwner(value: string): value is VerdiOwnerId {
  return value === POOL_ID || isVerdiDaughter(value);
}

export function extrasSum(extras: { amountNok: number; done?: boolean }[]): number {
  return extras.reduce((sum, extra) => sum + (extra.done ? extra.amountNok : 0), 0);
}

export function shownNok(skips: number, extras: { amountNok: number; done?: boolean }[]): number {
  return BASE_NOK + extrasSum(extras) - SKIP_NOK * clampSkips(skips);
}

export function clampSkips(skips: number): number {
  if (!Number.isSafeInteger(skips) || skips < 0) return 0;
  return skips;
}

export function nextSkips(skips: number, delta: 1 | -1): number {
  return clampSkips(clampSkips(skips) + delta);
}

export function skipLabel(skips: number): string {
  const count = clampSkips(skips);
  if (count === 0) return "0";
  return `${MINUS}${SKIP_NOK * count}`;
}

export function formatKr(amount: number): string {
  const abs = Math.abs(amount);
  if (amount < 0) return `${MINUS}${abs} kr`;
  return `${abs} kr`;
}

export function extraDraftValid(title: string, amountText: string): boolean {
  return Boolean(cleanText(title, 200) && parseAmount(amountText) !== null);
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 1) return null;
    return value;
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^[1-9]\d{0,14}$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isSafeInteger(amount) || amount < 1) return null;
  return amount;
}

export function parseMondayWeek(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const iso = parseIsoDate(value);
  if (!iso) return null;
  return mondayOf(iso) === iso ? iso : null;
}

function dateLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

export function verdiWeekMeta(monday: string): { week: string; period: string; weekNumber: number } {
  const [year, month, day] = monday.split("-").map(Number);
  return {
    week: monday,
    period: `${dateLabel(monday)} – ${dateLabel(addIsoDays(monday, 6))}`,
    weekNumber: isoWeekNumber(year, month, day),
  };
}

export function emptyLanes(): VerdiLane[] {
  return VERDI_DAUGHTERS.map((personId) => ({ personId, skips: 0, extras: [] }));
}

export function emptyWeek(now = new Date()): VerdiWeek {
  const monday = mondayOf(osloDateKey(now));
  return {
    ...verdiWeekMeta(monday),
    locked: false,
    lockedAt: null,
    basics: DEFAULT_BASICS.map((basic) => ({ ...basic })),
    pool: [],
    lanes: emptyLanes(),
  };
}

export function asExtra(input: { id: string; title: string; amountNok: number; done?: boolean }): VerdiExtra | null {
  const id = cleanId(input.id);
  const title = cleanText(input.title, 200);
  if (!id || !title || !Number.isSafeInteger(input.amountNok) || input.amountNok < 1) return null;
  return { id, title, amountNok: input.amountNok, done: Boolean(input.done) };
}

export function weekFromParts(input: {
  week: string;
  locked?: boolean;
  lockedAt?: string | null;
  basics?: VerdiBasic[] | null;
  skips?: Partial<Record<VerdiDaughterId, number>>;
  extras?: { id: string; personId: string; title: string; amountNok: number; done?: boolean }[];
}): VerdiWeek | null {
  const monday = parseMondayWeek(input.week);
  if (!monday) return null;
  const basics = normalizedBasics(input.basics);
  const extrasByPerson = new Map<VerdiDaughterId, VerdiExtra[]>();
  const pool: VerdiExtra[] = [];
  for (const personId of VERDI_DAUGHTERS) extrasByPerson.set(personId, []);
  for (const extra of input.extras ?? []) {
    const parsed = asExtra(extra);
    if (!parsed || !isVerdiOwner(extra.personId)) continue;
    if (extra.personId === POOL_ID) {
      pool.push(parsed);
      continue;
    }
    extrasByPerson.get(extra.personId)?.push(parsed);
  }
  return {
    ...verdiWeekMeta(monday),
    locked: Boolean(input.locked),
    lockedAt: input.lockedAt ?? null,
    basics,
    pool,
    lanes: VERDI_DAUGHTERS.map((personId) => ({
      personId,
      skips: clampSkips(input.skips?.[personId] ?? 0),
      extras: extrasByPerson.get(personId) ?? [],
    })),
  };
}

function normalizedBasics(basics: VerdiBasic[] | null | undefined): VerdiBasic[] {
  const byId = new Map((basics ?? []).map((basic) => [basic.id, cleanText(basic.title, 200)]));
  return DEFAULT_BASICS.map((seed) => {
    const title = byId.get(seed.id);
    return { id: seed.id, title: title || seed.title };
  });
}

export function parseSkipWrite(input: unknown): Parsed<SkipWrite> {
  if (!isRecord(input)) return { ok: false };
  const week = parseMondayWeek(input.week);
  const personId = typeof input.personId === "string" && isVerdiDaughter(input.personId) ? input.personId : null;
  const skips = input.skips;
  if (!week || !personId || typeof skips !== "number" || !Number.isSafeInteger(skips) || skips < 0) return { ok: false };
  return { ok: true, value: { week, personId, skips } };
}

export function parseExtraCreate(input: unknown): Parsed<ExtraCreate> {
  if (!isRecord(input)) return { ok: false };
  const week = parseMondayWeek(input.week);
  const personId = typeof input.personId === "string" && isVerdiOwner(input.personId) ? input.personId : null;
  const id = cleanId(input.id);
  const title = cleanText(input.title, 200);
  const amountNok = parseAmount(input.amountNok);
  if (!week || !personId || !id || !title || amountNok === null) return { ok: false };
  let done = false;
  if ("done" in input) {
    if (typeof input.done !== "boolean") return { ok: false };
    done = input.done;
  }
  if (personId === POOL_ID) done = false;
  return { ok: true, value: { week, personId, id, title, amountNok, done } };
}

export function parseExtraPatch(input: unknown): Parsed<ExtraPatch> {
  if (!isRecord(input)) return { ok: false };
  const week = parseMondayWeek(input.week);
  const id = cleanId(input.id);
  if (!week || !id) return { ok: false };
  const patch: ExtraPatch = { week, id };
  if ("title" in input) {
    const title = cleanText(input.title, 200);
    if (!title) return { ok: false };
    patch.title = title;
  }
  if ("amountNok" in input) {
    const amountNok = parseAmount(input.amountNok);
    if (amountNok === null) return { ok: false };
    patch.amountNok = amountNok;
  }
  if ("personId" in input) {
    if (typeof input.personId !== "string" || !isVerdiOwner(input.personId)) return { ok: false };
    patch.personId = input.personId;
  }
  if ("done" in input) {
    if (typeof input.done !== "boolean") return { ok: false };
    patch.done = input.done;
  }
  if (patch.personId === POOL_ID) patch.done = false;
  if (patch.title === undefined && patch.amountNok === undefined && patch.personId === undefined && patch.done === undefined) {
    return { ok: false };
  }
  return { ok: true, value: patch };
}

export function parseExtraDelete(input: unknown): Parsed<ExtraDelete> {
  if (!isRecord(input)) return { ok: false };
  const week = parseMondayWeek(input.week);
  const id = cleanId(input.id);
  if (!week || !id) return { ok: false };
  return { ok: true, value: { week, id } };
}

export function parseBasicWrite(input: unknown): Parsed<BasicWrite> {
  if (!isRecord(input)) return { ok: false };
  const id = typeof input.id === "string" && BASIC_IDS.has(input.id) ? input.id : null;
  const title = cleanText(input.title, 200);
  if (!id || !title) return { ok: false };
  return { ok: true, value: { id, title } };
}

export function parseLockWrite(input: unknown): Parsed<LockWrite> {
  if (!isRecord(input)) return { ok: false };
  const week = parseMondayWeek(input.week);
  if (!week) return { ok: false };
  return { ok: true, value: { week } };
}

export function writesAllowed(locked: boolean): boolean {
  return !locked;
}
