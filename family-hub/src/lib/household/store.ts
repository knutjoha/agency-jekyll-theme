import "server-only";
import { dinnerMenu } from "@/data/middag";
import { todoLanes } from "@/data/todo";
import type { DinnerMenu, GroceryAisle, MenuDay, TodoLane } from "@/data/types";
import { mondayOf, parseIsoDate } from "@/lib/calendar-view";
import { osloDateKey } from "@/lib/oslo";
import { getSupabase } from "@/lib/supabase/admin";
import {
  aislesFromRows,
  daysFromRows,
  dinnerPeriod,
  emptyDinnerDays,
  lanesFromRows,
  parseDinnerDaySave,
  parseDinnerDays,
  parseShoppingCreate,
  parseShoppingPatch,
  parseStartsOn,
  parseTodoCreate,
  parseTodoPatch,
  type AisleRow,
  type DinnerDayRow,
  type DinnerWeekRow,
  type IngredientRow,
  type ItemRow,
  type TodoRow,
} from "./map";

export type ListSource = "supabase" | "fixture";

export type TodoLoad = {
  source: ListSource;
  persisted: boolean;
  lanes: TodoLane[];
};

export type DinnerLoad = {
  source: ListSource;
  persisted: boolean;
  week: string;
  startsOn: DinnerMenu["startsOn"];
  period: string;
  days: DinnerMenu["days"];
};

export type ShoppingLoad = {
  source: ListSource;
  persisted: boolean;
  week: string;
  aisles: GroceryAisle[];
};

export type DinnerDayResult = WriteResult & {
  week?: string;
  days?: MenuDay[];
  aisles?: GroceryAisle[];
};

export type WriteResult = {
  persisted: boolean;
};

function safeError(error: { code?: string; message?: string }): string {
  const message = error.message ?? "unknown";
  if (/sb_secret|service_role|eyJ|supabase\.co|bearer/i.test(message)) return error.code ?? "request failed";
  return `${error.code ?? ""} ${message}`.trim();
}

function logFailure(area: string, error: { code?: string; message?: string }) {
  console.error(`[family-hub] ${area} failed: ${safeError(error)}`);
}

function fixtureTodos(): TodoLoad {
  return { source: "fixture", persisted: false, lanes: todoLanes };
}

function fixtureDinner(): DinnerLoad {
  return {
    source: "fixture",
    persisted: false,
    week: "2026-09-28",
    startsOn: dinnerMenu.startsOn,
    period: dinnerMenu.period,
    days: dinnerMenu.days,
  };
}

function fixtureShopping(): ShoppingLoad {
  return { source: "fixture", persisted: false, week: "2026-09-28", aisles: dinnerMenu.aisles };
}

export function mondayFor(week: string | null | undefined, now = new Date()): string {
  const requested = week ? parseIsoDate(week) : null;
  return requested ? mondayOf(requested) : mondayOf(osloDateKey(now));
}

function dinnerShell(monday: string, period = dinnerPeriod(monday)): DinnerLoad {
  const startsOn = parseStartsOn(monday);
  if (!startsOn) return fixtureDinner();
  return {
    source: "supabase",
    persisted: true,
    week: monday,
    startsOn,
    period,
    days: emptyDinnerDays(monday),
  };
}

export async function loadTodos(options?: { snapshot?: boolean }): Promise<TodoLoad> {
  if (options?.snapshot) return fixtureTodos();
  const supabase = getSupabase();
  if (!supabase) return fixtureTodos();

  const { data, error } = await supabase
    .from("todos")
    .select("id, person_id, title, description, due_label, done, overdue, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    if (error) logFailure("todos read", error);
    return fixtureTodos();
  }

  return {
    source: "supabase",
    persisted: true,
    lanes: lanesFromRows(data as TodoRow[], todoLanes),
  };
}

export async function loadDinner(options?: { snapshot?: boolean; week?: string | null }): Promise<DinnerLoad> {
  if (options?.snapshot) return fixtureDinner();
  const supabase = getSupabase();
  if (!supabase) return fixtureDinner();
  const monday = mondayFor(options?.week);

  const [weekResult, dayResult, ingredientResult] = await Promise.all([
    supabase.from("dinner_week").select("id, starts_on, period").eq("id", monday).maybeSingle(),
    supabase
      .from("dinner_days")
      .select("id, weekday, date_label, sort_order, meal_id, meal_title, meal_minutes")
      .eq("week_id", monday),
    supabase
      .from("dinner_ingredients")
      .select("meal_id, id, name, amount, sort_order")
      .eq("week_id", monday),
  ]);

  if (weekResult.error || dayResult.error || ingredientResult.error || !dayResult.data || !ingredientResult.data) {
    if (weekResult.error) logFailure("dinner week read", weekResult.error);
    if (dayResult.error) logFailure("dinner days read", dayResult.error);
    if (ingredientResult.error) logFailure("dinner ingredients read", ingredientResult.error);
    return fixtureDinner();
  }

  const week = (weekResult.data as DinnerWeekRow | null) ?? null;
  if (!week) return dinnerShell(monday);
  const menu = daysFromRows(week, dayResult.data as DinnerDayRow[], ingredientResult.data as IngredientRow[]);
  if (!menu) {
    if (dayResult.data.length === 0) return dinnerShell(monday, week.period);
    return fixtureDinner();
  }
  return { source: "supabase", persisted: true, week: monday, ...menu };
}

