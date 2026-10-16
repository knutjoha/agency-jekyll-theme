"use client";

import { VerdiBoard } from "@/components/verdi/VerdiBoard";
import { VerdiMobile } from "@/components/verdi/VerdiMobile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";
import type { VerdiWeek } from "@/lib/verdi/model";

export function VerdiScreen({
  week,
  persisted,
  ...hallway
}: HallwayData & { week: VerdiWeek; persisted: boolean }) {
  return (
    <HallwayPage
      {...hallway}
      mobile={(clock, weather) => <VerdiMobile clock={clock} weather={weather} week={week} persisted={persisted} />}
    >
      {() => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%", minWidth: 0, overflow: "hidden" }}>
          <VerdiBoard week={week} persisted={persisted} />
        </div>
      )}
    </HallwayPage>
  );
}
