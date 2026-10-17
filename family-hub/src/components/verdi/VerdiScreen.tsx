"use client";

import { useRef, useState } from "react";
import { VerdiBoard } from "@/components/verdi/VerdiBoard";
import { VerdiMobile } from "@/components/verdi/VerdiMobile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import { addIsoDays } from "@/lib/calendar-view";
import type { HallwayData } from "@/lib/hallway";
import { cloneVerdiWeek, emptyWeekFor, type VerdiWeek } from "@/lib/verdi/model";

function isLoadedWeek(value: unknown, expected: string): value is VerdiWeek {
  if (typeof value !== "object" || value === null) return false;
  const week = value as VerdiWeek;
  return week.week === expected && Array.isArray(week.lanes) && Array.isArray(week.pool);
}

export function VerdiScreen({
  week: initial,
  persisted,
  ...hallway
}: HallwayData & { week: VerdiWeek; persisted: boolean }) {
  const [week, setWeek] = useState(() => cloneVerdiWeek(initial));
  const requestedWeek = useRef<string | null>(null);
  const cache = useRef(new Map<string, VerdiWeek>([[initial.week, cloneVerdiWeek(initial)]]));
  const canShift = !hallway.snapshot;

  function onShift(from: VerdiWeek, deltaWeeks: number) {
    if (!canShift) return;
    cache.current.set(from.week, cloneVerdiWeek(from));
    const base = requestedWeek.current ?? from.week;
    const next = addIsoDays(base, deltaWeeks * 7);
    requestedWeek.current = next;
    if (!persisted) {
      setWeek(cloneVerdiWeek(cache.current.get(next) ?? emptyWeekFor(next, from.basics)));
      return;
    }
    void (async () => {
      try {
        const response = await fetch(`/api/verdi?week=${encodeURIComponent(next)}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { week?: unknown };
        if (requestedWeek.current !== next) return;
        if (!isLoadedWeek(payload.week, next)) return;
        const loaded = cloneVerdiWeek(payload.week);
        cache.current.set(next, loaded);
        setWeek(loaded);
      } catch {
        // Keep the week already on screen.
      }
    })();
  }

  return (
    <HallwayPage
      {...hallway}
      mobile={(clock, weather) => (
        <VerdiMobile
          key={week.week}
          clock={clock}
          weather={weather}
          week={week}
          persisted={persisted}
          canShift={canShift}
          onShift={onShift}
        />
      )}
    >
      {() => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%", minWidth: 0, overflow: "hidden" }}>
          <VerdiBoard key={week.week} week={week} persisted={persisted} canShift={canShift} onShift={onShift} />
        </div>
      )}
    </HallwayPage>
  );
}
