import { ATTRIBUTION, fixtureWeather } from "@/data/fixture";
import type { MeteogramSlot, WeatherSymbol, WeatherView } from "@/data/types";
import { osloDateKey, osloParts } from "@/lib/oslo";

const YR_ORIGIN = "https://www.yr.no";

/** Yr location search. Stabekk is resolved from this response, not hardcoded. */
export const STABEKK_SEARCH_URL = `${YR_ORIGIN}/api/v0/locations/search?q=${encodeURIComponent("Stabekk")}&language=nb`;

export const YR_USER_AGENT =
  "FamilyHub/1.0 (+https://github.com/knutjoha/agency-jekyll-theme)";

const SLOT_HOURS = [8, 10, 12, 14, 16, 18, 20, 22];

type MetSeries = {
  time: string;
  data?: {
    instant?: { details?: { air_temperature?: number } };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
    next_6_hours?: { summary?: { symbol_code?: string } };
  };
};

type HourPoint = {
  hour: number;
  temperature: number;
  precipMm: number;
  symbolCode: string;
};

type SymbolMapping = {
  symbol: WeatherSymbol;
  precipitating: boolean;
  condition: string;
};

type CacheEntry = {
  expiresAt: number;
  view: WeatherView;
};

let cache: CacheEntry | null = null;

export function mapSymbol(code: string): SymbolMapping {
  const normalized = code.toLowerCase();
  const night = normalized.includes("_night") || normalized.includes("polartwilight");

  if (normalized.includes("drizzle") || normalized.includes("lightrain")) {
    return {
      symbol: "cloud-drizzle",
      precipitating: true,
      condition: normalized.includes("drizzle") ? "Yr" : "Lett regn",
    };
  }
  if (normalized.includes("rain") || normalized.includes("sleet")) {
    return {
      symbol: "cloud-rain",
      precipitating: true,
      condition: normalized.includes("sleet") ? "Sludd" : "Regn",
    };
  }
  if (normalized.includes("snow")) {
    return { symbol: "cloud", precipitating: true, condition: "Snø" };
  }
  if (normalized.includes("fog")) {
    return { symbol: "cloud", precipitating: false, condition: "Tåke" };
  }
  if (normalized.includes("clearsky")) {
    return night
      ? { symbol: "moon", precipitating: false, condition: "Klarvær" }
      : { symbol: "cloud-sun", precipitating: false, condition: "Klarvær" };
  }
  if (normalized.includes("partlycloudy") || normalized.includes("fair")) {
    return night
      ? { symbol: "cloud-moon", precipitating: false, condition: "Delvis skyet" }
      : { symbol: "cloud-sun", precipitating: false, condition: "Delvis skyet" };
  }
  return { symbol: "cloud", precipitating: false, condition: "Skyet" };
}

export function precipBarPx(precipMm: number): number {
  if (precipMm < 0.05) return 0;
  return Math.min(48, Math.max(4, Math.round(precipMm * 16)));
}

function formatMm(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1).replace(".", ",");
}

function symbolCodeOf(entry: MetSeries): string {
  return (
    entry.data?.next_1_hours?.summary?.symbol_code ??
    entry.data?.next_6_hours?.summary?.symbol_code ??
    "cloudy"
  );
}

export function buildWeather(series: MetSeries[], now: Date): WeatherView {
  const todayKey = osloDateKey(now);
  const nowParts = osloParts(now);
  const points: HourPoint[] = [];

  for (const entry of series) {
    const instant = new Date(entry.time);
    if (Number.isNaN(instant.getTime())) continue;
    if (osloDateKey(instant) !== todayKey) continue;
    const temperature = entry.data?.instant?.details?.air_temperature;
    if (typeof temperature !== "number") continue;
    points.push({
      hour: osloParts(instant).hour,
      temperature,
      precipMm: entry.data?.next_1_hours?.details?.precipitation_amount ?? 0,
      symbolCode: symbolCodeOf(entry),
    });
  }

  if (points.length === 0) {
    throw new Error("Yr returned no temperatures for today in Stabekk");
  }

  const current =
    [...points].reverse().find((point) => point.hour <= nowParts.hour) ?? points[0];

  const upcoming = points.filter((point) => point.hour >= nowParts.hour);
  const wet = upcoming.filter((point) => point.precipMm >= 0.1);
  const lastWet = wet.length > 0 ? wet[wet.length - 1].hour : -1;
  const sum = wet.reduce((total, point) => total + point.precipMm, 0);
  const low = Math.round(Math.min(...points.map((point) => point.temperature)));
  const high = Math.round(Math.max(...points.map((point) => point.temperature)));
  const range = `${low}–${high}° i dag`;
  const mappedNow = mapSymbol(current.symbolCode);
  const endsToday = lastWet >= 0 && lastWet < 23;
  const endHour = lastWet + 1;

  const nearest = (hour: number) =>
    points.reduce((best, point) =>
      Math.abs(point.hour - hour) < Math.abs(best.hour - hour) ? point : best,
    );

  const slots: MeteogramSlot[] = SLOT_HOURS.map((hour) => {
    const atHour = nearest(hour);
    const windowPrecip = points
      .filter((point) => point.hour >= hour && point.hour < hour + 2)
      .reduce((total, point) => total + point.precipMm, 0);
    const mapped = mapSymbol(atHour.symbolCode);
    return {
      hour,
      temperature: Math.round(atHour.temperature),
      symbol: mapped.symbol,
      precipitating: mapped.precipitating,
      barPx: precipBarPx(windowPrecip),
    };
  });

  return {
    temperature: Math.round(current.temperature),
    headerSymbol: mappedNow.symbol,
    summary: endsToday
      ? `${mappedNow.condition} før kl. ${endHour} · ${range}`
      : `${mappedNow.condition} · ${range}`,
    precipLabel: endsToday
      ? `${formatMm(sum)} mm før kl. ${endHour}`
      : sum > 0
        ? `${formatMm(sum)} mm i dag`
        : "0 mm",
    slots,
    attribution: ATTRIBUTION,
    source: "yr",
  };
}

