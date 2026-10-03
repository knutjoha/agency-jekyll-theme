"use client";

import { useEffect, useState } from "react";
import type { CalendarPayload } from "@/data/types";
import { fixturePayload, isCalendarPayload } from "@/lib/calendar-view";

export function useCalendar(
  snapshot: boolean,
  initial: CalendarPayload,
  week: string | null,
): CalendarPayload {
  const [calendar, setCalendar] = useState(initial);

  useEffect(() => {
    if (snapshot) {
      setCalendar(fixturePayload());
      return;
    }

    let cancelled = false;
    const pull = async () => {
      try {
        const query = week ? `?week=${encodeURIComponent(week)}` : "";
        const response = await fetch(`/api/calendar${query}`);
        if (!response.ok) return;
        const next: unknown = await response.json();
        if (!cancelled && isCalendarPayload(next)) setCalendar(next);
      } catch {
        // The server route already falls back. Keep the last payload on a network miss.
      }
    };

    void pull();
    const interval = window.setInterval(pull, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [snapshot, week]);

  return snapshot ? fixturePayload() : calendar;
}
