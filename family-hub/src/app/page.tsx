import { HomeScreen } from "@/components/hjem/HomeScreen";
import { fixtureWeather } from "@/data/fixture";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const weather = snapshot ? fixtureWeather : (await getWeather()).view;

  return (
    <HomeScreen
      snapshot={snapshot}
      initialWeather={weather}
      initialNow={new Date().toISOString()}
    />
  );
}
