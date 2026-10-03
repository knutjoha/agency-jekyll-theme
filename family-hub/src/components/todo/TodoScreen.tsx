"use client";

import { TodoBoard } from "@/components/todo/TodoBoard";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";

export function TodoScreen(props: HallwayData) {
  return (
    <HallwayPage {...props}>
      {() => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <TodoBoard />
        </div>
      )}
    </HallwayPage>
  );
}
