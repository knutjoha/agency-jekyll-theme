"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Check, ChevronRight, GripVertical, Move, Pencil, Plus, RefreshCw, ShoppingBasket } from "lucide-react";
import { WeekButtons, dayIsToday } from "@/components/middag/DinnerEditor";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import { stagedDrag } from "@/data/middag";
import type { GroceryAisle, Meal, MenuDay, WeatherView } from "@/data/types";
import { isoWeekNumber, type OsloNow } from "@/lib/oslo";

const STAGED_LEFT = 40;
const STAGED_TOP = 118;
const FLOAT_WIDTH = 300;

type View = "meny" | "liste";

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

function detailFor(meal: Meal): string {
  return `${meal.minutes} min`;
}

function dayName(day: MenuDay, today: boolean): string {
  return today ? "i dag" : day.weekday.slice(0, 3);
}

export function MiddagMobile({
  clock,
  weather,
  snapshot = false,
  week,
  period,
  days,
  aisles,
  menuPersisted,
  planBusy,
  planWeekError,
  planDayError,
  onShift,
  onOpenDay,
  onPreviewDays,
  onCommitDays,
  onToggleItem,
  onAddItem,
  onPlanWeek,
  onPlanDay,
  editor,
}: {
  clock: OsloNow;
  weather: WeatherView;
  snapshot?: boolean;
  week: string;
  period: string;
  days: MenuDay[];
  aisles: GroceryAisle[];
  menuPersisted: boolean;
  planBusy: string | null;
  planWeekError: string | null;
  planDayError: string | null;
  onShift: (startsOn: string, deltaWeeks: number) => void;
  onOpenDay: (dayId: string) => void;
  onPreviewDays: (days: MenuDay[]) => void;
  onCommitDays: (days: MenuDay[]) => void;
  onToggleItem: (id: string) => void;
  onAddItem: (name: string) => void;
  onPlanWeek: () => void;
  onPlanDay: (dayId: string) => void;
  editor: ReactNode;
}) {
  const [view, setView] = useState<View>("meny");
  const [lift, setLift] = useState<Lift | null>(() =>
    snapshot && !menuPersisted
      ? {
          meal: { ...stagedDrag.meal, ingredients: stagedDrag.meal.ingredients.map((item) => ({ ...item })) },
          fromDayId: stagedDrag.fromDayId,
          targetDayId: stagedDrag.targetDayId,
          live: false,
          left: STAGED_LEFT,
          top: STAGED_TOP,
        }
      : null,
  );
  const [adding, setAdding] = useState(false);
  const [draftItem, setDraftItem] = useState("");
  const daysRef = useRef<HTMLDivElement>(null);
  const daysState = useRef(days);
  const liftState = useRef(lift);
  const dragToken = useRef(0);
  const tokenAtStart = useRef(0);
  const dragActive = useRef(false);
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

  const [year, month, dayOfMonth] = week.split("-").map(Number);
  const weekNumber = isoWeekNumber(year, month, dayOfMonth);
  const items = aisles.flatMap((aisle) => aisle.items);
  const bought = items.filter((item) => item.done).length;

  function finishDrag() {
    const drag = liftState.current;
    if (!drag?.live || tokenAtStart.current !== dragToken.current) {
      liftState.current = null;
      setLift(null);
      window.setTimeout(() => {
        dragActive.current = false;
      }, 0);
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
    window.setTimeout(() => {
      dragActive.current = false;
    }, 0);
    onCommitDays(next);
  }

  function trackDrag(event: PointerEvent) {
    const drag = liftState.current;
    const root = daysRef.current;
    if (!drag || !root) return;
    const rect = root.getBoundingClientRect();
    const left = event.clientX - rect.left - FLOAT_WIDTH / 2;
    const top = event.clientY - rect.top - 26;
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

  function liftFromDay(event: ReactPointerEvent, dayId: string) {
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
    dragActive.current = true;
    const meal = day.meal;
    day.meal = null;
    const nextLift: Lift = { meal, fromDayId: dayId, targetDayId: null, live: true, left: 0, top: 0 };
    daysState.current = nextDays;
    liftState.current = nextLift;
    onPreviewDays(nextDays);
    setLift(nextLift);
    attachDrag(event.nativeEvent);
  }

  function liftExisting(event: ReactPointerEvent) {
    event.preventDefault();
    if (!liftState.current) return;
    dragActive.current = true;
    tokenAtStart.current = dragToken.current;
    attachDrag(event.nativeEvent);
  }

  function requestWeek() {
    if (dragActive.current || liftState.current) return;
    onPlanWeek();
  }

  function requestDay(dayId: string) {
    if (dragActive.current || liftState.current) return;
    onPlanDay(dayId);
  }

  function saveItem() {
    const name = draftItem.trim();
    setAdding(false);
    setDraftItem("");
    if (!name) return;
    onAddItem(name);
  }

  return (
    <div data-region="middag-mobile" data-view={view} data-week={week} style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 12px", boxSizing: "border-box" }}>
      <PhoneHeader clock={clock} weather={weather} />
      <ViewSwitch view={view} onChange={setView} />
      {view === "meny" || editor ? (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-data)", fontSize: 13, lineHeight: 1.2, fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Uke {weekNumber} · {period}
          </div>
          <WeekButtons enabled={menuPersisted} onPrevious={() => onShift(week, -1)} onNext={() => onShift(week, 1)} />
        </div>
      ) : null}
      {menuPersisted && view === "meny" && !editor ? (
        <>
          <button
            type="button"
            data-plan="week"
            disabled={planBusy !== null}
            onClick={requestWeek}
            style={{ ...suggestButton, opacity: planBusy !== null ? 0.6 : 1, cursor: planBusy !== null ? "default" : "pointer" }}
          >
            {planBusy === "week" ? "Lager forslag…" : "Lag et forslag"}
          </button>
          {planWeekError ? <div role="alert" style={planErrorStyle}>{planWeekError}</div> : null}
          {planDayError ? <div role="alert" style={planErrorStyle}>{planDayError}</div> : null}
        </>
      ) : null}
      {editor ? (
        editor
      ) : view === "meny" ? (
        <>
          <div ref={daysRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 7 }}>
            {days.map((day, index) => {
              const today = dayIsToday(clock, week, index);
              const source = lift?.fromDayId === day.id;
              const target = lift?.targetDayId === day.id;
              const empty = source || !day.meal;
              return (
                <div
                  key={day.id}
                  data-day={day.id}
                  data-target={target ? "true" : undefined}
                  data-source={source ? "true" : undefined}
                  style={{
                    height: 55,
                    minHeight: 55,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 10px",
                    borderRadius: "var(--r-nested)",
                    background: empty ? "transparent" : "var(--tile)",
                    outline: target && !empty ? "1.5px solid var(--accent)" : "none",
                    outlineOffset: target && !empty ? -0.75 : undefined,
                  }}
                >
                  {empty || !day.meal ? null : (
                    <Grip label={`Flytt ${day.meal.title}`} color={target ? "var(--accent)" : "var(--text-muted)"} onPointerDown={(event) => liftFromDay(event, day.id)} />
                  )}
                  <DayMark day={day} today={today} />
                  {empty || !day.meal ? (
                    lift && source ? (
                      <DropSlot label={`${lift.meal.title} flyttes herfra`} />
                    ) : (
                      <button type="button" aria-label={`Legg til middag ${day.weekday}`} onClick={() => onOpenDay(day.id)} style={dropButton}>
                        <Move size={14} color="var(--text-muted)" />
                        <span style={dropLabel}>Ledig</span>
                      </button>
                    )
                  ) : (
                    <MealRow
                      meal={day.meal}
                      onOpen={() => onOpenDay(day.id)}
                      refresh={
                        menuPersisted ? (
                          <DayRefresh
                            weekday={day.weekday}
                            busy={planBusy === day.id}
                            disabled={planBusy !== null}
                            onClick={() => requestDay(day.id)}
                          />
                        ) : null
                      }
                    />
                  )}
                  {menuPersisted && empty ? (
                    <DayRefresh
                      weekday={day.weekday}
                      busy={planBusy === day.id}
                      disabled={planBusy !== null}
                      onClick={() => requestDay(day.id)}
                    />
                  ) : null}
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
                  height: 52,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 10px",
                  borderRadius: "var(--r-nested)",
                  background: "#262A30",
                  outline: "1.5px solid var(--accent)",
                  outlineOffset: -0.75,
                  boxShadow: "0 8px 20px #00000080",
                  opacity: 0.97,
                  zIndex: 7,
                  cursor: "grabbing",
                }}
              >
                <GripVertical size={15} color="var(--accent)" />
                <MealCopy meal={lift.meal} />
              </article>
            ) : null}
          </div>
          <button type="button" onClick={() => setView("liste")} style={listLink}>
            <ShoppingBasket size={19} color="var(--text-2)" />
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, lineHeight: 1.1, fontWeight: 400, color: "var(--text)" }}>Handleliste</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.2, fontWeight: 400, color: "var(--text-muted)" }}>
                {items.length} varer · {bought} kjøpt · fra ukemenyen
              </span>
            </span>
            <ChevronRight size={17} color="var(--text-muted)" />
          </button>
        </>
      ) : (
        <ShoppingList
          aisles={aisles}
          adding={adding}
          draftItem={draftItem}
          onToggle={onToggleItem}
          onDraft={setDraftItem}
          onAdd={() => setAdding(true)}
          onCancel={() => {
            setAdding(false);
            setDraftItem("");
          }}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <div style={{ height: 42, boxSizing: "border-box", display: "flex", flexDirection: "row", gap: 4, padding: 4, borderRadius: 10, background: "var(--tile)" }}>
      <SwitchButton label="Ukemeny" pressed={view === "meny"} onClick={() => onChange("meny")} />
      <SwitchButton label="Handleliste" pressed={view === "liste"} onClick={() => onChange("liste")} />
    </div>
  );
}

