import type { DinnerMenu, GroceryAisle, Meal, MenuDay, PersonId, TodoLane, TodoTask } from "../../data/types";

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
  meal_diets: string[] | null;
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
  meal: { id: string; title: string; minutes: number; diets: string[] } | null;
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

export function daysFromRows(
  week: DinnerWeekRow | null,
  rows: DinnerDayRow[],
): Pick<DinnerMenu, "startsOn" | "period" | "days"> | null {
  if (!week) return null;
  const startsOn = parseStartsOn(week.starts_on);
  if (!startsOn || !week.period) return null;
  const byId = new Map(rows.map((row) => [row.id, row]));
  if (!DAY_IDS.every((id) => byId.has(id))) return null;

  const days = DAY_IDS.map((id) => dayFromRow(byId.get(id) as DinnerDayRow));
  if (days.some((day) => day === null)) return null;
  return { startsOn, period: week.period, days: days as MenuDay[] };
}

function dayFromRow(row: DinnerDayRow): MenuDay | null {
  if (!row.weekday || !row.date_label) return null;
  return {
    id: row.id,
    weekday: row.weekday,
    date: row.date_label,
    meal: mealFromRow(row),
  };
}

function mealFromRow(row: DinnerDayRow): Meal | null {
  if (!row.meal_id || !row.meal_title || row.meal_minutes === null) return null;
  return {
    id: row.meal_id,
    title: row.meal_title,
    minutes: row.meal_minutes,
    diets: row.meal_diets ?? [],
  };
}

function parseStartsOn(value: string): { year: number; month: number; day: number } | null {
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

export function parseDinnerDays(input: unknown): Parsed<DinnerDayWrite[]> {
  if (!isRecord(input) || !Array.isArray(input.days) || input.days.length !== DAY_IDS.length) return { ok: false };
  const days: DinnerDayWrite[] = [];
  for (const entry of input.days) {
    const day = parseDinnerDay(entry);
    if (!day) return { ok: false };
    days.push(day);
  }
  const ids = days.map((day) => day.id);
  if (!DAY_IDS.every((id) => ids.filter((candidate) => candidate === id).length === 1)) return { ok: false };
  return { ok: true, value: days };
}

function parseDinnerDay(input: unknown): DinnerDayWrite | null {
  if (!isRecord(input) || typeof input.id !== "string") return null;
  if (!DAY_IDS.includes(input.id as (typeof DAY_IDS)[number])) return null;
  if (input.meal === null) return { id: input.id, meal: null };
  if (!isRecord(input.meal)) return null;
  const id = cleanId(input.meal.id);
  const title = cleanText(input.meal.title, 200);
  const minutes = input.meal.minutes;
  if (!id || !title || typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
    return null;
  }
  if (!Array.isArray(input.meal.diets) || input.meal.diets.length > 8) return null;
  const diets: string[] = [];
  for (const diet of input.meal.diets) {
    const label = cleanText(diet, 40);
    if (!label) return null;
    diets.push(label);
  }
  return { id: input.id, meal: { id, title, minutes, diets } };
}

export function parseShoppingCreate(input: unknown): Parsed<ShoppingCreate> {
  if (!isRecord(input)) return { ok: false };
  const id = cleanId(input.id);
  const aisleId = cleanId(input.aisleId);
  const name = cleanText(input.name, 200);
  const quantity = cleanText(input.quantity, 40);
  if (!id || !aisleId || !name || !quantity) return { ok: false };
  return { ok: true, value: { id, aisleId, name, quantity } };
}

export function parseShoppingPatch(input: unknown): Parsed<ShoppingPatch> {
  if (!isRecord(input)) return { ok: false };
  const id = cleanId(input.id);
  if (!id || typeof input.done !== "boolean") return { ok: false };
  return { ok: true, value: { id, done: input.done } };
}
