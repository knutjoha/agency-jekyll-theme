import { calendarWeek } from "../data/calendar";
import { people } from "../data/fixture";
import type { CalendarEvent, CalendarPayload, CalendarWeek, PersonId } from "../data/types";
import { osloDateKey, osloParts } from "./oslo";

const PERSON_ORDER: PersonId[] = ["amelia", "hedda", "maja", "knut", "ulla"];

const PERSON_PATTERNS: { id: PersonId; pattern: RegExp }[] = [
  { id: "amelia", pattern: /\bamelia\b/i },
  { id: "hedda", pattern: /\bhedda\b/i },
  { id: "maja", pattern: /\bmaja\b/i },
  { id: "knut", pattern: /\bknut\b/i },
  { id: "ulla", pattern: /\bulla(?:[\s-]+marie)?\b/i },
];

export type CalendarEventInput = {
  summary?: string;
  description?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

type TimedEvent = {
  title: string;
  people: PersonId[];
  kind: "timed";
  start: Date;
  end: Date;
};

type AllDayEvent = {
  title: string;
  people: PersonId[];
  kind: "allday";
  startDate: string;
  endDate: string;
};

type PlacedEvent = TimedEvent | AllDayEvent;

export function parseIsoDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return value;
}

export function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function mondayOf(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (weekday - 1));
  return date.toISOString().slice(0, 10);
}

export function fixturePayload(): CalendarPayload {
  return {
    source: "fixture",
    todayPeople: people,
    week: calendarWeek,
  };
}

export function isCalendarPayload(value: unknown): value is CalendarPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as CalendarPayload;
  return (
    (payload.source === "google" || payload.source === "fixture") &&
    Array.isArray(payload.todayPeople) &&
    payload.todayPeople.length === PERSON_ORDER.length &&
    typeof payload.week?.startsOn === "string" &&
    Array.isArray(payload.week.rows) &&
    payload.week.rows.length === PERSON_ORDER.length &&
    payload.week.rows.every((row) => Array.isArray(row.days) && row.days.length === 7)
  );
}

export function peopleNamedIn(text: string): PersonId[] {
  return PERSON_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ id }) => id);
}

function eventTitle(event: CalendarEventInput): string {
  const title = event.summary?.replace(/\s+/g, " ").trim();
  return title || "Uten tittel";
}

function peopleFor(event: CalendarEventInput): PersonId[] {
  const named = peopleNamedIn(`${event.summary ?? ""}\n${event.description ?? ""}`);
  return named.length > 0 ? named : PERSON_ORDER;
}

function placeEvent(event: CalendarEventInput): PlacedEvent | null {
  if (event.status === "cancelled") return null;
  const title = eventTitle(event);
  const peopleIds = peopleFor(event);
  const startTime = event.start?.dateTime;
  if (startTime) {
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) return null;
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(start.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(end.getTime()) || end <= start) {
      return { title, people: peopleIds, kind: "timed", start, end: new Date(start.getTime() + 60 * 60 * 1000) };
    }
    return { title, people: peopleIds, kind: "timed", start, end };
  }

  const startDate = event.start?.date ? parseIsoDate(event.start.date) : null;
  if (!startDate) return null;
  const endDate = event.end?.date && parseIsoDate(event.end.date) ? event.end.date : addIsoDays(startDate, 1);
  if (endDate <= startDate) return null;
  return { title, people: peopleIds, kind: "allday", startDate, endDate };
}

function coversDay(event: PlacedEvent, iso: string): boolean {
  if (event.kind === "allday") return iso >= event.startDate && iso < event.endDate;
  const endOnDay = new Date(event.end.getTime() - 1);
  return iso >= osloDateKey(event.start) && iso <= osloDateKey(endOnDay);
}

function timeLabel(event: PlacedEvent, iso: string): string | null {
  if (event.kind === "allday") return null;
  if (osloDateKey(event.start) !== iso) return null;
  const parts = osloParts(event.start);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  const rank = (time: string | null) => time ?? "";
  const byTime = rank(a.time).localeCompare(rank(b.time));
  if (byTime !== 0) return byTime;
  return a.title.localeCompare(b.title, "nb");
}

function eventsForPerson(events: CalendarEventInput[], personId: PersonId, iso: string): CalendarEvent[] {
  const placed = events.flatMap((event) => {
    const item = placeEvent(event);
    if (!item || !item.people.includes(personId) || !coversDay(item, iso)) return [];
    return [{ time: timeLabel(item, iso), title: item.title }];
  });
  return placed.sort(compareEvents);
}

export function buildLivePayload(
  weekEvents: CalendarEventInput[],
  todayEvents: CalendarEventInput[],
  now: Date,
  weekStart: string,
): CalendarPayload {
  const today = osloDateKey(now);
  const details = new Map(calendarWeek.rows.map((row) => [row.personId, row.detail]));
  const days = Array.from({ length: 7 }, (_, index) => addIsoDays(weekStart, index));

  const week: CalendarWeek = {
    startsOn: weekStart,
    notice: "",
    rows: people.map((person) => ({
      personId: person.id,
      detail: details.get(person.id) ?? person.detail,
      days: days.map((iso) => ({
        blocks: eventsForPerson(weekEvents, person.id, iso).map((event) => ({
          kind: "activity" as const,
          time: event.time ?? "—",
          title: event.title,
        })),
      })),
    })),
  };

  return {
    source: "google",
    todayPeople: people.map((person) => ({
      ...person,
      events: eventsForPerson(todayEvents, person.id, today),
    })),
    week,
  };
}
