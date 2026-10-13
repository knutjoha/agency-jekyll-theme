import assert from "node:assert/strict";
import test from "node:test";
import { people } from "../data/fixture";
import { calendarWeek } from "../data/calendar";
import { osloMidnightUtc } from "./oslo";
import type { CalendarPayload, LaneId } from "../data/types";
import {
  addIsoDays,
  buildLivePayload,
  fixturePayload,
  isCalendarPayload,
  mondayOf,
  parseIsoDate,
  peopleNamedIn,
  upcomingSoon,
} from "./calendar-view";
import { readGoogleCredentials } from "./google-calendar";

test("Oslo midnight follows daylight saving", () => {
  assert.equal(osloMidnightUtc("2026-10-03").toISOString(), "2026-10-02T22:00:00.000Z");
  assert.equal(osloMidnightUtc("2026-11-01").toISOString(), "2026-10-31T23:00:00.000Z");
});

test("11 October 2026 is the week of 5 October and steps seven days", () => {
  assert.equal(mondayOf("2026-10-11"), "2026-10-05");
  assert.equal(addIsoDays(mondayOf("2026-10-11"), 7), "2026-10-12");
  assert.equal(addIsoDays("2026-10-12", -7), "2026-10-05");
});

test("monday of the snapshot saturday is 28 September 2026", () => {
  assert.equal(mondayOf("2026-10-03"), "2026-09-28");
  assert.equal(mondayOf("2026-09-28"), "2026-09-28");
  assert.equal(addIsoDays("2026-09-28", 6), "2026-10-04");
  assert.equal(parseIsoDate("2026-02-31"), null);
  assert.equal(parseIsoDate("2026-10-03"), "2026-10-03");
});

test("a title prefix decides one row", () => {
  assert.deepEqual(peopleNamedIn("Amelia: Håndballkamp"), ["amelia"]);
  assert.deepEqual(peopleNamedIn("Knut:Trening"), ["knut"]);
  assert.deepEqual(peopleNamedIn("knut: Trening"), ["knut"]);
  assert.deepEqual(peopleNamedIn("Ulla:"), ["ulla"]);
  assert.deepEqual(peopleNamedIn("Ulla Marie:"), ["ulla"]);
  assert.deepEqual(peopleNamedIn("Ulla-Marie:"), ["ulla"]);
  assert.deepEqual(peopleNamedIn("Ulla  Marie: lege"), ["ulla"]);
  assert.deepEqual(peopleNamedIn("Ulla Marie arbeid"), []);
  assert.deepEqual(peopleNamedIn("Amelia og Hedda kamp"), ["amelia", "hedda"]);
  assert.deepEqual(peopleNamedIn("Hedda and Amelia"), ["amelia", "hedda"]);
  assert.deepEqual(peopleNamedIn("Hedda and Amelia: svømming"), ["amelia", "hedda"]);
  assert.deepEqual(peopleNamedIn("Familiekveld"), []);
  assert.deepEqual(peopleNamedIn("Knutsson"), []);
  assert.deepEqual(peopleNamedIn("Knutsson:"), []);
  assert.deepEqual(peopleNamedIn("Knut : jobb"), []);
});

test("missing Google settings stay on the fixture", () => {
  assert.equal(readGoogleCredentials({}), null);
  assert.equal(
    readGoogleCredentials({
      GOOGLE_CLIENT_ID: "client",
      GOOGLE_CLIENT_SECRET: "secret",
      GOOGLE_REFRESH_TOKEN: "refresh",
    }),
    null,
  );
  assert.equal(
    readGoogleCredentials({
      GOOGLE_CLIENT_ID: " ",
      GOOGLE_CLIENT_SECRET: "secret",
      GOOGLE_REFRESH_TOKEN: "refresh",
      GOOGLE_CALENDAR_ID: "calendar",
    }),
    null,
  );
  const payload = fixturePayload();
  assert.equal(payload.source, "fixture");
  assert.equal(payload.todayPeople, people);
  assert.equal(payload.week, calendarWeek);
  assert.equal(payload.todayPeople.length, 5);
  assert.equal(payload.week.rows.length, 5);
  assert.deepEqual(payload.soon, []);
  assert.equal(
    payload.todayPeople.some((person) => person.id === "family"),
    false,
  );
  assert.equal(isCalendarPayload(payload), true);
});

