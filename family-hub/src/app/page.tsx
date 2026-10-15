import { HomeScreen } from "@/components/hjem/HomeScreen";
import { loadHallway } from "@/lib/hallway";
import { loadDinner } from "@/lib/household/store";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const [hallway, dinner] = await Promise.all([
    loadHallway(Promise.resolve(params), { includeCalendar: true }),
    loadDinner({ snapshot }),
  ]);
  return (
    <HomeScreen
      {...hallway}
      dinner={{ persisted: dinner.persisted, week: dinner.week, days: dinner.days }}
    />
  );
}
