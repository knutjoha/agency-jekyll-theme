import assert from "node:assert/strict";
import { test } from "node:test";
import { fixtureWeather } from "../data/fixture.ts";
import { fixturePayload } from "./calendar-view.ts";
import {
  HOME_SNAPSHOT_KEY,
  HOME_SNAPSHOT_VERSION,
  NO_DINNER_TODAY,
  SECTION_MAX_AGE_MS,
  SECTION_REFRESH_MS,
  clearHomeSnapshot,
  dinnerForToday,
  eventPhase,
  initialPhase,
  launchRoute,
  mealFromDinnerPayload,
  memoryStore,
  msUntilOsloMidnight,
  parseHomeSnapshot,
  publishHomeDinner,
  readStoredSession,
  reconcileDinner,
  retryDelayMs,
  rollSoon,
  sectionFreshness,
  sectionsToRefresh,
  shoppingCountFromPayload,
  visibleHome,
  writeHomeSection,
} from "./home-cache.ts";
import { loadHomeSections, outcomeForStatus } from "./home-load.ts";
import { mondayOf } from "./calendar-view.ts";
import { osloDateKey, osloParts } from "./oslo.ts";

const now = new Date("2026-10-15T11:00:00.000Z");

function meta(minutesAgo: number, osloDate = osloDateKey(now)) {
  return { fetchedAt: new Date(now.getTime() - minutesAgo * 60_000).toISOString(), osloDate };
}

test("launch has no login gate because nothing stores a user session", () => {
  assert.equal(readStoredSession(), null);
  assert.equal(launchRoute(), "home");
});

test("a 401 is a failed refresh, not a redirect to login", () => {
  assert.equal(outcomeForStatus(401), "error");
  assert.equal(outcomeForStatus(200), "ok");
  assert.equal(outcomeForStatus(500), "error");
});

test("reads and writes a versioned snapshot without dropping the other sections", () => {
  const store = memoryStore();
  writeHomeSection(store, "weather", fixtureWeather, now);
  writeHomeSection(store, "dinner", { dish: "Taco", shoppingCount: 2, planned: true }, now);
  writeHomeSection(store, "departures", { rows: [{ id: "l1", line: "L1", destination: "Lillestrøm", aimed: "2026-10-15T09:10:00+02:00", expected: "2026-10-15T09:10:00+02:00", cancelled: false }] }, now);
  const snapshot = parseHomeSnapshot(store.getItem(HOME_SNAPSHOT_KEY));
  assert.equal(snapshot?.version, HOME_SNAPSHOT_VERSION);
  assert.equal(snapshot?.weather?.temperature, fixtureWeather.temperature);
  assert.equal(snapshot?.dinner?.dish, "Taco");
  assert.equal(snapshot?.departures?.rows[0]?.destination, "Lillestrøm");
  assert.equal(snapshot?.calendar, null);
  clearHomeSnapshot(store);
  assert.equal(store.getItem(HOME_SNAPSHOT_KEY), null);
});

test("a corrupt or unknown snapshot is ignored", () => {
  assert.equal(parseHomeSnapshot(null), null);
  assert.equal(parseHomeSnapshot("{"), null);
  assert.equal(parseHomeSnapshot(JSON.stringify({ version: 2, weather: fixtureWeather })), null);
  const store = memoryStore({ [HOME_SNAPSHOT_KEY]: "not-json" });
  const visible = visibleHome(store, now);
  assert.equal(visible.calendar.freshness, "missing");
  assert.equal(visible.calendar.data, null);
  assert.equal(visible.weather.data, null);
  assert.equal(visible.dinner.data, null);
  assert.equal(visible.departures.data, null);
});

