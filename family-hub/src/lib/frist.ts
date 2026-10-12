import { addIsoDays, parseIsoDate } from "./calendar-view";

const WEEKDAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"] as const;
const SHORT_WEEKDAYS = ["søn", "man", "tir", "ons", "tor", "fre", "lør"] as const;

/** A real `YYYY-MM-DD`, `null` when the field is empty, or `undefined` when the value is not a date. */
export function parseDueOn(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return parseIsoDate(value) ?? undefined;
}

export function weekdayIndex(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function dayNumber(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86400000);
}

/** Monday after `today`. When today is Monday, the Monday seven days ahead. */
export function nextMonday(today: string): string {
  const weekday = weekdayIndex(today) || 7;
  const add = weekday === 1 ? 7 : 8 - weekday;
  return addIsoDays(today, add);
}

export function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

/** Shortcut secondary text. `withWeekday` adds `lør 03.10`; otherwise `DD.MM` only. */
export function shortcutStamp(iso: string, withWeekday: boolean): string {
  const numeric = shortDate(iso);
  if (!withWeekday) return numeric;
  return `${SHORT_WEEKDAYS[weekdayIndex(iso)]} ${numeric}`;
}

export function fristLabel(dueOn: string | null | undefined, today: string): string | null {
  if (!dueOn || parseDueOn(dueOn) === undefined || !parseIsoDate(today)) return null;
  const diff = dayNumber(dueOn) - dayNumber(today);
  if (diff === -1) return "i går";
  if (diff === 0) return "i dag";
  if (diff === 1) return "i morgen";
  if (diff >= 2 && diff <= 6) return WEEKDAYS[weekdayIndex(dueOn)];
  return shortDate(dueOn);
}

export function fristButtonLabel(dueOn: string | null | undefined, today: string): string {
  const label = dueOn ? fristLabel(dueOn, today) : null;
  if (!label) return "Frist";
  const first = label.charAt(0);
  if (first >= "0" && first <= "9") return label;
  return first.toLocaleUpperCase("nb-NO") + label.slice(1);
}

export function isOverdue(dueOn: string | null | undefined, today: string): boolean {
  if (!dueOn || parseDueOn(dueOn) === undefined || !parseIsoDate(today)) return false;
  return dueOn < today;
}

export function dueFields(
  dueOn: string | null,
  today: string,
): { dueOn?: string; due?: string; overdue?: boolean } {
  if (!dueOn) return { dueOn: undefined, due: undefined, overdue: undefined };
  const due = fristLabel(dueOn, today) ?? undefined;
  return { dueOn, due, overdue: isOverdue(dueOn, today) ? true : undefined };
}
