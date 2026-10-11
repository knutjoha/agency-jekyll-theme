import type { DinnerMenu, GroceryAisle, Ingredient, Meal, MenuDay, PersonId, TodoLane, TodoTask } from "../../data/types";
import { addIsoDays, parseIsoDate } from "../calendar-view";

export const DAY_IDS = ["man", "tir", "ons", "tor", "fre", "lor", "son"] as const;
const PERSON_IDS: PersonId[] = ["knut", "ulla", "amelia", "hedda", "maja"];

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export type TodoRow = {
  id: string;
  person_id: string;
  title: string;
  description: string;
  due_label: string | null;
  done: boolean;
  overdue: boolean;
  sort_order: number;
};

export type DinnerWeekRow = {
  id: string;
  starts_on: string;
  period: string;
};

export type DinnerDayRow = {
  id: string;
  weekday: string;
  date_label: string;
  sort_order: number;
  meal_id: string | null;
  meal_title: string | null;
  meal_minutes: number | null;
};

export type IngredientRow = {
  meal_id: string;
  id: string;
  name: string;
  amount: string;
  sort_order: number;
};

export type AisleRow = {
  id: string;
  label: string;
  sort_order: number;
};

export type ItemRow = {
  id: string;
  aisle_id: string;
  name: string;
  quantity: string;
  done: boolean;
  sort_order: number;
};

export type LaneTemplate = {
  personId: PersonId;
  detail: string;
};

export type DinnerDayWrite = {
  id: string;
  meal: { id: string; title: string; minutes: number } | null;
};

export type DinnerWeekWrite = {
  week: string;
  days: DinnerDayWrite[];
};

export type IngredientWrite = {
  id: string;
  name: string;
  amount: string;
};

export type DinnerDaySave = {
  week: string;
  dayId: (typeof DAY_IDS)[number];
  meal: { id: string; title: string; minutes: number };
  ingredients: IngredientWrite[];
};

export type MenuLineInput = {
  dayOrder: number;
  sortOrder: number;
  name: string;
  amount: string;
};

export type ShoppingLine = {
  id: string;
  aisleId: string;
  name: string;
  quantity: string;
  done: boolean;
  origin: "manual" | "menu";
  sortOrder: number;
};

export type TodoCreate = {
  id: string;
  personId: PersonId;
  title: string;
};

export type TodoPatch = {
  id: string;
  title?: string;
  done?: boolean;
};

export type ShoppingCreate = {
  id: string;
  aisleId: string;
  name: string;
  quantity: string;
  week: string;
};

export type ShoppingPatch = {
  id: string;
  done: boolean;
};

type Parsed<T> = { ok: true; value: T } | { ok: false };

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

function isPersonId(value: string): value is PersonId {
  return PERSON_IDS.includes(value as PersonId);
}

export function lanesFromRows(rows: TodoRow[], lanes: LaneTemplate[]): TodoLane[] {
  const grouped = new Map<string, TodoRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.person_id) ?? [];
    list.push(row);
    grouped.set(row.person_id, list);
  }

  return lanes.map((lane) => ({
    personId: lane.personId,
    detail: lane.detail,
    tasks: (grouped.get(lane.personId) ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id))
      .map(taskFromRow),
  }));
}

function taskFromRow(row: TodoRow): TodoTask {
  return {
    id: row.id,
    title: row.title,
    ...(row.due_label ? { due: row.due_label } : {}),
    ...(row.done ? { done: true } : {}),
    ...(row.overdue ? { overdue: true } : {}),
  };
}

const WEEKDAYS: { id: (typeof DAY_IDS)[number]; weekday: string }[] = [
  { id: "man", weekday: "mandag" },
  { id: "tir", weekday: "tirsdag" },
  { id: "ons", weekday: "onsdag" },
  { id: "tor", weekday: "torsdag" },
  { id: "fre", weekday: "fredag" },
  { id: "lor", weekday: "lørdag" },
  { id: "son", weekday: "søndag" },
];

export function dinnerDateLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

export function dinnerPeriod(monday: string): string {
  return `${dinnerDateLabel(monday)} – ${dinnerDateLabel(addIsoDays(monday, 6))}`;
}

export function emptyDinnerDays(monday: string): MenuDay[] {
  return WEEKDAYS.map((day, index) => ({
    id: day.id,
    weekday: day.weekday,
    date: dinnerDateLabel(addIsoDays(monday, index)),
    meal: null,
  }));
}

