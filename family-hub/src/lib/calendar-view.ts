import { calendarWeek } from "../data/calendar";
import { people } from "../data/fixture";
import type {
  CalendarEvent,
  CalendarPayload,
  CalendarWeek,
  LaneId,
  Person,
  PersonId,
  SoonItem,
} from "../data/types";
import { osloDateKey, osloMidnightUtc, osloParts } from "./oslo";

export const SOON_LIMIT = 10;
export const SOON_HORIZON_DAYS = 365;
export const SOON_EMPTY = "Ingen kommende hendelser";

const PERSON_ORDER: PersonId[] = ["amelia", "hedda", "maja", "knut", "ulla"];
const LIVE_LANES: LaneId[] = [...PERSON_ORDER, "family"];

const NAME_SOURCE = "amelia|hedda|maja|knut|ulla(?:[ -]+marie)?";
const LANE_PREFIX = new RegExp(`^(${NAME_SOURCE}):`, "i");
const JOINED_NAMES = new RegExp(
  `\\b(?:${NAME_SOURCE})(?:\\s+(?:and|og)\\s+(?:${NAME_SOURCE}))+\\b`,
  "gi",
);

const FAMILY_LANE: Person = {
  id: "family",
  name: "Family",
  initial: "F",
  detail: "",
  colorToken: "--text-muted",
  events: [],
};

export type CalendarEventInput = {
  summary?: string;
  description?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

type TimedEvent = {
  title: string;
  lanes: LaneId[];
  kind: "timed";
  start: Date;
  end: Date;
};

type AllDayEvent = {
  title: string;
  lanes: LaneId[];
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
    soon: [],
  };
}

export function isCalendarPayload(value: unknown): value is CalendarPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as CalendarPayload;
  if (payload.source !== "google" && payload.source !== "fixture") return false;
  const lanes = payload.source === "google" ? LIVE_LANES : PERSON_ORDER;
  return (
    Array.isArray(payload.todayPeople) &&
    payload.todayPeople.length === lanes.length &&
    payload.todayPeople.every((person, index) => person?.id === lanes[index]) &&
    typeof payload.week?.startsOn === "string" &&
    Array.isArray(payload.week.rows) &&
    payload.week.rows.length === lanes.length &&
    payload.week.rows.every(
      (row, index) => row?.personId === lanes[index] && Array.isArray(row.days) && row.days.length === 7,
    ) &&
    (payload.soon === undefined || Array.isArray(payload.soon))
  );
}

function isoDayDiff(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

function dateLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

function relativeLabel(days: number): string {
  if (days <= 0) return "i dag";
  if (days === 1) return "i morgen";
  return `om ${days} dager`;
}

function laneNames(lanes: LaneId[]): string {
  return lanes.map((id) => calendarLane(id).name).join(" og ");
}

function soonMeta(lanes: LaneId[], time: string | null, days: number): string {
  return [laneNames(lanes), time, relativeLabel(days)].filter(Boolean).join(" · ");
}

export function upcomingSoon(events: CalendarEventInput[], now: Date): SoonItem[] {
  const today = osloDateKey(now);
  const ranked: { sort: number; title: string; item: SoonItem }[] = [];

  for (const event of events) {
    const placed = placeEvent(event);
    if (!placed) continue;

    let dateIso: string;
    let sort: number;
    let time: string | null;

    if (placed.kind === "timed") {
      if (placed.start.getTime() < now.getTime()) continue;
      dateIso = osloDateKey(placed.start);
      sort = placed.start.getTime();
      time = timeLabel(placed, dateIso);
    } else {
      if (placed.startDate < today) continue;
      dateIso = placed.startDate;
      sort = osloMidnightUtc(placed.startDate).getTime();
      time = null;
    }

    const days = isoDayDiff(today, dateIso);
    ranked.push({
      sort,
      title: placed.title,
      item: {
        date: dateLabel(dateIso),
        dotToken: calendarLane(placed.lanes[0] ?? "family").colorToken,
        title: placed.title,
        meta: soonMeta(placed.lanes, time, days),
      },
    });
  }

  ranked.sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "nb"));
  return ranked.slice(0, SOON_LIMIT).map((entry) => entry.item);
}

