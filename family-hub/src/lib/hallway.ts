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
  const now = new Date();
  // Weather and calendar do not depend on each other. The Yr search still has to
  // finish before the forecast request, because the forecast URL comes from it.
  const [initialWeather, initialCalendar] = await Promise.all([
    snapshot ? Promise.resolve(fixtureWeather) : getWeather(now).then((result) => result.view),
    snapshot || !options?.includeCalendar ? Promise.resolve(fixturePayload()) : getCalendar({ now }),
  ]);
  return {
    snapshot,
    initialWeather,
    initialNow: now.toISOString(),
    initialCalendar,
  };
}
