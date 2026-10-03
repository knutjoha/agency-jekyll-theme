import { MiddagScreen } from "@/components/middag/MiddagScreen";
import { loadHallway } from "@/lib/hallway";

export const dynamic = "force-dynamic";

export default async function MiddagPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const hallway = await loadHallway(searchParams);
  return <MiddagScreen {...hallway} />;
}
