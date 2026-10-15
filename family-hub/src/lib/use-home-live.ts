"use client";

import { useLayoutEffect, useState } from "react";
import type { CalendarPayload, WeatherView } from "@/data/types";
import type { DeparturesView } from "@/lib/departures";
import {
  browserStore,
  HOME_SECTIONS,
  initialPhase,
  reconcileDinner,
  msUntilOsloMidnight,
  retryDelayMs,
  sameSnapshotValue,
  SECTION_REFRESH_MS,
  sectionsToRefresh,
  visibleHome,
  writeHomeSection,
  type HomeDinner,
  type KeyValueStore,
  type SectionId,
  type SectionPhase,
} from "@/lib/home-cache";
import { loadCalendar, loadDepartures, loadDinner, loadWeather, SECTION_TIMEOUT_MS, type LoadedDinner } from "@/lib/home-load";
import { osloDateKey } from "@/lib/oslo";

export type HomeLive = {
  calendar: CalendarPayload | null;
  weather: WeatherView | null;
  dinner: HomeDinner | null;
  departures: DeparturesView | null;
  phase: Record<SectionId, SectionPhase>;
  updatedAt: Record<SectionId, string | null>;
};

const RESUME_GAP_MS = 1500;

function onlineNow(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") return true;
  return navigator.onLine;
}

function emptyLive(now: Date): LiveState {
  // The first render must match the server. Navigator is not a reliable signal there.
  return {
    osloDate: osloDateKey(now),
    calendar: null,
    weather: null,
    dinner: null,
    departures: null,
    phase: { calendar: "loading", weather: "loading", dinner: "loading", departures: "loading" },
    updatedAt: { calendar: null, weather: null, dinner: null, departures: null },
  };
}

type LiveState = HomeLive & { osloDate: string };

function fromStore(store: KeyValueStore, now: Date): LiveState {
  const visible = visibleHome(store, now);
  const online = onlineNow();
  return {
    osloDate: osloDateKey(now),
    calendar: visible.calendar.data,
    weather: visible.weather.data,
    dinner: visible.dinner.data,
    departures: visible.departures.data,
    updatedAt: {
      calendar: visible.calendar.updatedAt,
      weather: visible.weather.updatedAt,
      dinner: visible.dinner.updatedAt,
      departures: visible.departures.updatedAt,
    },
    phase: {
      calendar: initialPhase(visible.calendar.freshness, online),
      weather: initialPhase(visible.weather.freshness, online),
      dinner: initialPhase(visible.dinner.freshness, online),
      departures: initialPhase(visible.departures.freshness, online),
    },
  };
}

function dinnerValue(loaded: LoadedDinner, previous: HomeDinner | null): { dinner: HomeDinner; confirmed: boolean } {
  return reconcileDinner(previous, loaded);
}