export async function loadShopping(options?: { snapshot?: boolean; week?: string | null }): Promise<ShoppingLoad> {
  if (options?.snapshot) return fixtureShopping();
  const supabase = getSupabase();
  if (!supabase) return fixtureShopping();
  const monday = mondayFor(options?.week);

  const [aisleResult, itemResult] = await Promise.all([
    supabase.from("shopping_aisles").select("id, label, sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("shopping_items")
      .select("id, aisle_id, name, quantity, done, sort_order")
      .eq("week_id", monday)
      .order("sort_order", { ascending: true }),
  ]);

  if (aisleResult.error || itemResult.error || !aisleResult.data || !itemResult.data) {
    if (aisleResult.error) logFailure("shopping aisles read", aisleResult.error);
    if (itemResult.error) logFailure("shopping items read", itemResult.error);
    return fixtureShopping();
  }

  const aisles = aislesFromRows(aisleResult.data as AisleRow[], itemResult.data as ItemRow[]);
  if (!aisles) return fixtureShopping();
  return { source: "supabase", persisted: true, week: monday, aisles };
}

export async function createTodo(input: unknown): Promise<WriteResult> {
  const parsed = parseTodoCreate(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };

  const { data: latest, error: latestError } = await supabase
    .from("todos")
    .select("sort_order")
    .eq("person_id", parsed.value.personId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (latestError) {
    logFailure("todo sort", latestError);
    return { persisted: false };
  }

  const sortOrder = ((latest?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1;
  const { error } = await supabase.from("todos").insert({
    id: parsed.value.id,
    person_id: parsed.value.personId,
    title: parsed.value.title,
    description: "",
    due_label: null,
    done: false,
    overdue: false,
    sort_order: sortOrder,
  });

  if (error) {
    logFailure("todo insert", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function updateTodo(input: unknown): Promise<WriteResult> {
  const parsed = parseTodoPatch(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };

  const patch: { title?: string; done?: boolean; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.value.title !== undefined) patch.title = parsed.value.title;
  if (parsed.value.done !== undefined) patch.done = parsed.value.done;

  const { data, error } = await supabase.from("todos").update(patch).eq("id", parsed.value.id).select("id");
  if (error || !data?.length) {
    if (error) logFailure("todo update", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function saveDinner(input: unknown): Promise<WriteResult> {
  const parsed = parseDinnerDays(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };

  const { error } = await supabase.rpc("save_dinner_days", {
    week: mondayOf(parsed.value.week),
    days: parsed.value.days,
  });
  if (error) {
    logFailure("dinner save", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function saveDinnerDay(input: unknown): Promise<DinnerDayResult> {
  const parsed = parseDinnerDaySave(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };
  const week = mondayOf(parsed.value.week);

  const { error } = await supabase.rpc("save_dinner_day", {
    week,
    day_id: parsed.value.dayId,
    meal: parsed.value.meal,
    ingredients: parsed.value.ingredients,
  });
  if (error) {
    logFailure("dinner day save", error);
    return { persisted: false };
  }

  const [dinner, shopping] = await Promise.all([loadDinner({ week }), loadShopping({ week })]);
  if (!dinner.persisted || !shopping.persisted) return { persisted: true, week };
  return {
    persisted: true,
    week: dinner.week,
    days: dinner.days,
    aisles: shopping.aisles,
  };
}

export async function createShoppingItem(input: unknown): Promise<WriteResult> {
  const parsed = parseShoppingCreate(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };

  const week = mondayOf(parsed.value.week);
  const { error: weekError } = await supabase.from("dinner_week").upsert(
    { id: week, starts_on: week, period: dinnerPeriod(week) },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (weekError) {
    logFailure("shopping week", weekError);
    return { persisted: false };
  }

  const { data: aisle, error: aisleError } = await supabase
    .from("shopping_aisles")
    .select("id")
    .eq("id", parsed.value.aisleId)
    .maybeSingle();
  if (aisleError || !aisle) {
    if (aisleError) logFailure("shopping aisle", aisleError);
    return { persisted: false };
  }

  const { data: latest, error: latestError } = await supabase
    .from("shopping_items")
    .select("sort_order")
    .eq("week_id", week)
    .eq("aisle_id", parsed.value.aisleId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (latestError) {
    logFailure("shopping sort", latestError);
    return { persisted: false };
  }

  const sortOrder = ((latest?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1;
  const { error } = await supabase.from("shopping_items").insert({
    id: parsed.value.id,
    aisle_id: parsed.value.aisleId,
    name: parsed.value.name,
    quantity: parsed.value.quantity,
    done: false,
    sort_order: sortOrder,
    week_id: week,
    origin: "manual",
  });
  if (error) {
    logFailure("shopping insert", error);
    return { persisted: false };
  }
  return { persisted: true };
}

export async function updateShoppingItem(input: unknown): Promise<WriteResult> {
  const parsed = parseShoppingPatch(input);
  if (!parsed.ok) return { persisted: false };
  const supabase = getSupabase();
  if (!supabase) return { persisted: false };

  const { data, error } = await supabase
    .from("shopping_items")
    .update({ done: parsed.value.done, updated_at: new Date().toISOString() })
    .eq("id", parsed.value.id)
    .select("id");
  if (error || !data?.length) {
    if (error) logFailure("shopping update", error);
    return { persisted: false };
  }
  return { persisted: true };
}
