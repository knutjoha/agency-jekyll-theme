import { HomeScreen } from "@/components/hjem/HomeScreen";
import { loadHallway } from "@/lib/hallway";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const hallway = await loadHallway(searchParams, { includeCalendar: true });
  return <HomeScreen {...hallway} />;
}