function titles(payload: CalendarPayload, id: LaneId): string[] {
  return payload.todayPeople.find((person) => person.id === id)?.events.map((event) => event.title) ?? [];
}

function weekTitles(payload: CalendarPayload, id: LaneId, dayIndex: number): string[] {
  const row = payload.week.rows.find((entry) => entry.personId === id);
  return (
    row?.days[dayIndex]?.blocks.flatMap((block) => (block.kind === "activity" ? [block.title] : [])) ?? []
  );
}

const SATURDAY = 5;

test("a connected calendar places named events and keeps an empty week empty", () => {
  const now = new Date("2026-10-03T05:42:00.000Z");
  const payload = buildLivePayload(
    [
      {
        summary: "Amelia: Håndballkamp",
        start: { dateTime: "2026-10-03T09:00:00+02:00" },
        end: { dateTime: "2026-10-03T10:30:00+02:00" },
      },
      {
        summary: "Familiekveld",
        description: "Knut og Ulla Marie",
        start: { dateTime: "2026-10-03T19:30:00+02:00" },
        end: { dateTime: "2026-10-03T21:00:00+02:00" },
      },
      {
        summary: "Avlyst",
        status: "cancelled",
        start: { dateTime: "2026-10-03T12:00:00+02:00" },
        end: { dateTime: "2026-10-03T13:00:00+02:00" },
      },
      {
        summary: "Høstferie",
        start: { date: "2026-10-05" },
        end: { date: "2026-10-10" },
      },
    ],
    [
      {
        summary: "Amelia: Håndballkamp",
        start: { dateTime: "2026-10-03T09:00:00+02:00" },
        end: { dateTime: "2026-10-03T10:30:00+02:00" },
      },
      {
        summary: "Familiekveld",
        description: "Knut og Ulla Marie",
        start: { dateTime: "2026-10-03T19:30:00+02:00" },
        end: { dateTime: "2026-10-03T21:00:00+02:00" },
      },
    ],
    now,
    "2026-09-28",
  );

  assert.equal(payload.source, "google");
  assert.equal(payload.week.startsOn, "2026-09-28");
  assert.equal(payload.week.notice, "");
  assert.equal(payload.week.rows[0]?.days.length, 7);

  const amelia = payload.todayPeople.find((person) => person.id === "amelia");
  assert.deepEqual(amelia?.events, [{ time: "09:00", title: "Amelia: Håndballkamp" }]);
  assert.equal(amelia?.transport?.kind, "missing");
  assert.deepEqual(titles(payload, "amelia"), ["Amelia: Håndballkamp"]);
  assert.deepEqual(weekTitles(payload, "amelia", SATURDAY), ["Amelia: Håndballkamp"]);

  assert.deepEqual(titles(payload, "knut"), []);
  assert.deepEqual(titles(payload, "ulla"), []);
  assert.deepEqual(titles(payload, "hedda"), []);
  assert.deepEqual(titles(payload, "family"), ["Familiekveld"]);
  assert.deepEqual(weekTitles(payload, "family", SATURDAY), ["Familiekveld"]);
  assert.equal(payload.week.rows[5]?.personId, "family");
  assert.equal(payload.week.rows[5]?.detail, "");
  assert.equal(
    payload.week.rows.some((row) =>
      row.days.some((day) => day.blocks.some((block) => block.kind === "activity" && block.title === "Avlyst")),
    ),
    false,
  );

  const saturday = payload.week.rows[0]?.days[5];
  assert.deepEqual(saturday?.blocks, [{ kind: "activity", time: "09:00", title: "Amelia: Håndballkamp" }]);
  assert.equal(payload.week.rows[0]?.days[0]?.blocks.length, 0);
  assert.equal(isCalendarPayload(payload), true);
});

