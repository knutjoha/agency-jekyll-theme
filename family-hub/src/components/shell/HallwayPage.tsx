"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HomeHeader } from "@/components/hjem/HomeHeader";
import { fixtureWeather } from "@/data/fixture";
import type { WeatherView } from "@/data/types";
import type { HallwayData } from "@/lib/hallway";
import { SNAPSHOT_AT, formatOslo, type OsloNow } from "@/lib/oslo";

export function HallwayPage({
  snapshot,
  initialWeather,
  initialNow,
  children,
  mobile,
}: HallwayData & {
  children: (clock: OsloNow, weather: WeatherView) => ReactNode;
  mobile?: (clock: OsloNow, weather: WeatherView) => ReactNode;
}) {
  const [now, setNow] = useState(() => (snapshot ? SNAPSHOT_AT : new Date(initialNow)));
  const [weather, setWeather] = useState<WeatherView>(snapshot ? fixtureWeather : initialWeather);

  useEffect(() => {
    if (snapshot) {
      setNow(SNAPSHOT_AT);
      setWeather(fixtureWeather);
      return;
    }

    const tick = () => setNow(new Date());
    tick();
    let interval = 0;
    const delay = 60_000 - (Date.now() % 60_000);
    const timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [snapshot]);

  useEffect(() => {
    if (snapshot) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const response = await fetch("/api/weather");
        if (!response.ok) throw new Error(String(response.status));
        const next = (await response.json()) as WeatherView;
        if (!cancelled && next.slots?.length === 8) setWeather(next);
      } catch {
        if (!cancelled) setWeather(fixtureWeather);
      }
    };
    const interval = window.setInterval(pull, weather.source === "fixture" ? 60_000 : 10 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [snapshot, weather.source]);

  const clock = formatOslo(now);

  return (
    <div
      className={mobile ? "hallway-page has-phone" : "hallway-page"}
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 32,
      }}
    >
      <div className="only-wide">
        <HomeHeader clock={clock} weather={weather} />
        {children(clock, weather)}
      </div>
      {mobile ? <div className="only-phone">{mobile(clock, weather)}</div> : null}
    </div>
  );
}
