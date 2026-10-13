"use client";

import { useEffect, useRef, useState } from "react";
import { DinnerEditor, type DinnerDraft } from "@/components/middag/DinnerEditor";
import { MiddagBoard } from "@/components/middag/MiddagBoard";
import { MiddagMobile } from "@/components/middag/MiddagMobile";
import { HallwayPage } from "@/components/shell/HallwayPage";
import type { DinnerMenu, GroceryAisle, MenuDay } from "@/data/types";
import { addIsoDays } from "@/lib/calendar-view";
import type { HallwayData } from "@/lib/hallway";
import { dinnerBody, writeJson, writeJsonResult } from "@/lib/persist-client";

const SAVE_ERROR = "Fikk ikke lagret middagen. Prøv igjen.";
const WEEK_PLAN_ERROR = "Fikk ikke laget forslag. Prøv igjen.";
const DAY_PLAN_ERROR = "Fikk ikke byttet dagen. Prøv igjen.";

function cloneDays(days: MenuDay[]): MenuDay[] {
  return days.map((day) => ({
    ...day,
    meal: day.meal
      ? { ...day.meal, ingredients: day.meal.ingredients.map((item) => ({ ...item })) }
      : null,
  }));
}

function cloneAisles(aisles: GroceryAisle[]): GroceryAisle[] {
  return aisles.map((aisle) => ({
    ...aisle,
    items: aisle.items.map((item) => ({ ...item })),
  }));
}

function isMenuDays(value: unknown): value is MenuDay[] {
  return Array.isArray(value) && value.length === 7;
}

function isAisles(value: unknown): value is GroceryAisle[] {
  return Array.isArray(value);
}