export function daysFromRows(
  week: DinnerWeekRow | null,
  rows: DinnerDayRow[],
  ingredients: IngredientRow[] = [],
): Pick<DinnerMenu, "startsOn" | "period" | "days"> | null {
  if (!week) return null;
  const startsOn = parseStartsOn(week.starts_on);
  if (!startsOn || !week.period) return null;
  const byId = new Map(rows.map((row) => [row.id, row]));
  if (!DAY_IDS.every((id) => byId.has(id))) return null;

  const days = DAY_IDS.map((id) => dayFromRow(byId.get(id) as DinnerDayRow, ingredients));
  if (days.some((day) => day === null)) return null;
  return { startsOn, period: week.period, days: days as MenuDay[] };
}

function dayFromRow(row: DinnerDayRow, ingredients: IngredientRow[]): MenuDay | null {
  if (!row.weekday || !row.date_label) return null;
  return {
    id: row.id,
    weekday: row.weekday,
    date: row.date_label,
    meal: mealFromRow(row, ingredients),
  };
}

function mealFromRow(row: DinnerDayRow, ingredients: IngredientRow[]): Meal | null {
  if (!row.meal_id || !row.meal_title || row.meal_minutes === null) return null;
  return {
    id: row.meal_id,
    title: row.meal_title,
    minutes: row.meal_minutes,
    ingredients: ingredientsForMeal(row.meal_id, ingredients),
  };
}

function ingredientsForMeal(mealId: string, ingredients: IngredientRow[]): Ingredient[] {
  return ingredients
    .filter((row) => row.meal_id === mealId)
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id))
    .map((row) => ({ id: row.id, name: row.name, amount: row.amount }));
}

export function normalizeMenuName(name: string): string {
  return name.trim().toLocaleLowerCase("nb-NO");
}

