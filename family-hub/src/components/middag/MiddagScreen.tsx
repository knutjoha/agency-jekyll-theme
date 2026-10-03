"use client";

import { MiddagBoard } from "@/components/middag/MiddagBoard";
import { MiddagMobile } from "@/components/middag/MiddagMobile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { DinnerMenu } from "@/data/types";
import type { HallwayData } from "@/lib/hallway";

export function MiddagScreen({
  menu,
  menuPersisted,
  shoppingPersisted,
  ...hallway
}: HallwayData & { menu: DinnerMenu; menuPersisted: boolean; shoppingPersisted: boolean }) {
  return (
    <HallwayPage
      {...hallway}
      mobile={(clock, weather) => (
        <MiddagMobile clock={clock} weather={weather} menu={menu} menuPersisted={menuPersisted} shoppingPersisted={shoppingPersisted} />
      )}
    >
      {(clock) => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <MiddagBoard clock={clock} menu={menu} menuPersisted={menuPersisted} shoppingPersisted={shoppingPersisted} />
        </div>
      )}
    </HallwayPage>
  );
}