export function useHomeLive(): HomeLive {
  const [state, setState] = useState<LiveState>(() => emptyLive(new Date()));

  useLayoutEffect(() => {
    const store = browserStore();
    const dinnerRef: { current: HomeDinner | null } = { current: null };
    let stopped = false;
    let lastAll = 0;
    let calendarTimer = 0;
    let dinnerTimer = 0;
    let weatherTimer = 0;
    let departuresTimer = 0;
    let midnightTimer = 0;
    let resumeTimer = 0;
    const retryTimers: Record<SectionId, number> = { calendar: 0, weather: 0, dinner: 0, departures: 0 };
    const attempts: Record<SectionId, number> = { calendar: 0, weather: 0, dinner: 0, departures: 0 };
    const inflight: Record<SectionId, boolean> = { calendar: false, weather: false, dinner: false, departures: false };
    const controllers: Record<SectionId, AbortController | null> = { calendar: null, weather: null, dinner: null, departures: null };

    const now = new Date();
    if (store) {
      const cached = fromStore(store, now);
      dinnerRef.current = cached.dinner;
      setState(cached);
    }

    const mark = (section: SectionId, phase: SectionPhase) => {
      setState((current) => ({ ...current, phase: { ...current.phase, [section]: phase } }));
    };

    const dropIfNewDay = () => {
      const today = osloDateKey(new Date());
      setState((current) => {
        if (current.osloDate === today) return current;
        dinnerRef.current = null;
        const phase = onlineNow() ? "loading" : "offline";
        return {
          osloDate: today,
          calendar: null,
          weather: null,
          dinner: null,
          departures: null,
          updatedAt: { calendar: null, weather: null, dinner: null, departures: null },
          phase: { calendar: phase, weather: phase, dinner: phase, departures: phase },
        };
      });
    };

    const refresh = async (section: SectionId) => {
      if (stopped || inflight[section] || document.hidden) return;
      inflight[section] = true;
      window.clearTimeout(retryTimers[section]);
      setState((current) => ({
        ...current,
        phase: {
          ...current.phase,
          [section]: current[section] ? "updating" : onlineNow() ? "loading" : "offline",
        },
      }));
      const controller = new AbortController();
      controllers[section] = controller;
      const fail = () => {
        const offline = !onlineNow();
        mark(section, offline ? "offline" : "error");
        if (!offline && !document.hidden) {
          attempts[section] += 1;
          retryTimers[section] = window.setTimeout(() => {
            void refresh(section);
          }, retryDelayMs(attempts[section]));
        }
      };

      try {
        const fetched = new Date();
        if (section === "calendar") {
          const part = await loadCalendar(fetch, SECTION_TIMEOUT_MS, controller.signal);
          if (stopped || controller.signal.aborted) return;
          if (!part.ok) return fail();
          attempts.calendar = 0;
          if (store) writeHomeSection(store, "calendar", part.data, fetched);
          setState((current) => ({
            ...current,
            osloDate: osloDateKey(fetched),
            calendar: sameSnapshotValue(current.calendar, part.data) ? current.calendar : part.data,
            phase: { ...current.phase, calendar: "ready" },
            updatedAt: { ...current.updatedAt, calendar: fetched.toISOString() },
          }));
          return;
        }
        if (section === "weather") {
          const part = await loadWeather(fetch, SECTION_TIMEOUT_MS, controller.signal);
          if (stopped || controller.signal.aborted) return;
          if (!part.ok) return fail();
          attempts.weather = 0;
          if (store) writeHomeSection(store, "weather", part.data, fetched);
          setState((current) => ({
            ...current,
            osloDate: osloDateKey(fetched),
            weather: sameSnapshotValue(current.weather, part.data) ? current.weather : part.data,
            phase: { ...current.phase, weather: "ready" },
            updatedAt: { ...current.updatedAt, weather: fetched.toISOString() },
          }));
          return;
        }
        if (section === "departures") {
          const part = await loadDepartures(fetch, SECTION_TIMEOUT_MS, controller.signal);
          if (stopped || controller.signal.aborted) return;
          if (!part.ok) return fail();
          attempts.departures = 0;
          if (store) writeHomeSection(store, "departures", part.data, fetched);
          setState((current) => ({
            ...current,
            osloDate: osloDateKey(fetched),
            departures: sameSnapshotValue(current.departures, part.data) ? current.departures : part.data,
            phase: { ...current.phase, departures: "ready" },
            updatedAt: { ...current.updatedAt, departures: fetched.toISOString() },
          }));
          return;
        }
        const part = await loadDinner(fetch, SECTION_TIMEOUT_MS, controller.signal, fetched);
        if (stopped || controller.signal.aborted) return;
        if (!part.ok) return fail();
        attempts.dinner = 0;
        const next = dinnerValue(part.data, dinnerRef.current);
        dinnerRef.current = next.dinner;
        setState((current) => ({
          ...current,
          osloDate: osloDateKey(fetched),
          dinner: sameSnapshotValue(current.dinner, next.dinner) ? current.dinner : next.dinner,
          phase: { ...current.phase, dinner: next.confirmed ? "ready" : "error" },
          updatedAt: {
            ...current.updatedAt,
            dinner: next.confirmed ? fetched.toISOString() : current.updatedAt.dinner,
          },
        }));
        if (store && next.confirmed) writeHomeSection(store, "dinner", next.dinner, fetched);
      } finally {
        if (controllers[section] === controller) controllers[section] = null;
        inflight[section] = false;
      }
    };

    const refreshAll = (force: boolean) => {
      const sections = sectionsToRefresh({ reason: force ? "midnight" : "resume", hidden: document.hidden });
      if (sections.length === 0) return;
      if (!force && Date.now() - lastAll < RESUME_GAP_MS) return;
      lastAll = Date.now();
      dropIfNewDay();
      for (const section of sections) void refresh(section);
    };

    const clearTimers = () => {
      window.clearInterval(calendarTimer);
      window.clearInterval(dinnerTimer);
      window.clearInterval(weatherTimer);
      window.clearInterval(departuresTimer);
      window.clearTimeout(midnightTimer);
      window.clearTimeout(retryTimers.calendar);
      window.clearTimeout(retryTimers.weather);
      window.clearTimeout(retryTimers.dinner);
      window.clearTimeout(retryTimers.departures);
    };

    const arm = () => {
      clearTimers();
      if (document.hidden) return;
      calendarTimer = window.setInterval(() => {
        if (sectionsToRefresh({ reason: "interval", section: "calendar", hidden: document.hidden }).length === 0) return;
        void refresh("calendar");
      }, SECTION_REFRESH_MS.calendar);
      dinnerTimer = window.setInterval(() => {
        if (sectionsToRefresh({ reason: "interval", section: "dinner", hidden: document.hidden }).length === 0) return;
        void refresh("dinner");
      }, SECTION_REFRESH_MS.dinner);
      weatherTimer = window.setInterval(() => {
        if (sectionsToRefresh({ reason: "interval", section: "weather", hidden: document.hidden }).length === 0) return;
        void refresh("weather");
      }, SECTION_REFRESH_MS.weather);
      departuresTimer = window.setInterval(() => {
        if (sectionsToRefresh({ reason: "interval", section: "departures", hidden: document.hidden }).length === 0) return;
        void refresh("departures");
      }, SECTION_REFRESH_MS.departures);
      midnightTimer = window.setTimeout(() => {
        dropIfNewDay();
        refreshAll(true);
        arm();
      }, Math.max(1000, msUntilOsloMidnight(new Date()) + 250));
    };

    const onResume = () => {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => refreshAll(false), 200);
    };

    const onVisibility = () => {
      if (document.hidden) {
        lastAll = 0;
        clearTimers();
        for (const section of HOME_SECTIONS) controllers[section]?.abort();
        return;
      }
      if (store) {
        const cached = fromStore(store, new Date());
        dinnerRef.current = cached.dinner;
        setState(cached);
      }
      arm();
      onResume();
    };

    refreshAll(true);
    arm();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onResume);
    window.addEventListener("online", onResume);
    window.addEventListener("pageshow", onResume);

    return () => {
      stopped = true;
      clearTimers();
      window.clearTimeout(resumeTimer);
      for (const section of HOME_SECTIONS) controllers[section]?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("online", onResume);
      window.removeEventListener("pageshow", onResume);
    };
  }, []);

  return state;
}
