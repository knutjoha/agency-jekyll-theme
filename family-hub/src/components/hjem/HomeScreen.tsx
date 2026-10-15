"use client";

import Link from "next/link";
import { dinner as fixtureDinner } from "@/data/fixture";
import { navHref } from "@/components/shell/navItems";
import { DeparturesTile } from "@/components/hjem/DeparturesTile";
import { DinnerTile } from "@/components/hjem/DinnerTile";
import { FreshnessLine } from "@/components/hjem/FreshnessLine";
import { HomeMobile } from "@/components/hjem/HomeMobile";
import { SoonTile } from "@/components/hjem/SoonTile";
import { TodayTile } from "@/components/hjem/TodayTile";
import { WeatherTile } from "@/components/hjem/WeatherTile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { CalendarPayload, CalendarSource, Person, SoonItem, WeatherView } from "@/data/types";
import { fixtureDepartures, selectDepartureLines, type LineDepartures } from "@/lib/departures";
import { rollSoon, withEventPhases, type HomeDinner, type SectionId, type SectionPhase } from "@/lib/home-cache";
import { meteogramNowHour, SNAPSHOT_AT, type OsloNow } from "@/lib/oslo";
import { useCalendar } from "@/lib/use-calendar";
import { useHomeLive } from "@/lib/use-home-live";

const HOLD_LABEL: Record<SectionId, string> = {
  calendar: "Fikk ikke hentet kalenderen",
  weather: "Fikk ikke hentet været",
  dinner: "Fikk ikke hentet middagen",
  departures: "Fikk ikke hentet avgangene",
};

function Hold({ region, phase, section }: { region: string; phase: SectionPhase; section: SectionId }) {
  const waiting = phase === "loading" || phase === "updating";
  return (
    <section
      data-region={region}
      data-state={waiting ? "loading" : phase}
      aria-busy={waiting}
      className="sk-tile"
      style={{
        width: "100%",
        minHeight: 120,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 24,
      }}
    >
      {waiting ? (
        <>
          <div className="sk-bone" style={{ width: 128, height: 18 }} />
          <div className="sk-bone" style={{ width: "78%", height: 14 }} />
          <div className="sk-bone" style={{ width: "52%", height: 14 }} />
        </>
      ) : (
        <>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              lineHeight: 1.3,
              color: "var(--text-muted)",
            }}
          >
            {phase === "offline" ? "Ingen nett" : HOLD_LABEL[section]}
          </div>
          <FreshnessLine phase={phase} updatedAt={null} />
        </>
      )}
    </section>
  );
}

function HomeColumns({
  snapshot,
  clock,
  weather,
  people,
  soon,
  dinner,
  departures,
  source,
  phase,
  updatedAt,
}: {
  snapshot: boolean;
  clock: OsloNow;
  weather: WeatherView | null;
  people: Person[] | null;
  soon: SoonItem[] | null;
  dinner: HomeDinner | null;
  departures: LineDepartures[] | null;
  source: CalendarSource;
  phase: Record<SectionId, SectionPhase> | null;
  updatedAt: Record<SectionId, string | null> | null;
}) {
  const note = (section: SectionId) =>
    phase && updatedAt ? <FreshnessLine phase={phase[section]} updatedAt={updatedAt[section]} /> : null;
  const phased = people ? withEventPhases(people, clock) : null;

  return (
    <div
      data-home={snapshot ? "snapshot" : "live"}
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
        {phased ? (
          <TodayTile people={phased} numericDate={clock.numericDate} source={source} note={note("calendar")} />
        ) : (
          <Hold region="today" phase={phase?.calendar ?? "loading"} section="calendar" />
        )}
        {weather ? (
          <WeatherTile weather={weather} nowHour={meteogramNowHour(clock.hour)} note={note("weather")} />
        ) : (
          <Hold region="weather" phase={phase?.weather ?? "loading"} section="weather" />
        )}
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
        {dinner ? (
          <Link href={navHref("/middag", snapshot)} aria-label="Åpne middag" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <DinnerTile dinner={dinner} note={note("dinner")} />
          </Link>
        ) : (
          <Hold region="dinner" phase={phase?.dinner ?? "loading"} section="dinner" />
        )}
        {departures ? (
          <DeparturesTile lines={departures} note={note("departures")} />
        ) : (
          <Hold region="departures" phase={phase?.departures ?? "loading"} section="departures" />
        )}
        {soon ? <SoonTile items={soon} note={note("calendar")} /> : <Hold region="soon" phase={phase?.calendar ?? "loading"} section="calendar" />}
      </div>
    </div>
  );
}

function FrozenHome({
  initialNow,
  initialWeather,
  initialCalendar,
}: {
  initialNow: string;
  initialWeather: WeatherView;
  initialCalendar: CalendarPayload;
}) {
  const calendar = useCalendar(true, initialCalendar, null);
  return (
    <HallwayPage
      snapshot
      initialWeather={initialWeather}
      initialNow={initialNow}
      mobile={(clock, weather) => (
        <HomeMobile
          clock={clock}
          weather={weather}
          people={calendar.todayPeople}
          soon={calendar.soon ?? []}
          departures={selectDepartureLines(fixtureDepartures.rows, SNAPSHOT_AT)}
        />
      )}
    >
      {(clock) => (
        <HomeColumns
          snapshot
          clock={clock}
          weather={initialWeather}
          people={calendar.todayPeople}
          soon={calendar.soon ?? []}
          dinner={{ dish: fixtureDinner.dish, shoppingCount: fixtureDinner.shoppingCount, planned: true }}
          departures={selectDepartureLines(fixtureDepartures.rows, SNAPSHOT_AT)}
          source={calendar.source}
          phase={null}
          updatedAt={null}
        />
      )}
    </HallwayPage>
  );
}

function LiveHome({ initialNow }: { initialNow: string }) {
  const live = useHomeLive();
  const people = live.calendar?.todayPeople ?? null;
  const soon = live.calendar ? rollSoon(live.calendar.soon ?? [], new Date()) : null;
  return (
    <HallwayPage
      snapshot={false}
      initialWeather={live.weather}
      initialNow={initialNow}
      externalWeather
      mobile={(clock) => (
        <HomeMobile
          clock={clock}
          weather={live.weather}
          people={people ? withEventPhases(people, clock) : []}
          soon={soon ?? []}
          dinner={live.dinner}
          departures={live.departures ? selectDepartureLines(live.departures.rows, new Date()) : null}
          phase={live.phase}
          updatedAt={live.updatedAt}
          waiting={!live.calendar}
        />
      )}
    >
      {(clock) => (
        <HomeColumns
          snapshot={false}
          clock={clock}
          weather={live.weather}
          people={people}
          soon={soon}
          dinner={live.dinner}
          departures={live.departures ? selectDepartureLines(live.departures.rows, new Date()) : null}
          source={live.calendar?.source ?? "fixture"}
          phase={live.phase}
          updatedAt={live.updatedAt}
        />
      )}
    </HallwayPage>
  );
}

export function HomeScreen(props: {
  snapshot: boolean;
  initialNow: string;
  initialWeather: WeatherView | null;
  initialCalendar: CalendarPayload | null;
}) {
  if (props.snapshot && props.initialWeather && props.initialCalendar) {
    return (
      <FrozenHome
        initialNow={props.initialNow}
        initialWeather={props.initialWeather}
        initialCalendar={props.initialCalendar}
      />
    );
  }
  return <LiveHome initialNow={props.initialNow} />;
}
