"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, ChevronRight, GripVertical, Move, Pencil, Plus, ShoppingBasket } from "lucide-react";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import { dinnerMenu, stagedDrag } from "@/data/middag";
import type { GroceryAisle, Meal, MenuDay, WeatherView } from "@/data/types";
import type { OsloNow } from "@/lib/oslo";

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
    meal: day.meal ? { ...day.meal, diets: [...day.meal.diets] } : null,
  }));
}

function cloneAisles(aisles: GroceryAisle[]): GroceryAisle[] {
  return aisles.map((aisle) => ({
    ...aisle,
    items: aisle.items.map((item) => ({ ...item })),
  }));
}

function phoneDays(): MenuDay[] {
  return dinnerMenu.days.map((day) => ({
    ...day,
    meal: day.meal ? { ...day.meal, diets: [...day.meal.diets], editing: false } : null,
  }));
}

function detailFor(meal: Meal): string {
  return [...meal.diets, `${meal.minutes} min`].join(" · ");
}

function dayName(day: MenuDay, today: boolean): string {
  return today ? "i dag" : day.weekday.slice(0, 3);
}

export function MiddagMobile({ clock, weather }: { clock: OsloNow; weather: WeatherView }) {
  const [view, setView] = useState<View>("meny");
  const [days, setDays] = useState(phoneDays);
  const [lift, setLift] = useState<Lift | null>(() => ({
    meal: { ...stagedDrag.meal, diets: [...stagedDrag.meal.diets] },
    fromDayId: stagedDrag.fromDayId,
    targetDayId: stagedDrag.targetDayId,
    live: false,
    left: STAGED_LEFT,
    top: STAGED_TOP,
  }));
  const [aisles, setAisles] = useState(() => cloneAisles(dinnerMenu.aisles));
  const [adding, setAdding] = useState(false);
  const [draftItem, setDraftItem] = useState("");
  const daysRef = useRef<HTMLDivElement>(null);
  const daysState = useRef(days);
  const liftState = useRef(lift);
  const originals = useRef(new Map(dinnerMenu.days.flatMap((day) => (day.meal ? [[day.meal.id, day.meal.title] as const] : []))));
  const nextId = useRef(1);
  daysState.current = days;
  liftState.current = lift;

  const todayKey = clock.numericDate.slice(0, 5);
  const items = aisles.flatMap((aisle) => aisle.items);
  const bought = items.filter((item) => item.done).length;

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
      current.map((day) => (day.meal ? { ...day, meal: { ...day.meal, editing: day.meal.id === id } } : day)),
    );
  }

  function cancelEdit(meal: Meal) {
    updateMeal(meal.id, { editing: false, title: originals.current.get(meal.id) ?? meal.title });
  }

  function saveEdit(meal: Meal) {
    const title = meal.title.trim();
    if (!title) {
      cancelEdit(meal);
      return;
    }
    originals.current.set(meal.id, title);
    updateMeal(meal.id, { editing: false, title });
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

  function liftExisting(event: ReactPointerEvent) {
    event.preventDefault();
    if (!liftState.current) return;
    attachDrag(event.nativeEvent);
  }

  function toggleItem(id: string) {
    setAisles((current) =>
      current.map((aisle) => ({
        ...aisle,
        items: aisle.items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
      })),
    );
  }

  function saveItem() {
    const name = draftItem.trim();
    if (!name) {
      setAdding(false);
      setDraftItem("");
      return;
    }
    setAisles((current) => {
      const next = cloneAisles(current);
      const aisle = next[next.length - 1];
      aisle?.items.push({ id: `ny-${nextId.current++}`, name, quantity: "1 stk" });
      return next;
    });
    setAdding(false);
    setDraftItem("");
  }

  return (
    <div
      data-region="middag-mobile"
      data-view={view}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 16px 12px",
        boxSizing: "border-box",
      }}
    >
      <PhoneHeader clock={clock} weather={weather} />
      <ViewSwitch view={view} onChange={setView} />
      {view === "meny" ? (
        <>
          <div ref={daysRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 7 }}>
            {days.map((day) => {
              const today = day.date === todayKey;
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
                    height: empty || !day.meal?.editing ? 55 : "auto",
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
                    <Grip
                      label={`Flytt ${day.meal.title}`}
                      color={target ? "var(--accent)" : "var(--text-muted)"}
                      onPointerDown={(event) => liftFromDay(event, day.id)}
                    />
                  )}
                  <DayMark day={day} today={today} />
                  {empty || !day.meal ? (
                    <DropSlot label={lift && source ? `${lift.meal.title} flyttes herfra` : "Ledig"} />
                  ) : (
                    <MealRow
                      meal={day.meal}
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
          <button
            type="button"
            onClick={() => setView("liste")}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
              padding: 13,
              border: "none",
              borderRadius: "var(--r-tile)",
              background: "var(--tile)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <ShoppingBasket size={19} color="var(--text-2)" />
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 16,
                  lineHeight: 1.1,
                  fontWeight: 400,
                  color: "var(--text)",
                }}
              >
                Handleliste
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  lineHeight: 1.2,
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
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
          onToggle={toggleItem}
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
    <div
      style={{
        height: 42,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        gap: 4,
        padding: 4,
        borderRadius: 10,
        background: "var(--tile)",
      }}
    >
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
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 13,
          lineHeight: 1.1,
          fontWeight: 400,
          color: today ? "var(--accent)" : "var(--text)",
          whiteSpace: "nowrap",
        }}
      >
        {dayName(day, today)}
      </div>
      <div
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 11,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {day.date}
      </div>
    </div>
  );
}

