"use client";

import { useEffect, useRef, useState } from "react";
import { Check, GripVertical, Move, Pencil, Plus, RefreshCw, Timer } from "lucide-react";
import { WeekButtons, dayIsToday } from "@/components/middag/DinnerEditor";
import { stagedDrag } from "@/data/middag";
import type { GroceryAisle, Meal, MenuDay } from "@/data/types";
import { isoWeekNumber, type OsloNow } from "@/lib/oslo";

const STAGED_LEFT = 206;
const STAGED_TOP = 182;
const FLOAT_WIDTH = 548;

type Lift = {
  meal: Meal;
  fromDayId: string;
  targetDayId: string | null;
  live: boolean;
  left: number;
  top: number;
};

function cloneDays(days: MenuDay[]): MenuDay[] {
  return days.map((day) => ({
    ...day,
    meal: day.meal
      ? { ...day.meal, ingredients: day.meal.ingredients.map((item) => ({ ...item })) }
      : null,
  }));
}

export function MiddagBoard({
  clock,
  week,
  period,
  days,
  aisles,
  menuPersisted,
  onShift,
  onOpenDay,
  onPreviewDays,
  onCommitDays,
  onToggleItem,
  onAddItem,
}: {
  clock: OsloNow;
  week: string;
  period: string;
  days: MenuDay[];
  aisles: GroceryAisle[];
  menuPersisted: boolean;
  onShift: (startsOn: string, deltaWeeks: number) => void;
  onOpenDay: (dayId: string) => void;
  onPreviewDays: (days: MenuDay[]) => void;
  onCommitDays: (days: MenuDay[]) => void;
  onToggleItem: (id: string) => void;
  onAddItem: (name: string) => void;
}) {
  const [lift, setLift] = useState<Lift | null>(() =>
    menuPersisted
      ? null
      : {
          meal: { ...stagedDrag.meal, ingredients: stagedDrag.meal.ingredients.map((item) => ({ ...item })) },
          fromDayId: stagedDrag.fromDayId,
          targetDayId: stagedDrag.targetDayId,
          live: false,
          left: STAGED_LEFT,
          top: STAGED_TOP,
        },
  );
  const [adding, setAdding] = useState(false);
  const [draftItem, setDraftItem] = useState("");
  const daysRef = useRef<HTMLDivElement>(null);
  const daysState = useRef(days);
  const liftState = useRef(lift);
  const dragToken = useRef(0);
  const tokenAtStart = useRef(0);
  const seenWeek = useRef(week);
  daysState.current = days;
  liftState.current = lift;

  useEffect(() => {
    if (seenWeek.current === week) return;
    seenWeek.current = week;
    dragToken.current += 1;
    liftState.current = null;
    setLift(null);
  }, [week]);

  const [year, month, day] = week.split("-").map(Number);
  const weekNumber = isoWeekNumber(year, month, day);
  const itemCount = aisles.reduce((sum, aisle) => sum + aisle.items.length, 0);

  function finishDrag() {
    const drag = liftState.current;
    if (!drag?.live || tokenAtStart.current !== dragToken.current) {
      liftState.current = null;
      setLift(null);
      return;
    }
    const next = cloneDays(daysState.current);
    const from = next.find((entry) => entry.id === drag.fromDayId);
    const targetId = drag.targetDayId;
    if (from && targetId && targetId !== drag.fromDayId) {
      const target = next.find((entry) => entry.id === targetId);
      if (target) {
        const displaced = target.meal;
        target.meal = drag.meal;
        from.meal = displaced;
      }
    } else if (from) {
      from.meal = drag.meal;
    }
    daysState.current = next;
    liftState.current = null;
    setLift(null);
    onCommitDays(next);
  }

  function trackDrag(event: PointerEvent) {
    const drag = liftState.current;
    const root = daysRef.current;
    if (!drag || !root) return;
    const rect = root.getBoundingClientRect();
    const left = event.clientX - rect.left - FLOAT_WIDTH / 2;
    const top = event.clientY - rect.top - 36;
    const floater = root.querySelector("[data-lift]") as HTMLElement | null;
    if (floater) floater.style.pointerEvents = "none";
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (floater) floater.style.pointerEvents = "";
    const targetDayId = hit?.closest("[data-day]")?.getAttribute("data-day") ?? null;
    const next = { ...drag, live: true, left, top, targetDayId };
    liftState.current = next;
    setLift(next);
  }

  function attachDrag(event: PointerEvent) {
    const move = (pointer: PointerEvent) => trackDrag(pointer);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      finishDrag();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    trackDrag(event);
  }

  function liftFromDay(event: React.PointerEvent, dayId: string) {
    event.preventDefault();
    tokenAtStart.current = dragToken.current;
    const nextDays = cloneDays(daysState.current);
    const currentLift = liftState.current;
    if (currentLift) {
      const from = nextDays.find((entry) => entry.id === currentLift.fromDayId);
      if (from && !from.meal) from.meal = currentLift.meal;
    }
    const day = nextDays.find((entry) => entry.id === dayId);
    if (!day?.meal) return;
    const meal = day.meal;
    day.meal = null;
    const nextLift: Lift = { meal, fromDayId: dayId, targetDayId: null, live: true, left: 0, top: 0 };
    daysState.current = nextDays;
    liftState.current = nextLift;
    onPreviewDays(nextDays);
    setLift(nextLift);
    attachDrag(event.nativeEvent);
  }

  function liftExisting(event: React.PointerEvent) {
    event.preventDefault();
    if (!liftState.current) return;
    tokenAtStart.current = dragToken.current;
    attachDrag(event.nativeEvent);
  }

  function saveItem() {
    const name = draftItem.trim();
    setAdding(false);
    setDraftItem("");
    if (!name) return;
    onAddItem(name);
  }

  return (
    <div data-region="middag" data-week={week} style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "row", gap: 20 }}>
      <section
        data-region="menu"
        style={{
          width: 820,
          flexShrink: 0,
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          background: "var(--tile)",
          borderRadius: "var(--r-tile)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14, width: "100%" }}>
          <h1 style={titleStyle}>Ukemeny</h1>
          <div style={periodStyle}>
            Uke {weekNumber} · {period}
          </div>
          <WeekButtons enabled={menuPersisted} onPrevious={() => onShift(week, -1)} onNext={() => onShift(week, 1)} />
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              padding: "7px 13px",
              borderRadius: "var(--r-full)",
              background: "var(--tile-2)",
              color: "var(--text-muted)",
            }}
          >
            <GripVertical size={15} color="var(--text-muted)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: "normal", fontWeight: 400, color: "var(--text-2)", whiteSpace: "nowrap" }}>
              Dra for å bytte dag
            </span>
          </div>
        </div>
        <div ref={daysRef} style={{ position: "relative", flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map((day, index) => {
            const today = dayIsToday(clock, week, index);
            const source = lift?.fromDayId === day.id;
            const target = lift?.targetDayId === day.id;
            return (
              <div key={day.id} data-day={day.id} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", alignItems: "center", gap: 12, width: "100%" }}>
                <div style={{ width: 92, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, padding: "0 2px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, lineHeight: "normal", fontWeight: 400, color: today ? "var(--accent)" : "var(--text)", whiteSpace: "nowrap" }}>
                    {today ? "i dag" : day.weekday}
                  </div>
                  <div style={{ fontFamily: "var(--font-data)", fontSize: 12, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {day.date}
                  </div>
                </div>
                {source || !day.meal ? (
                  lift && source ? (
                    <EmptyDay label={`${lift.meal.title} flyttes herfra`} />
                  ) : (
                    <button type="button" aria-label={`Legg til middag ${day.weekday}`} onClick={() => onOpenDay(day.id)} style={emptyButton}>
                      <Move size={16} color="var(--text-muted)" />
                      <span style={emptyLabel}>Ledig</span>
                    </button>
                  )
                ) : (
                  <MealCard
                    meal={day.meal}
                    target={target}
                    onGrip={(event) => liftFromDay(event, day.id)}
                    onOpen={() => onOpenDay(day.id)}
                  />
                )}
              </div>
            );
          })}
          {lift ? (
            <article
              data-lift="true"
              onPointerDown={liftExisting}
              style={{
                position: "absolute",
                left: lift.left,
                top: lift.top,
                width: FLOAT_WIDTH,
                height: lift.live ? undefined : 78,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--r-nested)",
                background: "color-mix(in srgb, var(--tile-2) 97%, white 3%)",
                outline: "1.5px solid var(--accent)",
                outlineOffset: -0.75,
                boxShadow: "0 10px 24px color-mix(in srgb, black 45%, transparent)",
                opacity: 0.97,
                zIndex: 7,
                cursor: "grabbing",
              }}
            >
              <GripVertical size={18} color="var(--accent)" />
              <MealBody meal={lift.meal} />
            </article>
          ) : null}
        </div>
      </section>
      <section
        data-region="shopping"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 24,
          background: "var(--tile)",
          borderRadius: "var(--r-tile)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h2 style={titleStyle}>Handleliste</h2>
          <div style={{ padding: "6px 12px", borderRadius: "var(--r-full)", background: "var(--tile-2)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: "normal", fontWeight: 400, color: "var(--text-2)", whiteSpace: "nowrap" }}>
            {itemCount} varer
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 7, color: "var(--text-muted)" }}>
          <RefreshCw size={13} color="var(--text-muted)" />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Oppdateres fra ukemenyen
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
          {aisles.map((aisle) => (
            <div key={aisle.id} style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: "normal", fontWeight: 400, letterSpacing: "1.4px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {aisle.label}
              </div>
              {aisle.items.map((item) => (
                <div key={item.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 11, padding: "3px 0", width: "100%" }}>
                  <button
                    type="button"
                    aria-pressed={Boolean(item.done)}
                    aria-label={item.done ? `Merk ${item.name} som ikke kjøpt` : `Kjøp ${item.name}`}
                    onClick={() => onToggleItem(item.id)}
                    style={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: item.done ? "var(--ok)" : "transparent",
                      outline: item.done ? "none" : "1.5px solid var(--text-muted)",
                      outlineOffset: item.done ? undefined : -0.75,
                    }}
                  >
                    {item.done ? <Check size={13} color="var(--ink)" strokeWidth={2.5} /> : null}
                  </button>
                  <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-body)", fontSize: 14, lineHeight: "normal", fontWeight: 400, color: item.done ? "var(--text-muted)" : "var(--text)" }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-data)", fontSize: 12, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {adding ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveItem();
            }}
            style={{ width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--r-nested)", background: "var(--tile-2)", outline: "1.5px solid var(--accent)", outlineOffset: -0.75 }}
          >
            <input
              aria-label="Ny vare"
              autoFocus
              value={draftItem}
              onChange={(event) => setDraftItem(event.target.value)}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: "normal" }}
            />
            <button type="button" onClick={() => { setAdding(false); setDraftItem(""); }} style={ghostPill}>
              Avbryt
            </button>
            <button type="submit" style={savePill}>
              Lagre
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} style={addButton}>
            <Plus size={18} color="var(--text-muted)" />
            Legg til vare
          </button>
        )}
      </section>
    </div>
  );
}