export function calendarLane(id: LaneId): Person {
  if (id === "family") return FAMILY_LANE;
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

function personIdFromName(name: string): PersonId {
  const head = name.toLowerCase();
  if (head === "amelia" || head === "hedda" || head === "maja" || head === "knut") return head;
  return "ulla";
}

function joinedPeople(title: string): PersonId[] {
  const ids: PersonId[] = [];
  for (const match of title.matchAll(new RegExp(JOINED_NAMES.source, "gi"))) {
    for (const part of match[0].split(/\s+(?:and|og)\s+/i)) {
      const id = personIdFromName(part);
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return PERSON_ORDER.filter((id) => ids.includes(id));
}

function lanesForTitle(title: string): LaneId[] {
  const prefix = LANE_PREFIX.exec(title);
  if (prefix) return [personIdFromName(prefix[1])];
  const joined = joinedPeople(title);
  return joined.length > 0 ? joined : ["family"];
}

export function peopleNamedIn(text: string): PersonId[] {
  return lanesForTitle(text.replace(/\s+/g, " ").trim()).filter((lane): lane is PersonId => lane !== "family");
}

function eventTitle(event: CalendarEventInput): string {
  const title = event.summary?.replace(/\s+/g, " ").trim();
  return title || "Uten tittel";
}

function peopleFor(event: CalendarEventInput): LaneId[] {
  return lanesForTitle(eventTitle(event));
}

function placeEvent(event: CalendarEventInput): PlacedEvent | null {
  if (event.status === "cancelled") return null;
  const title = eventTitle(event);
  const lanes = peopleFor(event);
  const startTime = event.start?.dateTime;
  if (startTime) {
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) return null;
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(start.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(end.getTime()) || end <= start) {
      return { title, lanes, kind: "timed", start, end: new Date(start.getTime() + 60 * 60 * 1000) };
    }
    return { title, lanes, kind: "timed", start, end };
  }

  const startDate = event.start?.date ? parseIsoDate(event.start.date) : null;
  if (!startDate) return null;
  const endDate = event.end?.date && parseIsoDate(event.end.date) ? event.end.date : addIsoDays(startDate, 1);
  if (endDate <= startDate) return null;
  return { title, lanes, kind: "allday", startDate, endDate };
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

function eventsForPerson(events: CalendarEventInput[], laneId: LaneId, iso: string): CalendarEvent[] {
  const placed = events.flatMap((event) => {
    const item = placeEvent(event);
    if (!item || !item.lanes.includes(laneId) || !coversDay(item, iso)) return [];
    return [{ time: timeLabel(item, iso), title: item.title }];
  });
  return placed.sort(compareEvents);
}

function activityDays(events: CalendarEventInput[], laneId: LaneId, days: string[]) {
  return days.map((iso) => ({
    blocks: eventsForPerson(events, laneId, iso).map((event) => ({
      kind: "activity" as const,
      time: event.time ?? "—",
      title: event.title,
    })),
  }));
}

export function buildLivePayload(
  weekEvents: CalendarEventInput[],
  todayEvents: CalendarEventInput[],
  now: Date,
  weekStart: string,
  upcomingEvents: CalendarEventInput[] = [],
): CalendarPayload {
  const today = osloDateKey(now);
  const details = new Map(calendarWeek.rows.map((row) => [row.personId, row.detail]));
  const days = Array.from({ length: 7 }, (_, index) => addIsoDays(weekStart, index));

  const week: CalendarWeek = {
    startsOn: weekStart,
    notice: "",
    rows: [
      ...people.map((person) => ({
        personId: person.id,
        detail: details.get(person.id) ?? person.detail,
        days: activityDays(weekEvents, person.id, days),
      })),
      {
        personId: "family",
        detail: "",
        days: activityDays(weekEvents, "family", days),
      },
    ],
  };

  return {
    source: "google",
    todayPeople: [
      ...people.map((person) => ({
        ...person,
        events: eventsForPerson(todayEvents, person.id, today),
      })),
      {
        ...calendarLane("family"),
        events: eventsForPerson(todayEvents, "family", today),
      },
    ],
    week,
    soon: upcomingSoon(upcomingEvents, now),
  };
}