test("max age marks calendar stale at 5 minutes, weather fresh until 30, and yesterday hidden", () => {
  assert.equal(sectionFreshness(meta(4), "calendar", now), "fresh");
  assert.equal(sectionFreshness(meta(5), "calendar", now), "stale");
  assert.equal(sectionFreshness(meta(5), "dinner", now), "stale");
  assert.equal(sectionFreshness(meta(5), "weather", now), "fresh");
  assert.equal(sectionFreshness(meta(30), "weather", now), "stale");
  assert.equal(sectionFreshness({ fetchedAt: new Date(now.getTime() - 89_000).toISOString(), osloDate: osloDateKey(now) }, "departures", now), "fresh");
  assert.equal(sectionFreshness({ fetchedAt: new Date(now.getTime() - SECTION_MAX_AGE_MS.departures).toISOString(), osloDate: osloDateKey(now) }, "departures", now), "stale");
  assert.equal(SECTION_REFRESH_MS.departures >= 30_000 && SECTION_REFRESH_MS.departures <= 60_000, true);
  assert.equal(sectionFreshness(meta(1, "2026-10-14"), "calendar", now), "wrong-day");
  assert.equal(SECTION_MAX_AGE_MS.weather > SECTION_MAX_AGE_MS.calendar, true);

  const store = memoryStore();
  writeHomeSection(store, "calendar", fixturePayload(), new Date("2026-10-14T12:00:00.000Z"));
  const visible = visibleHome(store, now);
  assert.equal(visible.calendar.freshness, "wrong-day");
  assert.equal(visible.calendar.data, null);
  assert.equal(initialPhase("stale", true), "updating");
  assert.equal(initialPhase("fresh", false), "ready");
  assert.equal(initialPhase("missing", false), "offline");
});

test("resume refreshes every section and a hidden page does not", () => {
  assert.deepEqual(sectionsToRefresh({ reason: "resume", hidden: false }), ["calendar", "weather", "dinner", "departures"]);
  assert.deepEqual(sectionsToRefresh({ reason: "reconnect", hidden: false }), ["calendar", "weather", "dinner", "departures"]);
  assert.deepEqual(sectionsToRefresh({ reason: "midnight", hidden: false }), ["calendar", "weather", "dinner", "departures"]);
  assert.deepEqual(sectionsToRefresh({ reason: "interval", section: "weather", hidden: false }), ["weather"]);
  assert.deepEqual(sectionsToRefresh({ reason: "interval", section: "calendar", hidden: true }), []);
  assert.deepEqual(sectionsToRefresh({ reason: "resume", hidden: true }), []);
});

test("failed refreshes back off and then cap", () => {
  assert.equal(retryDelayMs(1), 2_000);
  assert.equal(retryDelayMs(2), 4_000);
  assert.equal(retryDelayMs(3), 8_000);
  assert.equal(retryDelayMs(6), 60_000);
  assert.equal(retryDelayMs(8), 60_000);
});

test("a timed event moves from upcoming to now to done on the Oslo clock", () => {
  const event = { time: "15:00", title: "Håndball" };
  assert.equal(eventPhase(event, { hour: 14, minute: 59 }), "upcoming");
  assert.equal(eventPhase(event, { hour: 15, minute: 0 }), "now");
  assert.equal(eventPhase(event, { hour: 15, minute: 59 }), "now");
  assert.equal(eventPhase(event, { hour: 16, minute: 0 }), "done");
  assert.equal(eventPhase({ time: null }, { hour: 23, minute: 0 }), "now");

  const osloAfternoon = new Date("2026-10-15T13:10:00.000Z");
  assert.equal(osloParts(osloAfternoon).hour, 15);
  assert.equal(eventPhase(event, osloParts(osloAfternoon)), "now");
  assert.equal(eventPhase(event, osloParts(new Date("2026-10-15T14:00:00.000Z"))), "done");
});

test("Snart rolls at Oslo midnight and drops events that already started", () => {
  const items = [
    { date: "16.10", title: "Cheer", meta: "Maja · 16:15 · i morgen", dotToken: "--p-maja" as const, on: "2026-10-16" },
    { date: "15.10", title: "Ferdig", meta: "Knut · 10:00 · i dag", dotToken: "--p-knut" as const, on: "2026-10-15" },
  ];
  const rolled = rollSoon(items, new Date("2026-10-15T22:30:00.000Z"));
  assert.equal(osloDateKey(new Date("2026-10-15T22:30:00.000Z")), "2026-10-16");
  assert.deepEqual(
    rolled.map((item) => item.meta),
    ["Maja · 16:15 · i dag"],
  );
});

test("midnight is measured in Europe/Oslo", () => {
  const evening = new Date("2026-10-15T21:30:00.000Z");
  assert.equal(osloParts(evening).hour, 23);
  assert.equal(msUntilOsloMidnight(evening), 30 * 60 * 1000);
});

