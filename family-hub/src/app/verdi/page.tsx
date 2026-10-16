import { VerdiScreen } from "@/components/verdi/VerdiScreen";
import { loadHallway } from "@/lib/hallway";
import { SNAPSHOT_AT } from "@/lib/oslo";
import { loadVerdi } from "@/lib/verdi/store";

export const dynamic = "force-dynamic";

export default async function VerdiPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[] }>;
}) {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const [hallway, verdi] = await Promise.all([
    loadHallway(Promise.resolve(params)),
    loadVerdi({ snapshot, now: snapshot ? SNAPSHOT_AT : undefined }),
  ]);
  return <VerdiScreen {...hallway} week={verdi.week} persisted={verdi.persisted} />;
}
