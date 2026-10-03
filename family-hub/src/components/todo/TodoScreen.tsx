"use client";

import { TodoBoard } from "@/components/todo/TodoBoard";
import { TodoMobile } from "@/components/todo/TodoMobile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";

export function TodoScreen(props: HallwayData) {
  return (
    <HallwayPage {...props} mobile={(clock, weather) => <TodoMobile clock={clock} weather={weather} />}>
      {() => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <TodoBoard />
        </div>
      )}
    </HallwayPage>
  );
}
