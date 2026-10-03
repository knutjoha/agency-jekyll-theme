import { fixtureWeather } from "@/data/fixture";
import type { CalendarPayload, WeatherView } from "@/data/types";
import { getCalendar } from "@/lib/calendar";
import { fixturePayload } from "@/lib/calendar-view";
import { getWeather } from "@/lib/weather";

export type HallwayData = {
  snapshot: boolean;
  initialWeather: WeatherView;
  initialNow: string;
  initialCalendar: CalendarPayload;
};

export async function loadHallway(
  searchParams: Promise<{ snapshot?: string | string[] }>,
  options?: { includeCalendar?: boolean },
): Promise<HallwayData> {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const initialWeather = snapshot ? fixtureWeather : (await getWeather()).view;
  const initialCalendar =
    snapshot || !options?.includeCalendar ? fixturePayload() : await getCalendar();
  return {
    snapshot,
    initialWeather,
    initialNow: new Date().toISOString(),
    initialCalendar,
  };
}
