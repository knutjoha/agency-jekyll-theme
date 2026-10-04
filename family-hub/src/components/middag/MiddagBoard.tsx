"use client";

import { useRef, useState } from "react";
import { Check, GripVertical, Move, Pencil, Plus, RefreshCw, Timer } from "lucide-react";
import { stagedDrag } from "@/data/middag";
import type { DinnerMenu, GroceryAisle, Meal, MenuDay } from "@/data/types";
import { dinnerBody, writeJson } from "@/lib/persist-client";
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
    meal: day.meal ? { ...day.meal, diets: [...day.meal.diets] } : null,
  }));
}

function cloneAisles(aisles: GroceryAisle[]): GroceryAisle[] {
  return aisles.map((aisle) => ({
    ...aisle,
    items: aisle.items.map((item) => ({ ...item })),
  }));
}

export function MiddagBoard({
  clock,
  menu,
  menuPersisted,
  shoppingPersisted,
}: {
  clock: OsloNow;
  menu: DinnerMenu;
  menuPersisted: boolean;
  shoppingPersisted: boolean;
}) {
  const [days, setDays] = useState(() => cloneDays(menu.days));
  const [lift, setLift] = useState<Lift | null>(() =>
    menuPersisted
      ? null
      : {
          meal: { ...stagedDrag.meal, diets: [...stagedDrag.meal.diets] },
          fromDayId: stagedDrag.fromDayId,
          targetDayId: stagedDrag.targetDayId,
          live: false,
          left: STAGED_LEFT,
          top: STAGED_TOP,
        },
  );
  const [aisles, setAisles] = useState(() => cloneAisles(menu.aisles));
  const [adding, setAdding] = useState(false);
  const [draftItem, setDraftItem] = useState("");
  const daysRef = useRef<HTMLDivElement>(null);
  const daysState = useRef(days);
  const liftState = useRef(lift);
  const savedDays = useRef(cloneDays(menu.days));
  const originals = useRef(new Map(menu.days.flatMap((day) => (day.meal ? [[day.meal.id, day.meal.title] as const] : []))));
  daysState.current = days;
  liftState.current = lift;

  const todayKey = clock.numericDate.slice(0, 5);
  const weekNumber = isoWeekNumber(menu.startsOn.year, menu.startsOn.month, menu.startsOn.day);
  const itemCount = aisles.reduce((sum, aisle) => sum + aisle.items.length, 0);

  function updateMeal(id: string, patch: Partial<Meal>) {
    setDays((current) =>
      current.map((day) =>
        day.meal?.id === id ? { ...day, meal: { ...day.meal, ...patch, diets: day.meal.diets } } : day,
      ),
    );
    setLift((current) => (current?.meal.id === id ? { ...current, meal: { ...current.meal, ...patch } } : current));
  }

  function editMeal(id: string) {
    setDays((current) =>
      current.map((day) =>
        day.meal ? { ...day, meal: { ...day.meal, editing: day.meal.id === id } } : day,
      ),
    );
  }

  function cancelEdit(meal: Meal) {
    updateMeal(meal.id, { editing: false, title: originals.current.get(meal.id) ?? meal.title });
  }

  function persistDays(next: MenuDay[]) {
    if (!menuPersisted) return;
    const snapshot = cloneDays(next);
    void writeJson("/api/dinner", "PATCH", dinnerBody(snapshot)).then((ok) => {
      if (ok) {
        savedDays.current = snapshot;
        return;
      }
      const restored = cloneDays(savedDays.current);
      daysState.current = restored;
      setDays(restored);
      setLift(null);
    });
  }

  function saveEdit(meal: Meal) {
    const title = meal.title.trim();
    if (!title) {
      cancelEdit(meal);
      return;
    }
    originals.current.set(meal.id, title);
    const next = days.map((day) =>
      day.meal?.id === meal.id ? { ...day, meal: { ...day.meal, editing: false, title } } : day,
    );
    daysState.current = next;
    setDays(next);
    persistDays(next);
  }

  function finishDrag() {
    const drag = liftState.current;
    if (!drag?.live) return;
    const next = cloneDays(daysState.current);
    const from = next.find((day) => day.id === drag.fromDayId);
    const targetId = drag.targetDayId;
    if (from && targetId && targetId !== drag.fromDayId) {
      const target = next.find((day) => day.id === targetId);
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
    setDays(next);
    setLift(null);
    persistDays(next);
  }

  function trackDrag(event: PointerEvent) {
    const drag = liftState.current;
    const root = daysRef.current;
    if (!drag || !root) return;
    const rect = root.getBoundingClientRect();
    const left = event.clientX - rect.left - FLOAT_WIDTH / 2;
    const top = event.clientY - rect.top - 36;
    const previous = root.style.pointerEvents;
    const floater = root.querySelector("[data-lift]") as HTMLElement | null;
    if (floater) floater.style.pointerEvents = "none";
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (floater) floater.style.pointerEvents = previous;
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
    const nextDays = cloneDays(daysState.current);
    const currentLift = liftState.current;
    if (currentLift) {
      const from = nextDays.find((day) => day.id === currentLift.fromDayId);
      if (from && !from.meal) from.meal = currentLift.meal;
    }
    const day = nextDays.find((entry) => entry.id === dayId);
    if (!day?.meal) return;
    const meal = day.meal;
    day.meal = null;
    const nextLift: Lift = { meal, fromDayId: dayId, targetDayId: null, live: true, left: 0, top: 0 };
    daysState.current = nextDays;
    liftState.current = nextLift;
    setDays(nextDays);
    setLift(nextLift);
    attachDrag(event.nativeEvent);
  }

  function liftExisting(event: React.PointerEvent) {
    event.preventDefault();
    if (!liftState.current) return;
    attachDrag(event.nativeEvent);
  }

  function toggleItem(id: string) {
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
      if (ok) return;
      setAisles((current) =>
        current.map((aisle) => ({
          ...aisle,
          items: aisle.items.map((entry) => (entry.id === id && entry.done === done ? { ...entry, done: !done } : entry)),
        })),
      );
    });
  }

  function saveItem() {
    const name = draftItem.trim();
    if (!name) {
      setAdding(false);
      setDraftItem("");
      return;
    }
    const aisleId = aisles[aisles.length - 1]?.id;
    const item = { id: crypto.randomUUID(), name, quantity: "1 stk" };
    setAisles((current) => {
      const next = cloneAisles(current);
      const aisle = next[next.length - 1];
      aisle?.items.push(item);
      return next;
    });
    setAdding(false);
    setDraftItem("");
    if (!shoppingPersisted || !aisleId) return;
    void writeJson("/api/shopping", "POST", { ...item, aisleId }).then((ok) => {
      if (ok) return;
      setAisles((current) =>
        current.map((aisle) => ({
          ...aisle,
          items: aisle.items.filter((entry) => entry.id !== item.id),
        })),
      );
    });
  }

  return (
    <div
      data-region="middag"
      style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "row", gap: 20 }}
    >
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
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
            <h1 style={titleStyle}>Ukemeny</h1>
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 15,
                lineHeight: "normal",
                fontWeight: 400,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Uke {weekNumber} · {menu.period}
            </div>
          </div>
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
        <div
          ref={daysRef}
          style={{ position: "relative", flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}
        >
          {days.map((day) => {
            const today = day.date === todayKey;
            const source = lift?.fromDayId === day.id;
            const target = lift?.targetDayId === day.id;
            return (
              <div
                key={day.id}
                data-day={day.id}
                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "row", alignItems: "center", gap: 12, width: "100%" }}
              >
                <div style={{ width: 92, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, padding: "0 2px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 16,
                      lineHeight: "normal",
                      fontWeight: 400,
                      color: today ? "var(--accent)" : "var(--text)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {today ? "i dag" : day.weekday}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-data)",
                      fontSize: 12,
                      lineHeight: "normal",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {day.date}
                  </div>
                </div>
                {source || !day.meal ? (
                  <div
                    style={{
                      flex: 1,
                      height: "100%",
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderRadius: "var(--r-nested)",
                      outline: "1.5px solid color-mix(in srgb, var(--text) 14%, transparent)",
                      outlineOffset: -0.75,
                      color: "var(--text-muted)",
                    }}
                  >
                    <Move size={16} color="var(--text-muted)" />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {lift && source ? `${lift.meal.title} flyttes herfra` : "Ledig"}
                    </span>
                  </div>
                ) : (
                  <MealCard
                    meal={day.meal}
                    target={target}
                    onGrip={(event) => liftFromDay(event, day.id)}
                    onEdit={() => editMeal(day.meal!.id)}
                    onTitle={(title) => updateMeal(day.meal!.id, { title })}
                    onCancel={() => cancelEdit(day.meal!)}
                    onSave={() => saveEdit(day.meal!)}
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
          <div
            style={{
              padding: "6px 12px",
              borderRadius: "var(--r-full)",
              background: "var(--tile-2)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: "normal",
              fontWeight: 400,
              color: "var(--text-2)",
              whiteSpace: "nowrap",
            }}
          >
            {itemCount} varer
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 7, color: "var(--text-muted)" }}>
          <RefreshCw size={13} color="var(--text-muted)" />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Oppdateres fra ukemenyen
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
          {aisles.map((aisle) => (
            <div key={aisle.id} style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  lineHeight: "normal",
                  fontWeight: 400,
                  letterSpacing: "1.4px",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {aisle.label}
              </div>
              {aisle.items.map((item) => (
                <div key={item.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 11, padding: "3px 0", width: "100%" }}>
                  <button
                    type="button"
                    aria-pressed={Boolean(item.done)}
                    aria-label={item.done ? `Merk ${item.name} som ikke kjøpt` : `Kjøp ${item.name}`}
                    onClick={() => toggleItem(item.id)}
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
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      lineHeight: "normal",
                      fontWeight: 400,
                      color: item.done ? "var(--text-muted)" : "var(--text)",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-data)",
                      fontSize: 12,
                      lineHeight: "normal",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
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
            style={{
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: "var(--r-nested)",
              background: "var(--tile-2)",
              outline: "1.5px solid var(--accent)",
              outlineOffset: -0.75,
            }}
          >
            <input
              aria-label="Ny vare"
              autoFocus
              value={draftItem}
              onChange={(event) => setDraftItem(event.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: "normal",
              }}
            />
            <button type="button" onClick={() => { setAdding(false); setDraftItem(""); }} style={ghostPill}>
              Avbryt
            </button>
            <button type="submit" style={savePill}>
              Lagre
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              width: "100%",
              height: 46,
              flexShrink: 0,
              display: "flex",
              flexDirection: "row",
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
            }}
          >
            <Plus size={18} color="var(--text-muted)" />
            Legg til vare
          </button>
        )}
      </section>
    </div>
  );
}

function MealCard({
  meal,
  target,
  onGrip,
  onEdit,
  onTitle,
  onCancel,
  onSave,
}: {
  meal: Meal;
  target: boolean;
  onGrip: (event: React.PointerEvent) => void;
  onEdit: () => void;
  onTitle: (title: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const editing = Boolean(meal.editing);
  return (
    <article
      data-meal={meal.id}
      data-editing={editing ? "true" : undefined}
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
      <button
        type="button"
        aria-label={`Flytt ${meal.title}`}
        onPointerDown={onGrip}
        style={gripButton}
      >
        <GripVertical size={18} color={target ? "var(--accent)" : "var(--text-muted)"} />
      </button>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        {editing ? (
          <TitleField value={meal.title} onChange={onTitle} onSave={onSave} />
        ) : (
          <div style={dishStyle}>{meal.title}</div>
        )}
        <MealMeta meal={meal} />
      </div>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={onCancel} style={ghostPill}>
            Avbryt
          </button>
          <button type="button" onClick={onSave} style={savePill}>
            Lagre
          </button>
        </div>
      ) : (
        <button type="button" aria-label={`Rediger ${meal.title}`} onClick={onEdit} style={gripButton}>
          <Pencil size={16} color="var(--text-muted)" />
        </button>
      )}
    </article>
  );
}

function MealBody({ meal }: { meal: Meal }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={dishStyle}>{meal.title}</div>
      <MealMeta meal={meal} />
    </div>
  );
}

function MealMeta({ meal }: { meal: Meal }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 7 }}>
      {meal.diets.map((diet) => (
        <span
          key={diet}
          style={{
            padding: "4px 9px",
            borderRadius: "var(--r-full)",
            background: "var(--tile-3)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            lineHeight: "normal",
            fontWeight: 400,
            color: "var(--text-2)",
            whiteSpace: "nowrap",
          }}
        >
          {diet}
        </span>
      ))}
      <span style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5, paddingLeft: 3, color: "var(--text-muted)" }}>
        <Timer size={13} color="var(--text-muted)" />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {meal.minutes} min
        </span>
      </span>
    </div>
  );
}

function TitleField({ value, onChange, onSave }: { value: string; onChange: (value: string) => void; onSave: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 3, maxWidth: "100%" }}>
      <span style={{ position: "relative", display: "inline-flex", maxWidth: "100%", minWidth: 2 }}>
        <span aria-hidden style={{ ...dishStyle, visibility: "hidden", whiteSpace: "pre" }}>
          {value || " "}
        </span>
        <input
          aria-label={value || "Rett"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave();
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            margin: 0,
            padding: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            caretColor: "transparent",
            ...dishStyle,
          }}
        />
      </span>
      <span aria-hidden style={{ width: 2, height: 20, flexShrink: 0, background: "var(--accent)" }} />
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

const dishStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: 18,
  lineHeight: "normal",
  fontWeight: 400,
  color: "var(--text)",
  whiteSpace: "nowrap" as const,
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

const ghostPill = {
  ...pillBase,
  background: "var(--tile-3)",
  color: "var(--text-2)",
};

const savePill = {
  ...pillBase,
  background: "var(--accent)",
  color: "var(--ink)",
};