type YrLocation = {
  name?: string;
  category?: { id?: string };
  subregion?: { name?: string };
  _links?: { forecast?: { href?: string } };
};

type YrShortInterval = {
  start?: string;
  symbolCode?: { next1Hour?: string; next6Hours?: string };
  precipitation?: { value?: number };
  temperature?: { value?: number };
};

type YrForecast = {
  shortIntervals?: YrShortInterval[];
};

function remember(view: WeatherView, expiresAt: number): WeatherView {
  cache = { expiresAt, view };
  return view;
}

/** The populated place in Bærum, not the bridge or other places also named Stabekk. */
export function resolveStabekk(locations: YrLocation[]): YrLocation {
  const inBaerum = locations.filter(
    (location) => location.name === "Stabekk" && location.subregion?.name === "Bærum",
  );
  const place = inBaerum.find((location) => location.category?.id === "CH09") ?? inBaerum[0];
  if (!place) {
    throw new Error("Yr did not resolve Stabekk");
  }
  return place;
}

export function stabekkForecastUrl(location: YrLocation): string {
  const href = location._links?.forecast?.href ?? "";
  if (!href.startsWith("/api/v0/locations/") || !href.endsWith("/forecast")) {
    throw new Error("Yr location is missing a forecast link");
  }
  return `${YR_ORIGIN}${href}`;
}

function toSeries(intervals: YrShortInterval[]): MetSeries[] {
  return intervals.flatMap((interval) => {
    if (!interval.start || typeof interval.temperature?.value !== "number") return [];
    return [
      {
        time: interval.start,
        data: {
          instant: { details: { air_temperature: interval.temperature.value } },
          next_1_hours: {
            summary: { symbol_code: interval.symbolCode?.next1Hour },
            details: { precipitation_amount: interval.precipitation?.value ?? 0 },
          },
          next_6_hours: { summary: { symbol_code: interval.symbolCode?.next6Hours } },
        },
      },
    ];
  });
}

async function yrJson<T>(url: string): Promise<{ payload: T; expiresAt: number }> {
  const response = await fetch(url, {
    headers: { "User-Agent": YR_USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Yr responded ${response.status}`);
  }
  const expiresHeader = Date.parse(response.headers.get("expires") ?? "");
  return {
    payload: (await response.json()) as T,
    expiresAt: Number.isFinite(expiresHeader) ? expiresHeader : Date.now() + 30 * 60 * 1000,
  };
}

export async function getWeather(now = new Date()): Promise<{ view: WeatherView; maxAge: number }> {
  const timestamp = Date.now();
  if (cache && cache.expiresAt > timestamp) {
    return {
      view: cache.view,
      maxAge: Math.max(1, Math.round((cache.expiresAt - timestamp) / 1000)),
    };
  }

  try {
    const search = await yrJson<{ _embedded?: { location?: YrLocation[] } }>(STABEKK_SEARCH_URL);
    const place = resolveStabekk(search.payload._embedded?.location ?? []);
    const forecast = await yrJson<YrForecast>(stabekkForecastUrl(place));
    const view = buildWeather(toSeries(forecast.payload.shortIntervals ?? []), now);
    remember(view, forecast.expiresAt);
    return {
      view,
      maxAge: Math.max(1, Math.round((forecast.expiresAt - Date.now()) / 1000)),
    };
  } catch {
    const expiresAt = timestamp + 60 * 1000;
    remember(fixtureWeather, expiresAt);
    return { view: fixtureWeather, maxAge: 60 };
  }
}