test("today's meal comes from this Oslo week, and another week is not shown as today", () => {
  const monday = mondayOf(osloDateKey(now));
  assert.equal(monday, "2026-10-12");
  const days = Array.from({ length: 7 }, () => ({ meal: null as { title: string } | null }));
  days[3] = { meal: { title: "Taco" } };
  const dinner = dinnerForToday(monday, days, [{ items: [{ done: false }, { done: true }] }], now);
  assert.deepEqual(dinner, { dish: "Taco", planned: true, shoppingCount: 1 });
  assert.equal(dinnerForToday("2026-09-28", days, [], now), null);

  const payload = mealFromDinnerPayload({ week: monday, days: days.map((day) => ({ meal: day.meal })) }, now);
  assert.deepEqual(payload, { dish: "Taco", planned: true, currentWeek: true });
  assert.equal(shoppingCountFromPayload({ week: monday, aisles: [{ items: [{ done: false }, { done: true }] }] }, now), 1);
  assert.deepEqual(mealFromDinnerPayload({ week: "2026-09-28", days }, now), {
    dish: NO_DINNER_TODAY,
    planned: false,
    currentWeek: false,
  });
  assert.deepEqual(
    reconcileDinner({ dish: "Laks", shoppingCount: 4, planned: true }, { dish: NO_DINNER_TODAY, planned: false, currentWeek: false, shoppingCount: 0 }),
    { dinner: { dish: "Laks", shoppingCount: 4, planned: true }, confirmed: false },
  );
  assert.equal(
    reconcileDinner(null, { dish: NO_DINNER_TODAY, planned: false, currentWeek: false, shoppingCount: 0 }).dinner.dish,
    NO_DINNER_TODAY,
  );
});

test("editing today's dinner updates the home snapshot immediately", () => {
  const store = memoryStore();
  const monday = mondayOf(osloDateKey(now));
  const days = Array.from({ length: 7 }, () => ({ meal: null as { title: string } | null }));
  days[3] = { meal: { title: "Lapskaus" } };
  publishHomeDinner(monday, days, [{ items: [{ done: false }, { done: false }, { done: true }] }], now, store);
  const visible = visibleHome(store, now);
  assert.equal(visible.dinner.freshness, "fresh");
  assert.equal(visible.dinner.data?.dish, "Lapskaus");
  assert.equal(visible.dinner.data?.shoppingCount, 2);
  publishHomeDinner("2026-09-28", days, [], now, store);
  assert.equal(visibleHome(store, now).dinner.data?.dish, "Lapskaus");
});

test("home sections load together, and one failure does not block the others", async () => {
  const started = Date.now();
  const calls: string[] = [];
  const result = await loadHomeSections(async (url) => {
    calls.push(url);
    await new Promise((resolve) => setTimeout(resolve, 60));
    if (url.includes("weather")) return new Response("no", { status: 503 });
    if (url.includes("calendar")) return Response.json(fixturePayload());
    if (url.includes("shopping")) return Response.json({ week: "2026-10-12", aisles: [{ items: [{ done: false }] }] });
    if (url.includes("departures")) {
      return Response.json({
        rows: [
          {
            id: "l1",
            line: "L1",
            destination: "Lillestrøm",
            aimed: "2026-10-15T09:10:00+02:00",
            expected: "2026-10-15T09:12:00+02:00",
            cancelled: false,
          },
        ],
      });
    }
    const days: { meal: { title: string } | null }[] = Array.from({ length: 7 }, () => ({ meal: null }));
    days[3] = { meal: { title: "Taco" } };
    return Response.json({ week: "2026-10-12", days });
  }, { now });
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 160, `expected parallel load, took ${elapsed}ms`);
  assert.equal(calls.length, 5);
  assert.equal(result.calendar.ok, true);
  assert.equal(result.weather.ok, false);
  assert.equal(result.dinner.ok && result.dinner.data.dish, "Taco");
  assert.equal(result.dinner.ok && result.dinner.data.shoppingCount, 1);
  assert.equal(result.departures.ok && result.departures.data.rows[0]?.destination, "Lillestrøm");
});
