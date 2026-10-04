"use client";

import { TodoBoard } from "@/components/todo/TodoBoard";
import { TodoMobile } from "@/components/todo/TodoMobile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { TodoLane } from "@/data/types";
import type { HallwayData } from "@/lib/hallway";

export function TodoScreen({
  lanes,
  persisted,
  ...hallway
}: HallwayData & { lanes: TodoLane[]; persisted: boolean }) {
  return (
    <HallwayPage {...hallway} mobile={(clock, weather) => <TodoMobile clock={clock} weather={weather} lanes={lanes} persisted={persisted} />}>
      {() => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <TodoBoard lanes={lanes} persisted={persisted} />
        </div>
      )}
    </HallwayPage>
  );
}