function SwitchButton({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        border: "none",
        borderRadius: 8,
        background: pressed ? "var(--tile-2)" : "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1,
        fontWeight: 400,
        color: pressed ? "var(--text)" : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

function DayMark({ day, today }: { day: MenuDay; today: boolean }) {
  return (
    <div style={{ width: 44, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, lineHeight: 1.1, fontWeight: 400, color: today ? "var(--accent)" : "var(--text)", whiteSpace: "nowrap" }}>
        {dayName(day, today)}
      </div>
      <div style={{ fontFamily: "var(--font-data)", fontSize: 11, lineHeight: 1.1, fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{day.date}</div>
    </div>
  );
}

function DropSlot({ label }: { label: string }) {
  return (
    <div style={dropButton}>
      <Move size={14} color="var(--text-muted)" />
      <span style={dropLabel}>{label}</span>
    </div>
  );
}

function Grip({ label, color, onPointerDown }: { label: string; color: string; onPointerDown: (event: ReactPointerEvent) => void }) {
  return (
    <button type="button" aria-label={label} onPointerDown={onPointerDown} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, padding: 0, border: "none", background: "transparent", cursor: "grab", flexShrink: 0 }}>
      <GripVertical size={15} color={color} />
    </button>
  );
}

function MealCopy({ meal }: { meal: Meal }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={phoneTitle}>{meal.title}</div>
      <div style={phoneDetail}>{detailFor(meal)}</div>
    </div>
  );
}

function DayRefresh({
  weekday,
  busy,
  disabled,
  onClick,
}: {
  weekday: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-plan="day"
      aria-label={`Nytt forslag for ${weekday}`}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, padding: 0, border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", flexShrink: 0, opacity: disabled && !busy ? 0.45 : 1 }}
    >
      <RefreshCw size={14} color="var(--text-muted)" className={busy ? "dinner-spin" : undefined} />
    </button>
  );
}

function MealRow({ meal, onOpen, refresh }: { meal: Meal; onOpen: () => void; refresh: ReactNode }) {
  return (
    <>
      <button type="button" aria-label={`Ingredienser for ${meal.title}`} onClick={onOpen} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, padding: 0, border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <div style={phoneTitle}>{meal.title}</div>
        <div style={phoneDetail}>{detailFor(meal)}</div>
      </button>
      {refresh}
      <button type="button" aria-label={`Rediger ${meal.title}`} onClick={onOpen} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}>
        <Pencil size={14} color="var(--text-muted)" />
      </button>
    </>
  );
}

