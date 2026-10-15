"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HomeHeader } from "@/components/hjem/HomeHeader";
import { fixtureWeather } from "@/data/fixture";
import type { WeatherView } from "@/data/types";
import { SNAPSHOT_AT, formatOslo, type OsloNow } from "@/lib/oslo";

export function HallwayPage({
  snapshot,
  initialWeather,
  initialNow,
  externalWeather = false,
  children,
  mobile,
}: {
  snapshot: boolean;
  initialWeather: WeatherView | null;
  initialNow: string;
  /** When set, the parent owns weather fetches. The prop is the live value, including null. */
  externalWeather?: boolean;
  children: (clock: OsloNow, weather: WeatherView) => ReactNode;
  mobile?: (clock: OsloNow, weather: WeatherView) => ReactNode;
}) {
  const [now, setNow] = useState(() => (snapshot ? SNAPSHOT_AT : new Date(initialNow)));
  const [internalWeather, setInternalWeather] = useState<WeatherView | null>(snapshot ? fixtureWeather : initialWeather);
  const sourceRef = useRef(initialWeather?.source);
  const weather = externalWeather ? initialWeather : snapshot ? fixtureWeather : internalWeather;
  sourceRef.current = weather?.source;

  useEffect(() => {
    if (snapshot) {
      setNow(SNAPSHOT_AT);
      setInternalWeather(fixtureWeather);
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
    if (snapshot || externalWeather) return;
    let cancelled = false;
    let interval = 0;

    const pull = async () => {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as WeatherView;
        if (!cancelled && next.slots?.length === 8) setInternalWeather(next);
      } catch {
        // Keep the last forecast. A miss must not replace today's weather with the fixture.
      }
    };

    const arm = () => {
      window.clearInterval(interval);
      interval = window.setInterval(pull, sourceRef.current === "fixture" ? 60_000 : 10 * 60_000);
    };

    void pull().finally(() => {
      if (!cancelled) arm();
    });

    const onWake = () => {
      if (!document.hidden) void pull();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("online", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [snapshot, externalWeather]);

  const clock = formatOslo(now);
  const shown = weather ?? fixtureWeather;

  return (
    <div
      className={mobile ? "hallway-page has-phone" : "hallway-page"}
      style={{
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 32,
        overflow: "auto",
        width: "100%",
        maxWidth: 1820,
        margin: "0 auto",
      }}
    >
      <div className="only-wide">
        <HomeHeader clock={clock} weather={shown} pending={weather == null} />
        {children(clock, shown)}
      </div>
      {mobile ? <div className="only-phone">{mobile(clock, shown)}</div> : null}
    </div>
  );
}
