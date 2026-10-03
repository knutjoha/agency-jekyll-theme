"use client";

import { dinner, people, soon } from "@/data/fixture";
import { DinnerTile } from "@/components/hjem/DinnerTile";
import { HomeMobile } from "@/components/hjem/HomeMobile";
import { SoonTile } from "@/components/hjem/SoonTile";
import { TodayTile } from "@/components/hjem/TodayTile";
import { WeatherTile } from "@/components/hjem/WeatherTile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";
import { meteogramNowHour } from "@/lib/oslo";

export function HomeScreen(props: HallwayData) {
  return (
    <HallwayPage
      {...props}
      mobile={(clock, weather) => <HomeMobile clock={clock} weather={weather} />}
    >
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
            <TodayTile people={people} numericDate={clock.numericDate} />
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
