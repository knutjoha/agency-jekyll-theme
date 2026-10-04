import { KalenderScreen } from "@/components/kalender/KalenderScreen";
import { loadHallway } from "@/lib/hallway";

export const dynamic = "force-dynamic";

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const hallway = await loadHallway(searchParams, { includeCalendar: true });
  return <KalenderScreen {...hallway} />;
}