test("an event without a name prefix goes to Family, and an empty calendar is not the fixture", () => {
  const now = new Date("2026-10-03T05:42:00.000Z");
  const household = buildLivePayload(
    [
      {
        summary: "Familiekveld",
        start: { dateTime: "2026-10-03T19:30:00+02:00" },
        end: { dateTime: "2026-10-03T21:00:00+02:00" },
      },
    ],
    [
      {
        summary: "Familiekveld",
        start: { dateTime: "2026-10-03T19:30:00+02:00" },
        end: { dateTime: "2026-10-03T21:00:00+02:00" },
      },
    ],
    now,
    "2026-09-28",
  );
  assert.deepEqual(titles(household, "family"), ["Familiekveld"]);
  assert.equal(
    household.todayPeople.filter((person) => person.id !== "family").every((person) => person.events.length === 0),
    true,
  );

  const empty = buildLivePayload([], [], now, "2026-09-28");
  assert.equal(empty.source, "google");
  assert.equal(empty.todayPeople.length, 6);
  assert.equal(empty.week.rows.length, 6);
  assert.deepEqual(
    empty.todayPeople.map((person) => person.id),
    ["amelia", "hedda", "maja", "knut", "ulla", "family"],
  );
  assert.deepEqual(
    empty.week.rows.map((row) => row.personId),
    ["amelia", "hedda", "maja", "knut", "ulla", "family"],
  );
  assert.equal(empty.week.rows[5]?.detail, "");
  assert.equal(empty.week.rows[0]?.detail, "8A Ringstabekk");
  assert.equal(
    empty.todayPeople.every((person) => person.events.length === 0),
    true,
  );
  assert.equal(
    empty.week.rows.every((row) => row.days.every((day) => day.blocks.length === 0)),
    true,
  );
  assert.notEqual(empty.todayPeople[0]?.events, people[0]?.events);
  assert.notEqual(empty.week, calendarWeek);
  assert.equal(isCalendarPayload(empty), true);
  assert.deepEqual(empty.soon, []);
  const withoutSoon = { ...empty } as { soon?: unknown };
  delete withoutSoon.soon;
  assert.equal(isCalendarPayload(withoutSoon), true);
  assert.equal(
    isCalendarPayload({
      ...empty,
      todayPeople: empty.todayPeople.slice(0, 5),
      week: { ...empty.week, rows: empty.week.rows.slice(0, 5) },
    }),
    false,
  );
});

test("all-day events use the em dash and stay inside Google's exclusive end date", () => {
  const now = new Date("2026-10-05T08:00:00.000Z");
  const payload = buildLivePayload(
    [
      {
        summary: "Maja leirskole",
        start: { date: "2026-10-05" },
        end: { date: "2026-10-07" },
      },
    ],
    [
      {
        summary: "Maja leirskole",
        start: { date: "2026-10-05" },
        end: { date: "2026-10-07" },
      },
    ],
    now,
    "2026-10-05",
  );
  const family = payload.todayPeople.find((person) => person.id === "family");
  assert.deepEqual(family?.events, [{ time: null, title: "Maja leirskole" }]);
  assert.deepEqual(titles(payload, "maja"), []);
  const monday = payload.week.rows[5]?.days[0]?.blocks[0];
  assert.equal(monday?.kind, "activity");
  assert.equal(monday?.kind === "activity" ? monday.time : "", "—");
  assert.equal(payload.week.rows[5]?.days[1]?.blocks.length, 1);
  assert.equal(payload.week.rows[5]?.days[2]?.blocks.length, 0);
  assert.equal(payload.week.rows[2]?.days[0]?.blocks.length, 0);
  assert.equal(payload.week.rows[0]?.days[0]?.blocks.length, 0);
});

