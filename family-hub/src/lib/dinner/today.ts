import type { Dinner, MenuDay } from "../../data/types";
import { addIsoDays, parseIsoDate } from "../calendar-view";
import type { OsloNow } from "../oslo";

export const DINNER_EMPTY_LABEL = "Ledig";

export type DinnerWeekPayload = {
  persisted: boolean;
  week: string;
  days: MenuDay[];
};

export function todayIsoFromClock(clock: Pick<OsloNow, "numericDate">): string | null {
  const [day, month, year] = clock.numericDate.split(".");
  if (!day || !month || !year) return null;
  return parseIsoDate(`${year}-${month}-${day}`);
}

export function todayMenuDay(days: MenuDay[], week: string, todayIso: string): MenuDay | null {
  const index = days.findIndex((_, offset) => addIsoDays(week, offset) === todayIso);
  if (index < 0) return null;
  return days[index] ?? null;
}

export function dinnerTileForToday(days: MenuDay[], week: string, todayIso: string): Dinner {
  const meal = todayMenuDay(days, week, todayIso)?.meal;
  if (!meal) return { dish: "", shoppingCount: 0 };
  return { dish: meal.title, shoppingCount: meal.ingredients.length };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMenuDay(value: unknown): value is MenuDay {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.weekday !== "string" || typeof value.date !== "string") {
    return false;
  }
  if (value.meal === null) return true;
  if (!isRecord(value.meal)) return false;
  if (typeof value.meal.id !== "string" || typeof value.meal.title !== "string") return false;
  if (typeof value.meal.minutes !== "number") return false;
  return Array.isArray(value.meal.ingredients);
}

export function isDinnerWeekPayload(value: unknown): value is DinnerWeekPayload {
  if (!isRecord(value) || typeof value.week !== "string" || !parseIsoDate(value.week)) return false;
  if (typeof value.persisted !== "boolean") return false;
  if (!Array.isArray(value.days) || value.days.length !== 7) return false;
  return value.days.every(isMenuDay);
}