function EmptyDay({ label }: { label: string }) {
  return (
    <div style={emptyButton}>
      <Move size={16} color="var(--text-muted)" />
      <span style={emptyLabel}>{label}</span>
    </div>
  );
}

function MealCard({
  meal,
  target,
  onGrip,
  onOpen,
}: {
  meal: Meal;
  target: boolean;
  onGrip: (event: React.PointerEvent) => void;
  onOpen: () => void;
}) {
  return (
    <article
      data-meal={meal.id}
      data-target={target ? "true" : undefined}
      style={{
        flex: 1,
        height: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-2)",
        outline: target ? "1.5px solid var(--accent)" : "none",
        outlineOffset: target ? -0.75 : undefined,
      }}
    >
      <button type="button" aria-label={`Flytt ${meal.title}`} onPointerDown={onGrip} style={gripButton}>
        <GripVertical size={18} color={target ? "var(--accent)" : "var(--text-muted)"} />
      </button>
      <button type="button" aria-label={`Ingredienser for ${meal.title}`} onClick={onOpen} style={cardButton}>
        <MealBody meal={meal} />
      </button>
      <button type="button" aria-label={`Rediger ${meal.title}`} onClick={onOpen} style={{ ...gripButton, cursor: "pointer" }}>
        <Pencil size={16} color="var(--text-muted)" />
      </button>
    </article>
  );
}

