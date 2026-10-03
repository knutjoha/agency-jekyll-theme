import { fixtureWeather } from "@/data/fixture";
import type { WeatherView } from "@/data/types";
import { getWeather } from "@/lib/weather";

export type HallwayData = {
  snapshot: boolean;
  initialWeather: WeatherView;
  initialNow: string;
};

export async function loadHallway(searchParams: Promise<{ snapshot?: string | string[] }>): Promise<HallwayData> {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const initialWeather = snapshot ? fixtureWeather : (await getWeather()).view;
  return {
    snapshot,
    initialWeather,
    initialNow: new Date().toISOString(),
  };
}
