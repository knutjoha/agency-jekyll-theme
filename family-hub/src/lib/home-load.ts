import type { CalendarPayload, WeatherView } from "../data/types";
import { isCalendarPayload } from "./calendar-view";
import { isDeparturesView, type DeparturesView } from "./departures";
import { isWeatherView, mealFromDinnerPayload, shoppingCountFromPayload } from "./home-cache";

export const SECTION_TIMEOUT_MS = 8000;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type SectionResult<T> = { ok: true; data: T } | { ok: false; status: number };

export type LoadedDinner = {
  dish: string;
  planned: boolean;
  currentWeek: boolean;
  shoppingCount: number | null;
};

/**
 * Home launch requests. None of these wait on each other:
 * calendar, weather, dinner, shopping and departures are independent.
 * The only sequential chain is inside the weather route, where the Yr
 * forecast URL is only known after the location search.
 */
export const HOME_REQUESTS = ["/api/calendar", "/api/weather", "/api/dinner", "/api/shopping", "/api/departures"] as const;

export function outcomeForStatus(status: number): "ok" | "error" {
  return status >= 200 && status < 300 ? "ok" : "error";
}

export async function fetchJson(
  url: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<{ ok: true; status: number; body: unknown } | { ok: false; status: number }> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetchImpl(url, { cache: "no-store", signal: combined });
    if (outcomeForStatus(response.status) === "error") return { ok: false, status: response.status };
    return { ok: true, status: response.status, body: await response.json() };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function loadCalendar(fetchImpl: FetchLike, timeoutMs: number, signal?: AbortSignal): Promise<SectionResult<CalendarPayload>> {
  const result = await fetchJson("/api/calendar", fetchImpl, timeoutMs, signal);
  if (!result.ok) return result;
  if (!isCalendarPayload(result.body)) return { ok: false, status: 422 };
  return { ok: true, data: { ...result.body, soon: result.body.soon ?? [] } };
}

export async function loadWeather(fetchImpl: FetchLike, timeoutMs: number, signal?: AbortSignal): Promise<SectionResult<WeatherView>> {
  const result = await fetchJson("/api/weather", fetchImpl, timeoutMs, signal);
  if (!result.ok) return result;
  if (!isWeatherView(result.body)) return { ok: false, status: 422 };
  return { ok: true, data: result.body };
}

export async function loadDepartures(
  fetchImpl: FetchLike,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<SectionResult<DeparturesView>> {
  const result = await fetchJson("/api/departures", fetchImpl, timeoutMs, signal);
  if (!result.ok) return result;
  if (!isDeparturesView(result.body)) return { ok: false, status: 422 };
  return { ok: true, data: result.body };
}

export async function loadDinner(fetchImpl: FetchLike, timeoutMs: number, signal: AbortSignal | undefined, now: Date): Promise<SectionResult<LoadedDinner>> {
  const [mealResult, shoppingResult] = await Promise.all([
    fetchJson("/api/dinner", fetchImpl, timeoutMs, signal),
    fetchJson("/api/shopping", fetchImpl, timeoutMs, signal),
  ]);
  if (!mealResult.ok) return mealResult;
  const meal = mealFromDinnerPayload(mealResult.body, now);
  if (!meal) return { ok: false, status: 422 };
  const shoppingCount = shoppingResult.ok ? shoppingCountFromPayload(shoppingResult.body, now) : null;
  return { ok: true, data: { ...meal, shoppingCount } };
}

export async function loadHomeSections(
  fetchImpl: FetchLike,
  options?: { timeoutMs?: number; signal?: AbortSignal; now?: Date },
): Promise<{
  calendar: SectionResult<CalendarPayload>;
  weather: SectionResult<WeatherView>;
  dinner: SectionResult<LoadedDinner>;
  departures: SectionResult<DeparturesView>;
}> {
  const timeoutMs = options?.timeoutMs ?? SECTION_TIMEOUT_MS;
  const now = options?.now ?? new Date();
  const [calendar, weather, dinner, departures] = await Promise.all([
    loadCalendar(fetchImpl, timeoutMs, options?.signal),
    loadWeather(fetchImpl, timeoutMs, options?.signal),
    loadDinner(fetchImpl, timeoutMs, options?.signal, now),
    loadDepartures(fetchImpl, timeoutMs, options?.signal),
  ]);
  return { calendar, weather, dinner, departures };
}
