"use client";

import { dinner, soon } from "@/data/fixture";
import { DinnerTile } from "@/components/hjem/DinnerTile";
import { SoonTile } from "@/components/hjem/SoonTile";
import { TodayTile } from "@/components/hjem/TodayTile";
import { WeatherTile } from "@/components/hjem/WeatherTile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";
import { useCalendar } from "@/lib/use-calendar";
import { meteogramNowHour } from "@/lib/oslo";

export function HomeScreen(props: HallwayData) {
  const calendar = useCalendar(props.snapshot, props.initialCalendar, null);

  return (
    <HallwayPage {...props}>
      {(clock, weather) => (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          <div
            data-region="left"
            style={{
              width: 786,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <TodayTile people={calendar.todayPeople} numericDate={clock.numericDate} source={calendar.source} />
            <WeatherTile weather={weather} nowHour={meteogramNowHour(clock.hour)} />
          </div>
          <div
            data-region="right"
            style={{
              width: 400,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <DinnerTile dinner={dinner} />
            <SoonTile items={soon} />
          </div>
        </div>
      )}
    </HallwayPage>
  );
}