function DropSlot({ label }: { label: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: 40,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 10,
        outline: "1.5px solid #ffffff24",
        outlineOffset: -0.75,
        color: "var(--text-muted)",
      }}
    >
      <Move size={14} color="var(--text-muted)" />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Grip({
  label,
  color,
  onPointerDown,
}: {
  label: string;
  color: string;
  onPointerDown: (event: ReactPointerEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 15,
        height: 15,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "grab",
        flexShrink: 0,
      }}
    >
      <GripVertical size={15} color={color} />
    </button>
  );
}

function MealCopy({ meal }: { meal: Meal }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {meal.title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {detailFor(meal)}
      </div>
    </div>
  );
}

function MealRow({
  meal,
  onEdit,
  onTitle,
  onCancel,
  onSave,
}: {
  meal: Meal;
  onEdit: () => void;
  onTitle: (title: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const editing = Boolean(meal.editing);
  return (
    <>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: editing ? 8 : 3 }}>
        {editing ? (
          <TitleField value={meal.title} onChange={onTitle} onSave={onSave} />
        ) : (
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 15,
              lineHeight: 1.1,
              fontWeight: 400,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meal.title}
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {detailFor(meal)}
        </div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onCancel} style={ghostPill}>
              Avbryt
            </button>
            <button type="button" onClick={onSave} style={savePill}>
              Lagre
            </button>
          </div>
        ) : null}
      </div>
      {editing ? null : (
        <button
          type="button"
          aria-label={`Rediger ${meal.title}`}
          onClick={onEdit}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Pencil size={14} color="var(--text-muted)" />
        </button>
      )}
    </>
  );
}

function TitleField({
  value,
  onChange,
  onSave,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 3, minWidth: 0 }}>
      <span style={{ position: "relative", display: "inline-flex", maxWidth: "100%", minWidth: 2 }}>
        <span
          aria-hidden
          style={{
            whiteSpace: "pre",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          {value || " "}
        </span>
        <input
          aria-label={value || "Rett"}
          value={value}
          autoFocus
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
            color: "transparent",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            lineHeight: 1.1,
            fontWeight: 400,
          }}
        />
      </span>
      <span aria-hidden style={{ width: 2, height: 16, flexShrink: 0, background: "var(--accent)" }} />
    </div>
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
      {aisles.map((aisle) => (
        <div key={aisle.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              lineHeight: 1,
              fontWeight: 400,
              letterSpacing: "1.4px",
              color: "var(--text-muted)",
            }}
          >
            {aisle.label}
          </div>
          {aisle.items.map((item) => (
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
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: 1.2,
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
                  lineHeight: 1,
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
      {adding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: "var(--r-nested)",
            background: "var(--tile)",
            outline: "1.5px solid var(--accent)",
            outlineOffset: -0.75,
          }}
        >
          <input
            aria-label="Ny vare"
            autoFocus
            value={draftItem}
            onChange={(event) => onDraft(event.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
            }}
          />
          <button type="button" onClick={onCancel} style={ghostPill}>
            Avbryt
          </button>
          <button type="submit" style={savePill}>
            Lagre
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          style={{
            width: "100%",
            height: 48,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            outline: "1.5px solid #ffffff24",
            outlineOffset: -0.75,
            borderRadius: "var(--r-nested)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          <Plus size={17} color="var(--text-muted)" />
          Legg til vare
        </button>
      )}
    </div>
  );
}

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
