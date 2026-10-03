"use client";

import { useEffect, useState } from "react";
import { dinner, fixtureWeather, people, soon } from "@/data/fixture";
import type { WeatherView } from "@/data/types";
import { DinnerTile } from "@/components/hjem/DinnerTile";
import { HomeHeader } from "@/components/hjem/HomeHeader";
import { SoonTile } from "@/components/hjem/SoonTile";
import { TodayTile } from "@/components/hjem/TodayTile";
import { WeatherTile } from "@/components/hjem/WeatherTile";
import { SNAPSHOT_AT, formatOslo, meteogramNowHour } from "@/lib/oslo";

export function HomeScreen({
  snapshot,
  initialWeather,
  initialNow,
}: {
  snapshot: boolean;
  initialWeather: WeatherView;
  initialNow: string;
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
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 32,
      }}
    >
      <HomeHeader clock={clock} weather={weather} />
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
    </div>
  );
}