function MealBody({ meal }: { meal: Meal }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7, textAlign: "left" }}>
      <div style={dishStyle}>{meal.title}</div>
      <span style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5, color: "var(--text-muted)" }}>
        <Timer size={13} color="var(--text-muted)" />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {meal.minutes} min
        </span>
      </span>
    </div>
  );
}

const titleStyle = {
  margin: 0,
  fontFamily: "var(--font-heading)",
  fontSize: 24,
  lineHeight: "normal",
  fontWeight: 400,
  color: "var(--text)",
  whiteSpace: "nowrap" as const,
};

const periodStyle = {
  fontFamily: "var(--font-data)",
  fontSize: 15,
  lineHeight: "normal",
  fontWeight: 400,
  color: "var(--text-muted)",
  whiteSpace: "nowrap" as const,
};

const dishStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: 18,
  lineHeight: "normal",
  fontWeight: 400,
  color: "var(--text)",
  whiteSpace: "nowrap" as const,
};

const emptyLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: "normal",
  fontWeight: 400,
  color: "var(--text-muted)",
  whiteSpace: "nowrap" as const,
};

const emptyButton = {
  flex: 1,
  height: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "none",
  borderRadius: "var(--r-nested)",
  background: "transparent",
  cursor: "pointer",
  outline: "1.5px solid color-mix(in srgb, var(--text) 14%, transparent)",
  outlineOffset: -0.75,
  color: "var(--text-muted)",
};

const gripButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "grab",
  flexShrink: 0,
  color: "var(--text-muted)",
};

const cardButton = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "inherit",
};

const pillBase = {
  padding: "8px 14px",
  border: "none",
  borderRadius: "var(--r-full)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: "normal",
  fontWeight: 400,
  whiteSpace: "nowrap" as const,
};

const ghostPill = { ...pillBase, background: "var(--tile-3)", color: "var(--text-2)" };
const savePill = { ...pillBase, background: "var(--accent)", color: "var(--ink)" };

const addButton = {
  width: "100%",
  height: 46,
  flexShrink: 0,
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  outline: "1.5px solid color-mix(in srgb, var(--text) 14%, transparent)",
  outlineOffset: -0.75,
  borderRadius: "var(--r-nested)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: "normal",
  fontWeight: 400,
  color: "var(--text-muted)",
};
