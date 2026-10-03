import assert from "node:assert/strict";
import test from "node:test";
import { people } from "../data/fixture";
import { calendarWeek } from "../data/calendar";
import { osloMidnightUtc } from "./oslo";
import {
  addIsoDays,
  buildLivePayload,
  fixturePayload,
  mondayOf,
  parseIsoDate,
  peopleNamedIn,
} from "./calendar-view";
import { readGoogleCredentials } from "./google-calendar";

test("Oslo midnight follows daylight saving", () => {
  assert.equal(osloMidnightUtc("2026-10-03").toISOString(), "2026-10-02T22:00:00.000Z");
  assert.equal(osloMidnightUtc("2026-11-01").toISOString(), "2026-10-31T23:00:00.000Z");
});

test("monday of the snapshot saturday is 28 September 2026", () => {
  assert.equal(mondayOf("2026-10-03"), "2026-09-28");
  assert.equal(mondayOf("2026-09-28"), "2026-09-28");
  assert.equal(addIsoDays("2026-09-28", 6), "2026-10-04");
  assert.equal(parseIsoDate("2026-02-31"), null);
  assert.equal(parseIsoDate("2026-10-03"), "2026-10-03");
});

test("person names in a title decide the row", () => {
  assert.deepEqual(peopleNamedIn("Amelia: Håndballkamp"), ["amelia"]);
  assert.deepEqual(peopleNamedIn("Amelia og Hedda kamp"), ["amelia", "hedda"]);
  assert.deepEqual(peopleNamedIn("Ulla Marie arbeid"), ["ulla"]);
  assert.deepEqual(peopleNamedIn("Ulla-Marie henter"), ["ulla"]);
  assert.deepEqual(peopleNamedIn("Familiekveld"), []);
  assert.deepEqual(peopleNamedIn("Knutsson"), []);
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
});

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
  assert.equal(amelia?.transport.kind, "missing");

  const knut = payload.todayPeople.find((person) => person.id === "knut");
  const ulla = payload.todayPeople.find((person) => person.id === "ulla");
  assert.deepEqual(knut?.events, [{ time: "19:30", title: "Familiekveld" }]);
  assert.deepEqual(ulla?.events, [{ time: "19:30", title: "Familiekveld" }]);

  const hedda = payload.todayPeople.find((person) => person.id === "hedda");
  assert.deepEqual(hedda?.events, []);

  const saturday = payload.week.rows[0]?.days[5];
  assert.deepEqual(saturday?.blocks, [{ kind: "activity", time: "09:00", title: "Amelia: Håndballkamp" }]);
  assert.equal(payload.week.rows[0]?.days[0]?.blocks.length, 0);
});

test("an unnamed event is shown for every person, and an empty calendar is not the fixture", () => {
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
  assert.equal(household.todayPeople.every((person) => person.events.length === 1), true);

  const empty = buildLivePayload([], [], now, "2026-09-28");
  assert.equal(empty.source, "google");
  assert.equal(
    empty.todayPeople.every((person) => person.events.length === 0),
    true,
  );
  assert.notEqual(empty.todayPeople[0]?.events, people[0]?.events);
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
  const maja = payload.todayPeople.find((person) => person.id === "maja");
  assert.deepEqual(maja?.events, [{ time: null, title: "Maja leirskole" }]);
  const monday = payload.week.rows[2]?.days[0]?.blocks[0];
  assert.equal(monday?.kind, "activity");
  assert.equal(monday?.kind === "activity" ? monday.time : "", "—");
  assert.equal(payload.week.rows[2]?.days[1]?.blocks.length, 1);
  assert.equal(payload.week.rows[2]?.days[2]?.blocks.length, 0);
  assert.equal(payload.week.rows[0]?.days[0]?.blocks.length, 0);
});