test("name prefixes land on one row, and everything else lands on Family", () => {
  const now = new Date("2026-10-03T05:42:00.000Z");
  const events = [
    {
      summary: "Amelia: Håndballkamp",
      start: { dateTime: "2026-10-03T09:00:00+02:00" },
      end: { dateTime: "2026-10-03T10:30:00+02:00" },
    },
    {
      summary: "Knut:Trening",
      start: { dateTime: "2026-10-03T08:00:00+02:00" },
      end: { dateTime: "2026-10-03T09:00:00+02:00" },
    },
    {
      summary: "knut: Trening",
      start: { dateTime: "2026-10-03T10:00:00+02:00" },
      end: { dateTime: "2026-10-03T11:00:00+02:00" },
    },
    {
      summary: "Ulla:",
      start: { dateTime: "2026-10-03T11:00:00+02:00" },
      end: { dateTime: "2026-10-03T12:00:00+02:00" },
    },
    {
      summary: "Ulla Marie: middag",
      start: { dateTime: "2026-10-03T18:00:00+02:00" },
      end: { dateTime: "2026-10-03T19:00:00+02:00" },
    },
    {
      summary: "Ulla-Marie: jobb",
      start: { dateTime: "2026-10-03T07:00:00+02:00" },
      end: { dateTime: "2026-10-03T08:00:00+02:00" },
    },
    {
      summary: "Ulla Marie arbeid",
      start: { dateTime: "2026-10-03T12:00:00+02:00" },
      end: { dateTime: "2026-10-03T13:00:00+02:00" },
    },
    {
      summary: "Knut: henter Ulla Marie",
      start: { dateTime: "2026-10-03T15:00:00+02:00" },
      end: { dateTime: "2026-10-03T16:00:00+02:00" },
    },
    {
      summary: "Familiekveld",
      description: "Knut og Ulla Marie",
      start: { dateTime: "2026-10-03T19:30:00+02:00" },
      end: { dateTime: "2026-10-03T21:00:00+02:00" },
    },
    {
      summary: "Maja leirskole",
      start: { dateTime: "2026-10-03T13:00:00+02:00" },
      end: { dateTime: "2026-10-03T14:00:00+02:00" },
    },
    {
      summary: "Knutsson: møte",
      start: { dateTime: "2026-10-03T14:00:00+02:00" },
      end: { dateTime: "2026-10-03T14:30:00+02:00" },
    },
    {
      summary: "Knut : jobb",
      start: { dateTime: "2026-10-03T16:30:00+02:00" },
      end: { dateTime: "2026-10-03T17:00:00+02:00" },
    },
    {
      summary: "Avlyst",
      status: "cancelled",
      start: { dateTime: "2026-10-03T12:00:00+02:00" },
      end: { dateTime: "2026-10-03T13:00:00+02:00" },
    },
    {
      summary: "Ulla Marie: Knut: middag",
      description: "Amelia",
      start: { dateTime: "2026-10-03T20:00:00+02:00" },
      end: { dateTime: "2026-10-03T21:00:00+02:00" },
    },
    {
      summary: "   ",
      description: "Knut",
      start: { dateTime: "2026-10-03T06:00:00+02:00" },
      end: { dateTime: "2026-10-03T06:30:00+02:00" },
    },
    {
      summary: "Amelia og Hedda: kamp",
      start: { dateTime: "2026-10-03T17:00:00+02:00" },
      end: { dateTime: "2026-10-03T18:00:00+02:00" },
    },
  ];
  const payload = buildLivePayload(events, events, now, "2026-09-28");

  assert.deepEqual(titles(payload, "amelia"), ["Amelia: Håndballkamp", "Amelia og Hedda: kamp"]);
  assert.deepEqual(weekTitles(payload, "amelia", SATURDAY), ["Amelia: Håndballkamp", "Amelia og Hedda: kamp"]);
  assert.deepEqual(titles(payload, "knut"), ["Knut:Trening", "knut: Trening", "Knut: henter Ulla Marie"]);
  assert.deepEqual(weekTitles(payload, "knut", SATURDAY), ["Knut:Trening", "knut: Trening", "Knut: henter Ulla Marie"]);
  assert.deepEqual(titles(payload, "ulla"), ["Ulla-Marie: jobb", "Ulla:", "Ulla Marie: middag", "Ulla Marie: Knut: middag"]);
  assert.deepEqual(titles(payload, "hedda"), ["Amelia og Hedda: kamp"]);
  assert.deepEqual(titles(payload, "maja"), []);
  assert.deepEqual(titles(payload, "family"), [
    "Uten tittel",
    "Ulla Marie arbeid",
    "Maja leirskole",
    "Knutsson: møte",
    "Knut : jobb",
    "Familiekveld",
  ]);
  assert.deepEqual(weekTitles(payload, "family", SATURDAY), titles(payload, "family"));
  assert.equal(payload.todayPeople.at(-1)?.id, "family");
  assert.equal(payload.todayPeople.at(-1)?.name, "Family");
  assert.equal(payload.todayPeople.at(-1)?.detail, "");
  assert.equal(payload.todayPeople.at(-1)?.colorToken, "--text-muted");
  assert.equal(payload.todayPeople.at(-1)?.transport, undefined);
  assert.equal(
    payload.week.rows.some((row) =>
      row.days.some((day) => day.blocks.some((block) => block.kind === "activity" && block.title === "Avlyst")),
    ),
    false,
  );
});

