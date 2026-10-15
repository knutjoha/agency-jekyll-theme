import { HomeScreen } from "@/components/hjem/HomeScreen";
import { fixtureWeather } from "@/data/fixture";
import { fixturePayload } from "@/lib/calendar-view";
import { SNAPSHOT_AT } from "@/lib/oslo";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  // The shell renders before calendar, weather or dinner. Those load in the browser.
  if (snapshot) {
    return (
      <HomeScreen
        snapshot
        initialWeather={fixtureWeather}
        initialNow={SNAPSHOT_AT.toISOString()}
        initialCalendar={fixturePayload()}
      />
    );
  }
  return <HomeScreen snapshot={false} initialWeather={null} initialNow={new Date().toISOString()} initialCalendar={null} />;
}
