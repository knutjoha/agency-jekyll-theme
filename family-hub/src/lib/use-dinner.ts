"use client";

import { useEffect, useState } from "react";
import { isDinnerWeekPayload, type DinnerWeekPayload } from "@/lib/dinner/today";

export function useDinner(snapshot: boolean, initial: DinnerWeekPayload): DinnerWeekPayload {
  const [dinner, setDinner] = useState(initial);

  useEffect(() => {
    if (snapshot) return;

    let cancelled = false;
    const pull = async () => {
      try {
        const response = await fetch("/api/dinner", { cache: "no-store" });
        if (!response.ok) return;
        const next: unknown = await response.json();
        if (!cancelled && isDinnerWeekPayload(next)) setDinner(next);
      } catch {
        // The server route already falls back. Keep the last week on a network miss.
      }
    };

    void pull();
    const onVisible = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [snapshot]);

  return snapshot ? initial : dinner;
}