export function MiddagScreen({
  menu,
  week: initialWeek,
  menuPersisted,
  shoppingPersisted,
  ...hallway
}: HallwayData & {
  menu: DinnerMenu;
  week: string;
  menuPersisted: boolean;
  shoppingPersisted: boolean;
}) {
  const [weekQuery, setWeekQuery] = useState<string | null>(null);
  const requestedWeek = useRef<string | null>(null);
  const [week, setWeek] = useState(initialWeek);
  const [period, setPeriod] = useState(menu.period);
  const [days, setDays] = useState(() => cloneDays(menu.days));
  const [aisles, setAisles] = useState(() => cloneAisles(menu.aisles));
  const [editor, setEditor] = useState<DinnerDraft | null>(null);
  const weekRef = useRef(week);
  const daysRef = useRef(days);
  const editorRef = useRef(editor);
  const savedDays = useRef(cloneDays(menu.days));
  const planLock = useRef(false);
  const [planBusy, setPlanBusy] = useState<string | null>(null);
  const [planWeekError, setPlanWeekError] = useState<string | null>(null);
  const [planDayError, setPlanDayError] = useState<string | null>(null);
  weekRef.current = week;
  daysRef.current = days;
  editorRef.current = editor;

  useEffect(() => {
    if (!menuPersisted || weekQuery === null) return;
    const requested = weekQuery;
    let cancelled = false;
    void (async () => {
      try {
        const [dinnerResponse, shoppingResponse] = await Promise.all([
          fetch(`/api/dinner?week=${encodeURIComponent(requested)}`),
          fetch(`/api/shopping?week=${encodeURIComponent(requested)}`),
        ]);
        if (!dinnerResponse.ok || !shoppingResponse.ok) return;
        const dinner = (await dinnerResponse.json()) as {
          persisted?: boolean;
          week?: string;
          period?: string;
          days?: unknown;
        };
        const shopping = (await shoppingResponse.json()) as {
          persisted?: boolean;
          week?: string;
          aisles?: unknown;
        };
        if (cancelled || requestedWeek.current !== requested) return;
        if (dinner.persisted !== true || dinner.week !== requested || !isMenuDays(dinner.days) || !dinner.period) return;
        if (shopping.persisted !== true || shopping.week !== requested || !isAisles(shopping.aisles)) return;
        const nextDays = cloneDays(dinner.days);
        setWeek(requested);
        setPeriod(dinner.period);
        setDays(nextDays);
        setAisles(cloneAisles(shopping.aisles));
        savedDays.current = nextDays;
        setEditor(null);
      } catch {
        // Keep the week already on screen.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [menuPersisted, weekQuery]);

  function onShift(startsOn: string, deltaWeeks: number) {
    if (!menuPersisted) return;
    const base = requestedWeek.current ?? startsOn;
    const next = addIsoDays(base, deltaWeeks * 7);
    requestedWeek.current = next;
    setWeekQuery(next);
    setEditor(null);
    setPlanWeekError(null);
    setPlanDayError(null);
  }

  function openDay(dayId: string) {
    const day = daysRef.current.find((entry) => entry.id === dayId);
    if (!day) return;
    if (day.meal) {
      setEditor({
        dayId,
        mealId: day.meal.id,
        title: day.meal.title,
        minutes: String(day.meal.minutes),
        ingredients: day.meal.ingredients.map((item) => ({ ...item })),
        saving: false,
        error: null,
      });
      return;
    }
    setEditor({
      dayId,
      mealId: null,
      title: "",
      minutes: "30",
      ingredients: [],
      saving: false,
      error: null,
    });
  }

  function closeEditor() {
    setEditor(null);
  }

  function previewDays(next: MenuDay[]) {
    setDays(next);
  }

  function commitDays(next: MenuDay[]) {
    const at = weekRef.current;
    if (requestedWeek.current !== null && requestedWeek.current !== at) return;
    setDays(next);
    if (!menuPersisted) {
      savedDays.current = cloneDays(next);
      return;
    }
    const snapshot = cloneDays(next);
    void writeJson("/api/dinner", "PATCH", dinnerBody(at, snapshot)).then((ok) => {
      if (weekRef.current !== at) return;
      if (requestedWeek.current !== null && requestedWeek.current !== at) return;
      if (ok) {
        savedDays.current = snapshot;
        return;
      }
      setDays(cloneDays(savedDays.current));
    });
  }

  function toggleItem(id: string) {
    const at = weekRef.current;
    const item = aisles.flatMap((aisle) => aisle.items).find((entry) => entry.id === id);
    if (!item) return;
    const done = !item.done;
    setAisles((current) =>
      current.map((aisle) => ({
        ...aisle,
        items: aisle.items.map((entry) => (entry.id === id ? { ...entry, done } : entry)),
      })),
    );
    if (!shoppingPersisted) return;
    void writeJson("/api/shopping", "PATCH", { id, done }).then((ok) => {
      if (weekRef.current !== at) return;
      if (ok) return;
      setAisles((current) =>
        current.map((aisle) => ({
          ...aisle,
          items: aisle.items.map((entry) => (entry.id === id && entry.done === done ? { ...entry, done: !done } : entry)),
        })),
      );
    });
  }

  function addItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const at = weekRef.current;
    const aisleId = aisles[aisles.length - 1]?.id;
    if (!aisleId) return;
    const item = { id: crypto.randomUUID(), name: trimmed, quantity: "1 stk" };
    setAisles((current) => {
      const next = cloneAisles(current);
      next[next.length - 1]?.items.push(item);
      return next;
    });
    if (!shoppingPersisted) return;
    void writeJson("/api/shopping", "POST", { ...item, aisleId, week: at }).then((ok) => {
      if (weekRef.current !== at) return;
      if (ok) return;
      setAisles((current) =>
        current.map((aisle) => ({
          ...aisle,
          items: aisle.items.filter((entry) => entry.id !== item.id),
        })),
      );
    });
  }

  async function saveEditor() {
    const current = editorRef.current;
    if (!current || current.saving) return;
    const title = current.title.trim();
    const minutes = Number(current.minutes);
    const ingredients = current.ingredients.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      amount: item.amount.trim(),
    }));
    if (
      !title ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 600 ||
      ingredients.some((item) => !item.name || !item.amount)
    ) {
      setEditor({ ...current, error: SAVE_ERROR });
      return;
    }
    const at = weekRef.current;
    const mealId = current.mealId ?? crypto.randomUUID();
    const meal = { id: mealId, title, minutes, ingredients };
    if (!menuPersisted) {
      const next = daysRef.current.map((day) => (day.id === current.dayId ? { ...day, meal } : day));
      setDays(next);
      savedDays.current = cloneDays(next);
      setEditor(null);
      return;
    }
    setEditor({ ...current, saving: true, error: null });
    const saved = await writeJsonResult("/api/dinner/day", "PUT", {
      week: at,
      dayId: current.dayId,
      meal: { id: mealId, title, minutes },
      ingredients,
    });
    if (requestedWeek.current !== null && requestedWeek.current !== at) return;
    if (weekRef.current !== at) return;
    if (!saved?.persisted) {
      setEditor((latest) =>
        latest && latest.dayId === current.dayId ? { ...latest, saving: false, error: SAVE_ERROR } : latest,
      );
      return;
    }
    if (saved.week === at && isMenuDays(saved.days)) {
      const nextDays = cloneDays(saved.days);
      setDays(nextDays);
      savedDays.current = nextDays;
    } else {
      const next = daysRef.current.map((day) => (day.id === current.dayId ? { ...day, meal } : day));
      setDays(next);
      savedDays.current = cloneDays(next);
    }
    if (saved.week === at && isAisles(saved.aisles)) setAisles(cloneAisles(saved.aisles));
    setEditor(null);
  }

  async function runPlan(body: { scope: "week" } | { scope: "day"; week: string; dayId: string }) {
    if (!menuPersisted || planLock.current) return;
    const at = weekRef.current;
    planLock.current = true;
    setPlanBusy(body.scope === "week" ? "week" : body.dayId);
    setPlanWeekError(null);
    setPlanDayError(null);
    try {
      const saved = await writeJsonResult("/api/dinner/plan", "POST", body);
      const stillHere = (requestedWeek.current === null || requestedWeek.current === at) && weekRef.current === at;
      if (!saved?.persisted) {
        if (!stillHere) return;
        if (body.scope === "week") setPlanWeekError(WEEK_PLAN_ERROR);
        else setPlanDayError(DAY_PLAN_ERROR);
        return;
      }
      if (!stillHere || saved.week !== at) return;
      if (isMenuDays(saved.days)) {
        const nextDays = cloneDays(saved.days);
        setDays(nextDays);
        savedDays.current = nextDays;
      }
      if (isAisles(saved.aisles)) setAisles(cloneAisles(saved.aisles));
      setEditor(null);
    } finally {
      planLock.current = false;
      setPlanBusy(null);
    }
  }

  function planWeek() {
    void runPlan({ scope: "week" });
  }

  function planDay(dayId: string) {
    void runPlan({ scope: "day", week: weekRef.current, dayId });
  }

  const editorDay = editor ? days.find((day) => day.id === editor.dayId) : null;
  const shared = {
    snapshot: hallway.snapshot,
    week,
    period,
    days,
    aisles,
    menuPersisted,
    shoppingPersisted,
    planBusy,
    planWeekError,
    planDayError,
    onShift,
    onOpenDay: openDay,
    onPreviewDays: previewDays,
    onCommitDays: commitDays,
    onToggleItem: toggleItem,
    onAddItem: addItem,
    onPlanWeek: planWeek,
    onPlanDay: planDay,
  };

  return (
    <HallwayPage
      {...hallway}
      mobile={(clock, weather) => (
        <MiddagMobile
          clock={clock}
          weather={weather}
          {...shared}
          editor={editor ? <DinnerEditor variant="sheet" draft={editor} weekday={editorDay?.weekday ?? ""} onChange={setEditor} onClose={closeEditor} onSave={() => void saveEditor()} /> : null}
        />
      )}
    >
      {(clock) => (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%", minWidth: 0, overflow: "auto" }}>
          <MiddagBoard clock={clock} {...shared} />
          {editor ? (
            <DinnerEditor
              variant="dialog"
              draft={editor}
              weekday={editorDay?.weekday ?? ""}
              onChange={setEditor}
              onClose={closeEditor}
              onSave={() => void saveEditor()}
            />
          ) : null}
        </div>
      )}
    </HallwayPage>
  );
}
