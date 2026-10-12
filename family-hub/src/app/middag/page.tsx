import { MiddagScreen } from "@/components/middag/MiddagScreen";
import { loadDinner, loadShopping } from "@/lib/household/store";
import { loadHallway } from "@/lib/hallway";

export const dynamic = "force-dynamic";

export default async function MiddagPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshot?: string | string[]; week?: string | string[] }>;
}) {
  const params = await searchParams;
  const snapshot = params.snapshot === "1";
  const week = typeof params.week === "string" ? params.week : null;
  const [hallway, dinner, shopping] = await Promise.all([
    loadHallway(Promise.resolve(params)),
    loadDinner({ snapshot, week }),
    loadShopping({ snapshot, week }),
  ]);
  return (
    <MiddagScreen
      {...hallway}
      week={dinner.week}
      menu={{
        startsOn: dinner.startsOn,
        period: dinner.period,
        days: dinner.days,
        aisles: shopping.aisles,
      }}
      menuPersisted={dinner.persisted}
      shoppingPersisted={shopping.persisted}
    />
  );
}
