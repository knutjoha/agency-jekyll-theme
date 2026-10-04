"use client";

import { useRef, useState } from "react";
import { KalenderMobile } from "@/components/kalender/KalenderMobile";
import { WeekGrid } from "@/components/kalender/WeekGrid";
import { HallwayPage } from "@/components/shell/HallwayPage";
import { addIsoDays } from "@/lib/calendar-view";
import type { HallwayData } from "@/lib/hallway";
import { useCalendar } from "@/lib/use-calendar";

export function KalenderScreen(props: HallwayData) {
  const [weekQuery, setWeekQuery] = useState<string | null>(null);
  const requestedWeek = useRef<string | null>(null);
  const calendar = useCalendar(props.snapshot, props.initialCalendar, weekQuery);

  return (
    <HallwayPage
      {...props}
      mobile={(clock, weather) => (
        <KalenderMobile
          clock={clock}
          weather={weather}
          week={calendar.week}
          source={calendar.source}
        />
      )}
    >
      {(clock) => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%" }}>
          <WeekGrid
            clock={clock}
            week={calendar.week}
            source={calendar.source}
            onShift={(startsOn, deltaWeeks) => {
              if (calendar.source !== "google") return;
              const base = requestedWeek.current ?? startsOn;
              const next = addIsoDays(base, deltaWeeks * 7);
              requestedWeek.current = next;
              setWeekQuery(next);
            }}
          />
        </div>
      )}
    </HallwayPage>
  );
}