function ShoppingList({
  aisles,
  adding,
  draftItem,
  onToggle,
  onDraft,
  onAdd,
  onCancel,
  onSave,
}: {
  aisles: GroceryAisle[];
  adding: boolean;
  draftItem: string;
  onToggle: (id: string) => void;
  onDraft: (value: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {aisles.flatMap((aisle) => aisle.items).map((item) => (
          <div key={item.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 11 }}>
            <button
              type="button"
              aria-pressed={Boolean(item.done)}
              aria-label={item.done ? `Merk ${item.name} som ikke kjøpt` : `Kjøp ${item.name}`}
              onClick={() => onToggle(item.id)}
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
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.2, fontWeight: 400, color: item.done ? "var(--text-muted)" : "var(--text)" }}>{item.name}</div>
            <div style={{ fontFamily: "var(--font-data)", fontSize: 12, lineHeight: 1, fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{item.quantity}</div>
          </div>
        ))}
      </div>
      {adding ? (
        <form onSubmit={(event) => { event.preventDefault(); onSave(); }} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--r-nested)", background: "var(--tile)", outline: "1.5px solid var(--accent)", outlineOffset: -0.75 }}>
          <input aria-label="Ny vare" autoFocus value={draftItem} onChange={(event) => onDraft(event.target.value)} style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14 }} />
          <button type="button" onClick={onCancel} style={ghostPill}>Avbryt</button>
          <button type="submit" style={savePill}>Lagre</button>
        </form>
      ) : (
        <button type="button" onClick={onAdd} style={{ width: "100%", height: 48, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer", outline: "1.5px solid #ffffff24", outlineOffset: -0.75, borderRadius: "var(--r-nested)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>
          <Plus size={17} color="var(--text-muted)" />
          Legg til vare
        </button>
      )}
    </div>
  );
}

const phoneTitle = {
  fontFamily: "var(--font-heading)",
  fontSize: 15,
  lineHeight: 1.1,
  fontWeight: 400,
  color: "var(--text)",
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const phoneDetail = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  lineHeight: 1.1,
  fontWeight: 400,
  color: "var(--text-muted)",
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const dropLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1,
  fontWeight: 400,
  color: "var(--text-muted)",
  whiteSpace: "nowrap" as const,
};

const dropButton = {
  flex: 1,
  minWidth: 0,
  height: 40,
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: "none",
  borderRadius: 10,
  background: "transparent",
  cursor: "pointer",
  outline: "1.5px solid #ffffff24",
  outlineOffset: -0.75,
  color: "var(--text-muted)",
};

const suggestButton = {
  width: "100%",
  height: 44,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--accent)",
  color: "var(--ink)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  lineHeight: "normal",
  fontWeight: 400,
};

const planErrorStyle = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.3,
  color: "var(--accent)",
};

const listLink = {
  width: "100%",
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  gap: 11,
  padding: 13,
  border: "none",
  borderRadius: "var(--r-tile)",
  background: "var(--tile)",
  cursor: "pointer",
  textAlign: "left" as const,
};

const pillBase = {
  padding: "9px 16px",
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
