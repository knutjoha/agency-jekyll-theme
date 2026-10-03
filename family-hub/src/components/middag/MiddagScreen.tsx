"use client";

import { MiddagBoard } from "@/components/middag/MiddagBoard";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";

export function MiddagScreen(props: HallwayData) {
  return (
    <HallwayPage {...props}>
      {(clock) => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <MiddagBoard clock={clock} />
        </div>
      )}
    </HallwayPage>
  );
}
