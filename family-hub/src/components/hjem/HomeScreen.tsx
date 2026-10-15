"use client";

import Link from "next/link";
import { navHref } from "@/components/shell/navItems";
import { DinnerTile } from "@/components/hjem/DinnerTile";
import { HomeMobile } from "@/components/hjem/HomeMobile";
import { SoonTile } from "@/components/hjem/SoonTile";
import { TodayTile } from "@/components/hjem/TodayTile";
import { WeatherTile } from "@/components/hjem/WeatherTile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { HallwayData } from "@/lib/hallway";
import { dinnerTileForToday, todayIsoFromClock, type DinnerWeekPayload } from "@/lib/dinner/today";
import { useCalendar } from "@/lib/use-calendar";
import { useDinner } from "@/lib/use-dinner";
import { meteogramNowHour } from "@/lib/oslo";

export function HomeScreen(props: HallwayData & { dinner: DinnerWeekPayload }) {
  const calendar = useCalendar(props.snapshot, props.initialCalendar, null);
  const dinnerWeek = useDinner(props.snapshot, props.dinner);

  return (
    <HallwayPage
      {...props}
      mobile={(clock, weather) => (
        <HomeMobile
          clock={clock}
          weather={weather}
          people={calendar.todayPeople}
          soon={calendar.soon ?? []}
        />
      )}
    >
      {(clock, weather) => {
        const today = todayIsoFromClock(clock);
        const dinner = today
          ? dinnerTileForToday(dinnerWeek.days, dinnerWeek.week, today)
          : { dish: "", shoppingCount: 0 };

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "flex-start",
              width: "100%",
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              data-region="left"
              style={{
                flex: "1 1 32rem",
                minWidth: 0,
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
                flex: "1 1 18rem",
                minWidth: 0,
                maxWidth: 480,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <Link href={navHref("/middag", props.snapshot)} aria-label="Åpne middag" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <DinnerTile dinner={dinner} />
              </Link>
              <SoonTile items={calendar.soon ?? []} />
            </div>
          </div>
        );
      }}
    </HallwayPage>
  );
}