test("names joined by and or og land on those rows, and a title with no names stays on Family", () => {
  const now = new Date("2026-10-03T05:42:00.000Z");
  const at = (hour: number, summary: string, description?: string) => ({
    summary,
    ...(description ? { description } : {}),
    start: { dateTime: `2026-10-03T${String(hour).padStart(2, "0")}:00:00+02:00` },
    end: { dateTime: `2026-10-03T${String(hour).padStart(2, "0")}:30:00+02:00` },
  });
  const events = [
    at(7, "Knut: henter Ulla Marie"),
    at(8, "Maja leirskole"),
    at(9, "Hedda and Amelia"),
    at(10, "Amelia and Hedda"),
    at(11, "Hedda og Amelia"),
    at(12, "Amelia og Hedda"),
    at(13, "Hedda and Amelia: svømming"),
    at(14, "Hedda and Amelia and Knut"),
    at(15, "Ulla Marie og Knut"),
    at(16, "Ulla-Marie and Maja"),
    at(17, "Ulla and Ulla-Marie"),
    at(18, "Hedda: Amelia and Knut"),
    at(19, "Familiekveld", "Hedda and Amelia"),
    at(20, "hedda AND amelia kamp"),
  ];
  const payload = buildLivePayload(events, events, now, "2026-09-28");
  const shared = [
    "Hedda and Amelia",
    "Amelia and Hedda",
    "Hedda og Amelia",
    "Amelia og Hedda",
    "Hedda and Amelia: svømming",
    "Hedda and Amelia and Knut",
  ];

  assert.deepEqual(titles(payload, "amelia"), [...shared, "hedda AND amelia kamp"]);
  assert.deepEqual(weekTitles(payload, "amelia", SATURDAY), titles(payload, "amelia"));
  assert.deepEqual(titles(payload, "hedda"), [...shared, "Hedda: Amelia and Knut", "hedda AND amelia kamp"]);
  assert.deepEqual(titles(payload, "knut"), ["Knut: henter Ulla Marie", "Hedda and Amelia and Knut", "Ulla Marie og Knut"]);
  assert.deepEqual(titles(payload, "maja"), ["Ulla-Marie and Maja"]);
  assert.deepEqual(titles(payload, "ulla"), ["Ulla Marie og Knut", "Ulla-Marie and Maja", "Ulla and Ulla-Marie"]);
  assert.deepEqual(titles(payload, "family"), ["Maja leirskole", "Familiekveld"]);
  assert.deepEqual(weekTitles(payload, "family", SATURDAY), ["Maja leirskole", "Familiekveld"]);
  assert.equal(titles(payload, "family").includes("Hedda and Amelia"), false);
  assert.equal(titles(payload, "amelia").includes("Knut: henter Ulla Marie"), false);
  assert.equal(titles(payload, "knut").includes("Hedda: Amelia and Knut"), false);
  assert.equal(titles(payload, "maja").includes("Maja leirskole"), false);
});

