import type { CalendarPayload, SoonItem, WeatherDayPart, WeatherSymbol, WeatherView } from "../data/types";
import { isCalendarPayload, mondayOf } from "./calendar-view";
import { isDeparturesView, type DeparturesView } from "./departures";
import { formatOslo, osloDateKey, osloMidnightUtc, osloParts } from "./oslo";

export const HOME_SNAPSHOT_VERSION = 1;
export const HOME_SNAPSHOT_KEY = "family-hub.home.v1";

export const HOME_SECTIONS = ["calendar", "weather", "dinner", "departures"] as const;

/** How long a cached section may be shown as current before it is marked updating. */
export const SECTION_MAX_AGE_MS: Record<(typeof HOME_SECTIONS)[number], number> = {
  calendar: 5 * 60 * 1000,
  dinner: 5 * 60 * 1000,
  weather: 30 * 60 * 1000,
  departures: 90 * 1000,
};

/** How often a visible home screen refetches each section. */
export const SECTION_REFRESH_MS: Record<(typeof HOME_SECTIONS)[number], number> = {
  calendar: 90 * 1000,
  dinner: 90 * 1000,
  weather: 12 * 60 * 1000,
  departures: 45 * 1000,
};

/** A timed event stays "now" for this long after it starts when the payload has no end. */
export const EVENT_WINDOW_MINUTES = 60;

export const NO_DINNER_TODAY = "Ingen middag i dag";

export type SectionId = (typeof HOME_SECTIONS)[number];

export type SectionFreshness = "missing" | "fresh" | "stale" | "wrong-day";

export type SectionMeta = {
  fetchedAt: string;
  osloDate: string;
};

export type HomeDinner = {
  dish: string;
  shoppingCount: number;
  planned: boolean;
};

export type HomeSnapshot = {
  version: typeof HOME_SNAPSHOT_VERSION;
  calendar: CalendarPayload | null;
  calendarMeta: SectionMeta | null;
  weather: WeatherView | null;
  weatherMeta: SectionMeta | null;
  dinner: HomeDinner | null;
  dinnerMeta: SectionMeta | null;
  departures: DeparturesView | null;
  departuresMeta: SectionMeta | null;
};

export type SectionView<T> = {
  data: T | null;
  freshness: SectionFreshness;
  updatedAt: string | null;
};

export type VisibleHome = {
  calendar: SectionView<CalendarPayload>;
  weather: SectionView<WeatherView>;
  dinner: SectionView<HomeDinner>;
  departures: SectionView<DeparturesView>;
};

export type RefreshReason = "mount" | "resume" | "reconnect" | "midnight" | "interval";

export type SectionPhase = "loading" | "updating" | "ready" | "error" | "offline";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const WEATHER_SYMBOLS = new Set<WeatherSymbol>([
  "cloud-rain",
  "cloud-drizzle",
  "cloud-sun",
  "sun",
  "cloud",
  "cloud-moon",
  "moon",
]);

const DAY_PART_IDS = new Set(["morgen", "formiddag", "ettermiddag", "kveld"]);

function isWeatherDayPart(value: unknown): value is WeatherDayPart {
  if (!value || typeof value !== "object") return false;
  const part = value as WeatherDayPart;
  return (
    DAY_PART_IDS.has(part.id) &&
    typeof part.name === "string" &&
    typeof part.startHour === "number" &&
    Number.isFinite(part.startHour) &&
    typeof part.endHour === "number" &&
    Number.isFinite(part.endHour) &&
    typeof part.condition === "string" &&
    typeof part.precipitating === "boolean" &&
    (part.temperature === null || (typeof part.temperature === "number" && Number.isFinite(part.temperature))) &&
    (part.symbol === null || WEATHER_SYMBOLS.has(part.symbol))
  );
}

const RELATIVE_LABEL = /^(i dag|i morgen|om \d+ dager)$/;

export function emptyHomeSnapshot(): HomeSnapshot {
  return {
    version: HOME_SNAPSHOT_VERSION,
    calendar: null,
    calendarMeta: null,
    weather: null,
    weatherMeta: null,
    dinner: null,
    dinnerMeta: null,
    departures: null,
    departuresMeta: null,
  };
}

/** There is no user login. Nothing is stored, and launch never waits on a session check. */
export function readStoredSession(): null {
  return null;
}

