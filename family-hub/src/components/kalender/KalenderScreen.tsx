"use client";

import { KalenderMobile } from "@/components/kalender/KalenderMobile";
import { WeekGrid } from "@/components/kalender/WeekGrid";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";

export function KalenderScreen(props: HallwayData) {
  return (
    <HallwayPage
      {...props}
      mobile={(clock, weather) => <KalenderMobile clock={clock} weather={weather} />}
    >
      {(clock) => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <WeekGrid clock={clock} />
        </div>
      )}
    </HallwayPage>
  );
}