// Same rules as refresh_menu_shopping in supabase/dinner-weeks.sql.
export function refreshMenuItems(ingredients: MenuLineInput[], items: ShoppingLine[]): ShoppingLine[] {
  const ordered = ingredients
    .slice()
    .sort((left, right) => left.dayOrder - right.dayOrder || left.sortOrder - right.sortOrder);
  const seen = new Set<string>();
  const lines: { name: string; amount: string; norm: string }[] = [];
  for (const ingredient of ordered) {
    const name = ingredient.name.trim();
    const amount = ingredient.amount.trim();
    if (!name || !amount) continue;
    const norm = name.toLocaleLowerCase("nb-NO");
    const key = `${norm}\u0000${amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push({ name, amount, norm });
  }

  const manual = items.filter((item) => item.origin === "manual");
  const previous = items.filter((item) => item.origin === "menu");
  const menu = lines.map((line, index) => {
    const match = previous.find(
      (item) => normalizeMenuName(item.name) === line.norm && item.quantity.trim() === line.amount,
    );
    return {
      id: match?.id ?? `menu-${index + 1}`,
      aisleId: "ukemeny",
      name: line.name,
      quantity: line.amount,
      done: match?.done === true,
      origin: "menu" as const,
      sortOrder: index,
    };
  });
  return [...manual, ...menu];
}

export function parseStartsOn(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function aislesFromRows(aisles: AisleRow[], items: ItemRow[]): GroceryAisle[] | null {
  if (aisles.length === 0) return null;
  return aisles
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id))
    .map((aisle) => ({
      id: aisle.id,
      label: aisle.label,
      items: items
        .filter((item) => item.aisle_id === aisle.id)
        .slice()
        .sort((left, right) => left.sort_order - right.sort_order || left.id.localeCompare(right.id))
        .map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          ...(item.done ? { done: true } : {}),
        })),
    }));
}

export function parseTodoCreate(input: unknown): Parsed<TodoCreate> {
  if (!isRecord(input)) return { ok: false };
  const id = cleanId(input.id);
  const personId = typeof input.personId === "string" && isPersonId(input.personId) ? input.personId : null;
  const title = cleanText(input.title, 200);
  if (!id || !personId || !title) return { ok: false };
  return { ok: true, value: { id, personId, title } };
}

export function parseTodoPatch(input: unknown): Parsed<TodoPatch> {
  if (!isRecord(input)) return { ok: false };
  const id = cleanId(input.id);
  if (!id) return { ok: false };
  const patch: TodoPatch = { id };
  if ("title" in input) {
    const title = cleanText(input.title, 200);
    if (!title) return { ok: false };
    patch.title = title;
  }
  if ("done" in input) {
    if (typeof input.done !== "boolean") return { ok: false };
    patch.done = input.done;
  }
  if (patch.title === undefined && patch.done === undefined) return { ok: false };
  return { ok: true, value: patch };
}

export function parseDinnerDays(input: unknown): Parsed<DinnerWeekWrite> {
  if (!isRecord(input) || !Array.isArray(input.days) || input.days.length !== DAY_IDS.length) return { ok: false };
  const week = parseWeek(input.week);
  if (!week) return { ok: false };
  const days: DinnerDayWrite[] = [];
  for (const entry of input.days) {
    const day = parseDinnerDay(entry);
    if (!day) return { ok: false };
    days.push(day);
  }
  const ids = days.map((day) => day.id);
  if (!DAY_IDS.every((id) => ids.filter((candidate) => candidate === id).length === 1)) return { ok: false };
  const mealIds = days.flatMap((day) => (day.meal ? [day.meal.id] : []));
  if (new Set(mealIds).size !== mealIds.length) return { ok: false };
  return { ok: true, value: { week, days } };
}

function parseDinnerDay(input: unknown): DinnerDayWrite | null {
  if (!isRecord(input) || typeof input.id !== "string") return null;
  if (!DAY_IDS.includes(input.id as (typeof DAY_IDS)[number])) return null;
  if (input.meal === null) return { id: input.id, meal: null };
  if (!isRecord(input.meal)) return null;
  const meal = parseMeal(input.meal);
  if (!meal) return null;
  return { id: input.id, meal };
}

function parseMeal(input: Record<string, unknown>): { id: string; title: string; minutes: number } | null {
  const id = cleanId(input.id);
  const title = cleanText(input.title, 200);
  const minutes = input.minutes;
  if (!id || !title || typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
    return null;
  }
  return { id, title, minutes };
}

export function parseDinnerDaySave(input: unknown): Parsed<DinnerDaySave> {
  if (!isRecord(input)) return { ok: false };
  const week = parseWeek(input.week);
  if (!week || typeof input.dayId !== "string") return { ok: false };
  if (!DAY_IDS.includes(input.dayId as (typeof DAY_IDS)[number])) return { ok: false };
  if (!isRecord(input.meal)) return { ok: false };
  const meal = parseMeal(input.meal);
  if (!meal || !Array.isArray(input.ingredients)) return { ok: false };
  const ingredients: IngredientWrite[] = [];
  for (const entry of input.ingredients) {
    const ingredient = parseIngredient(entry);
    if (!ingredient) return { ok: false };
    ingredients.push(ingredient);
  }
  const ids = ingredients.map((ingredient) => ingredient.id);
  if (new Set(ids).size !== ids.length) return { ok: false };
  return {
    ok: true,
    value: { week, dayId: input.dayId as (typeof DAY_IDS)[number], meal, ingredients },
  };
}

function parseIngredient(input: unknown): IngredientWrite | null {
  if (!isRecord(input)) return null;
  const id = cleanId(input.id);
  const name = cleanText(input.name, 200);
  const amount = cleanText(input.amount, 40);
  if (!id || !name || !amount) return null;
  return { id, name, amount };
}

function parseWeek(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return parseIsoDate(value);
}

export function parseShoppingCreate(input: unknown): Parsed<ShoppingCreate> {
  if (!isRecord(input)) return { ok: false };
  const id = cleanId(input.id);
  const aisleId = cleanId(input.aisleId);
  const name = cleanText(input.name, 200);
  const quantity = cleanText(input.quantity, 40);
  const week = parseWeek(input.week);
  if (!id || !aisleId || !name || !quantity || !week) return { ok: false };
  return { ok: true, value: { id, aisleId, name, quantity, week } };
}

export function parseShoppingPatch(input: unknown): Parsed<ShoppingPatch> {
  if (!isRecord(input)) return { ok: false };
  const id = cleanId(input.id);
  if (!id || typeof input.done !== "boolean") return { ok: false };
  return { ok: true, value: { id, done: input.done } };
}