test("Snart lists the next ten upcoming events soonest first, and skips placeholders", () => {
  const now = new Date("2026-10-13T08:00:00.000Z");
  const empty = upcomingSoon([], now);
  assert.deepEqual(empty, []);
  assert.deepEqual(buildLivePayload([], [], now, "2026-10-12").soon, []);

  const cancelled = upcomingSoon(
    [
      {
        summary: "Avlyst fest",
        status: "cancelled",
        start: { dateTime: "2026-10-13T12:00:00+02:00" },
        end: { dateTime: "2026-10-13T13:00:00+02:00" },
      },
    ],
    now,
  );
  assert.deepEqual(cancelled, []);

  const pastTimed = upcomingSoon(
    [
      {
        summary: "Maja: Ida feirer",
        start: { dateTime: "2026-10-12T17:00:00+02:00" },
        end: { dateTime: "2026-10-12T18:00:00+02:00" },
      },
      {
        summary: "Maja: Cheer kjøring",
        start: { dateTime: "2026-10-13T16:15:00+02:00" },
        end: { dateTime: "2026-10-13T16:45:00+02:00" },
      },
    ],
    now,
  );
  assert.deepEqual(
    pastTimed.map((item) => item.title),
    ["Maja: Cheer kjøring"],
  );
  assert.equal(pastTimed[0]?.date, "13.10");
  assert.equal(pastTimed[0]?.dotToken, "--p-maja");
  assert.equal(pastTimed[0]?.meta, "Maja · 16:15 · i dag");

  const allDay = upcomingSoon(
    [
      {
        summary: "Høstferie",
        start: { date: "2026-10-05" },
        end: { date: "2026-10-10" },
      },
      {
        summary: "Familiekveld",
        start: { date: "2026-10-13" },
        end: { date: "2026-10-14" },
      },
      {
        summary: "Hedda and Amelia: svømming",
        start: { dateTime: "2026-10-14T17:00:00+02:00" },
        end: { dateTime: "2026-10-14T18:00:00+02:00" },
      },
    ],
    now,
  );
  assert.deepEqual(
    allDay.map((item) => item.title),
    ["Familiekveld", "Hedda and Amelia: svømming"],
  );
  assert.equal(allDay[0]?.dotToken, "--text-muted");
  assert.equal(allDay[0]?.meta, "Family · i dag");
  assert.equal(allDay[1]?.dotToken, "--p-amelia");
  assert.equal(allDay[1]?.meta, "Amelia og Hedda · 17:00 · i morgen");

  const many = Array.from({ length: 12 }, (_, index) => ({
    summary: `Maja: Økt ${index + 1}`,
    start: { dateTime: `2026-10-20T${String(8 + index).padStart(2, "0")}:00:00+02:00` },
    end: { dateTime: `2026-10-20T${String(9 + index).padStart(2, "0")}:00:00+02:00` },
  }));
  const capped = upcomingSoon(many, now);
  assert.equal(capped.length, 10);
  assert.deepEqual(
    capped.map((item) => item.title),
    many.slice(0, 10).map((event) => event.summary),
  );
  assert.equal(capped[0]?.meta, "Maja · 08:00 · om 7 dager");

  const live = buildLivePayload([], [], now, "2026-10-12", [
    {
      summary: "Håndballtrening",
      start: { dateTime: "2026-10-13T17:50:00+02:00" },
      end: { dateTime: "2026-10-13T19:00:00+02:00" },
    },
    {
      summary: "Amelia: Kiosksalg Amelia 12:30-14:30",
      start: { dateTime: "2026-10-18T12:30:00+02:00" },
      end: { dateTime: "2026-10-18T14:30:00+02:00" },
    },
  ]);
  assert.equal(live.source, "google");
  assert.deepEqual(
    live.soon.map((item) => item.title),
    ["Håndballtrening", "Amelia: Kiosksalg Amelia 12:30-14:30"],
  );
  assert.equal(
    live.soon.some((item) => /Høstferie starter|Samtykke leirskole|Foreldremøte 8B|fyller 14|EU-kontroll|Pass utløper/.test(item.title)),
    false,
  );
});