export function launchRoute(): "home" {
  return "home";
}

export function memoryStore(seed: Record<string, string> = {}): KeyValueStore {
  const items = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(items, key) ? items[key] : null;
    },
    setItem(key, value) {
      items[key] = value;
    },
    removeItem(key) {
      delete items[key];
    },
  };
}

export function browserStore(): KeyValueStore | null {
  try {
    const probe = `${HOME_SNAPSHOT_KEY}.probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function isMeta(value: unknown): value is SectionMeta {
  if (!value || typeof value !== "object") return false;
  const meta = value as SectionMeta;
  return typeof meta.fetchedAt === "string" && typeof meta.osloDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meta.osloDate);
}

export function isWeatherView(value: unknown): value is WeatherView {
  if (!value || typeof value !== "object") return false;
  const weather = value as WeatherView;
  return (
    typeof weather.temperature === "number" &&
    Number.isFinite(weather.temperature) &&
    WEATHER_SYMBOLS.has(weather.headerSymbol) &&
    typeof weather.summary === "string" &&
    typeof weather.precipLabel === "string" &&
    typeof weather.dayLow === "number" &&
    Number.isFinite(weather.dayLow) &&
    typeof weather.dayHigh === "number" &&
    Number.isFinite(weather.dayHigh) &&
    typeof weather.dayPrecipMm === "number" &&
    Number.isFinite(weather.dayPrecipMm) &&
    typeof weather.attribution === "string" &&
    (weather.source === "yr" || weather.source === "fixture") &&
    Array.isArray(weather.parts) &&
    weather.parts.length === 4 &&
    weather.parts.every(isWeatherDayPart) &&
    Array.isArray(weather.slots) &&
    weather.slots.length === 8
  );
}

export function isHomeDinner(value: unknown): value is HomeDinner {
  if (!value || typeof value !== "object") return false;
  const dinner = value as HomeDinner;
  return typeof dinner.dish === "string" && dinner.dish.length > 0 && typeof dinner.shoppingCount === "number" && typeof dinner.planned === "boolean";
}

export function parseHomeSnapshot(raw: string | null): HomeSnapshot | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const snapshot = parsed as Partial<HomeSnapshot>;
  if (snapshot.version !== HOME_SNAPSHOT_VERSION) return null;
  return {
    version: HOME_SNAPSHOT_VERSION,
    calendar: isCalendarPayload(snapshot.calendar) ? snapshot.calendar : null,
    calendarMeta: isMeta(snapshot.calendarMeta) ? snapshot.calendarMeta : null,
    weather: isWeatherView(snapshot.weather) ? snapshot.weather : null,
    weatherMeta: isMeta(snapshot.weatherMeta) ? snapshot.weatherMeta : null,
    dinner: isHomeDinner(snapshot.dinner) ? snapshot.dinner : null,
    dinnerMeta: isMeta(snapshot.dinnerMeta) ? snapshot.dinnerMeta : null,
    departures: isDeparturesView(snapshot.departures) ? snapshot.departures : null,
    departuresMeta: isMeta(snapshot.departuresMeta) ? snapshot.departuresMeta : null,
  };
}

export function readHomeSnapshot(store: KeyValueStore): HomeSnapshot | null {
  try {
    return parseHomeSnapshot(store.getItem(HOME_SNAPSHOT_KEY));
  } catch {
    return null;
  }
}

export function clearHomeSnapshot(store: KeyValueStore): void {
  try {
    store.removeItem(HOME_SNAPSHOT_KEY);
  } catch {
    // Storage can be blocked. The next launch simply has nothing to paint.
  }
}

export function sectionFreshness(meta: SectionMeta | null, section: SectionId, now: Date): SectionFreshness {
  if (!meta) return "missing";
  if (meta.osloDate !== osloDateKey(now)) return "wrong-day";
  const fetchedAt = Date.parse(meta.fetchedAt);
  if (!Number.isFinite(fetchedAt)) return "missing";
  const age = now.getTime() - fetchedAt;
  if (age < 0 || age >= SECTION_MAX_AGE_MS[section]) return "stale";
  return "fresh";
}

export function viewSection<T>(data: T | null, meta: SectionMeta | null, section: SectionId, now: Date): SectionView<T> {
  const freshness = data ? sectionFreshness(meta, section, now) : "missing";
  if (!data || freshness === "missing" || freshness === "wrong-day") {
    return { data: null, freshness, updatedAt: null };
  }
  return { data, freshness, updatedAt: meta?.fetchedAt ?? null };
}

export function visibleHome(store: KeyValueStore, now: Date): VisibleHome {
  const snapshot = readHomeSnapshot(store);
  return {
    calendar: viewSection(snapshot?.calendar ?? null, snapshot?.calendarMeta ?? null, "calendar", now),
    weather: viewSection(snapshot?.weather ?? null, snapshot?.weatherMeta ?? null, "weather", now),
    dinner: viewSection(snapshot?.dinner ?? null, snapshot?.dinnerMeta ?? null, "dinner", now),
    departures: viewSection(snapshot?.departures ?? null, snapshot?.departuresMeta ?? null, "departures", now),
  };
}

export function writeHomeSection<T>(store: KeyValueStore, section: SectionId, data: T, now: Date): void {
  const snapshot = readHomeSnapshot(store) ?? emptyHomeSnapshot();
  const meta: SectionMeta = { fetchedAt: now.toISOString(), osloDate: osloDateKey(now) };
  if (section === "calendar") {
    snapshot.calendar = data as CalendarPayload;
    snapshot.calendarMeta = meta;
  } else if (section === "weather") {
    snapshot.weather = data as WeatherView;
    snapshot.weatherMeta = meta;
  } else if (section === "dinner") {
    snapshot.dinner = data as HomeDinner;
    snapshot.dinnerMeta = meta;
  } else {
    snapshot.departures = data as DeparturesView;
    snapshot.departuresMeta = meta;
  }
  try {
    store.setItem(HOME_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // A blocked store still leaves the fresh response on screen.
  }
}

export function sameSnapshotValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function initialPhase(freshness: SectionFreshness, online: boolean): SectionPhase {
  if (!online && freshness !== "fresh") return "offline";
  if (freshness === "fresh") return "ready";
  if (freshness === "stale") return "updating";
  return "loading";
}

export function sectionsToRefresh(input: { reason: RefreshReason; section?: SectionId; hidden: boolean }): SectionId[] {
  if (input.hidden) return [];
  if (input.reason === "interval") return input.section ? [input.section] : [];
  return [...HOME_SECTIONS];
}

export function retryDelayMs(attempt: number): number {
  const step = Math.max(1, attempt);
  return Math.min(60_000, 2000 * 2 ** (step - 1));
}

export function msUntilOsloMidnight(now: Date): number {
  const today = osloDateKey(now);
  const [year, month, day] = today.split("-").map(Number);
  const nextKey = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  return Math.max(0, osloMidnightUtc(nextKey).getTime() - now.getTime());
}

export function osloUpdatedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatOslo(date).time;
}

export type EventPhase = "upcoming" | "now" | "done";

export function eventPhase(event: { time: string | null }, clock: { hour: number; minute: number }): EventPhase {
  if (!event.time || !/^\d{2}:\d{2}$/.test(event.time)) return "now";
  const [hour, minute] = event.time.split(":").map(Number);
  const start = hour * 60 + minute;
  const at = clock.hour * 60 + clock.minute;
  if (at < start) return "upcoming";
  if (at < start + EVENT_WINDOW_MINUTES) return "now";
  return "done";
}

export function withEventPhases<T extends { events: { time: string | null; title: string }[] }>(
  people: T[],
  clock: { hour: number; minute: number },
): Array<Omit<T, "events"> & { events: Array<T["events"][number] & { phase: EventPhase }> }> {
  return people.map((person) => ({
    ...person,
    events: person.events.map((event) => ({ ...event, phase: eventPhase(event, clock) })),
  }));
}

function dayDiff(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

function relativeLabel(days: number): string {
  if (days <= 0) return "i dag";
  if (days === 1) return "i morgen";
  return `om ${days} dager`;
}

/** Drops events that are no longer upcoming and rewrites "i dag" / "i morgen" from the Oslo date. */
export function rollSoon(items: SoonItem[], now: Date): SoonItem[] {
  const today = osloDateKey(now);
  const partsNow = osloParts(now);
  const minutes = partsNow.hour * 60 + partsNow.minute;
  const next: SoonItem[] = [];
  for (const item of items) {
    if (!item.on) {
      next.push(item);
      continue;
    }
    const days = dayDiff(today, item.on);
    if (days < 0) continue;
    const pieces = item.meta.split(" · ");
    const time = pieces.find((piece) => /^\d{2}:\d{2}$/.test(piece)) ?? null;
    if (days === 0 && time) {
      const [hour, minute] = time.split(":").map(Number);
      if (hour * 60 + minute <= minutes) continue;
    }
    const last = pieces[pieces.length - 1];
    if (last && RELATIVE_LABEL.test(last)) pieces[pieces.length - 1] = relativeLabel(days);
    next.push({ ...item, meta: pieces.join(" · ") });
  }
  return next;
}

type MealDay = { meal: { title: string } | null };
type ShoppingAisle = { items: { done?: boolean }[] };

export function openShoppingCount(aisles: ShoppingAisle[]): number {
  return aisles.reduce((total, aisle) => total + aisle.items.filter((item) => !item.done).length, 0);
}

export function dinnerForToday(week: string, days: MealDay[], aisles: ShoppingAisle[], now: Date): HomeDinner | null {
  const today = osloDateKey(now);
  if (week !== mondayOf(today) || days.length !== 7) return null;
  const index = dayDiff(week, today);
  const day = days[index];
  if (!day || index < 0 || index > 6) return null;
  const title = day.meal?.title?.trim() ?? "";
  return {
    dish: title || NO_DINNER_TODAY,
    planned: title.length > 0,
    shoppingCount: openShoppingCount(aisles),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mealFromDinnerPayload(value: unknown, now: Date): { dish: string; planned: boolean; currentWeek: boolean } | null {
  if (!isRecord(value) || typeof value.week !== "string" || !Array.isArray(value.days) || value.days.length !== 7) return null;
  const monday = mondayOf(osloDateKey(now));
  if (value.week !== monday) return { dish: NO_DINNER_TODAY, planned: false, currentWeek: false };
  const day = value.days[dayDiff(monday, osloDateKey(now))];
  if (!isRecord(day)) return null;
  const meal = day.meal;
  if (meal == null) return { dish: NO_DINNER_TODAY, planned: false, currentWeek: true };
  if (!isRecord(meal) || typeof meal.title !== "string" || meal.title.trim().length === 0) return null;
  return { dish: meal.title.trim(), planned: true, currentWeek: true };
}

/** Keeps a planned same-day meal when the server answers with a different week. */
export function reconcileDinner(
  previous: HomeDinner | null,
  incoming: { dish: string; planned: boolean; currentWeek: boolean; shoppingCount: number | null },
): { dinner: HomeDinner; confirmed: boolean } {
  if (!incoming.currentWeek && previous?.planned) return { dinner: previous, confirmed: false };
  if (!incoming.currentWeek) {
    return { confirmed: true, dinner: { dish: NO_DINNER_TODAY, planned: false, shoppingCount: 0 } };
  }
  return {
    confirmed: true,
    dinner: {
      dish: incoming.dish,
      planned: incoming.planned,
      shoppingCount: incoming.shoppingCount ?? previous?.shoppingCount ?? 0,
    },
  };
}

export function shoppingCountFromPayload(value: unknown, now: Date): number | null {
  if (!isRecord(value) || typeof value.week !== "string" || !Array.isArray(value.aisles)) return null;
  if (value.week !== mondayOf(osloDateKey(now))) return 0;
  const aisles: ShoppingAisle[] = [];
  for (const aisle of value.aisles) {
    if (!isRecord(aisle) || !Array.isArray(aisle.items)) return null;
    const items: { done?: boolean }[] = [];
    for (const item of aisle.items) {
      if (!isRecord(item)) return null;
      items.push({ done: item.done === true });
    }
    aisles.push({ items });
  }
  return openShoppingCount(aisles);
}

export function publishHomeDinner(week: string, days: MealDay[], aisles: ShoppingAisle[], now: Date, store: KeyValueStore | null = browserStore()): void {
  if (!store) return;
  const dinner = dinnerForToday(week, days, aisles, now);
  if (!dinner) return;
  try {
    writeHomeSection(store, "dinner", dinner, now);
  } catch {
    // Ignore a full or blocked store. The next home fetch still reconciles.
  }
}
