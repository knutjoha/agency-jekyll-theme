"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, CalendarX, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { addIsoDays } from "@/lib/calendar-view";
import { fristButtonLabel, nextMonday, shortcutStamp, weekdayIndex } from "@/lib/frist";

const MONTHS = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
];
const LETTERS = ["ma", "ti", "on", "to", "fr", "lø", "sø"];

const DELETE_BG = "#3A1C1C";
const DELETE_FG = "#FF6B6B";

type MonthCursor = { year: number; month: number };

function monthOf(iso: string): MonthCursor {
  const [year, month] = iso.split("-").map(Number);
  return { year, month };
}

function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const date = new Date(Date.UTC(cursor.year, cursor.month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function monthCells(cursor: MonthCursor): { iso: string; inMonth: boolean }[] {
  const first = `${String(cursor.year).padStart(4, "0")}-${String(cursor.month).padStart(2, "0")}-01`;
  const offset = (weekdayIndex(first) + 6) % 7;
  let cursorIso = addIsoDays(first, -offset);
  const lastDay = new Date(Date.UTC(cursor.year, cursor.month, 0)).getUTCDate();
  const lastIso = `${String(cursor.year).padStart(4, "0")}-${String(cursor.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let week = 0; week < 6; week += 1) {
    for (let day = 0; day < 7; day += 1) {
      const year = Number(cursorIso.slice(0, 4));
      const month = Number(cursorIso.slice(5, 7));
      cells.push({ iso: cursorIso, inMonth: year === cursor.year && month === cursor.month });
      cursorIso = addIsoDays(cursorIso, 1);
    }
    if ((cells[cells.length - 1]?.iso ?? "") >= lastIso) break;
  }
  return cells;
}

export function FristPicker({
  dueOn,
  today,
  open,
  onOpenChange,
  onChange,
  onClear,
  onReserve,
  phone,
}: {
  dueOn: string | null;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (dueOn: string) => void;
  onClear: () => void;
  onReserve?: (height: number) => void;
  phone?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const reserveRef = useRef(onReserve);
  reserveRef.current = onReserve;
  const [cursor, setCursor] = useState<MonthCursor>(() => monthOf(dueOn ?? today));
  const label = fristButtonLabel(dueOn, today);
  const tomorrow = addIsoDays(today, 1);
  const monday = nextMonday(today);
  const shortcuts = [
    { label: "I dag", date: today, secondary: shortcutStamp(today, true) },
    { label: "I morgen", date: tomorrow, secondary: shortcutStamp(tomorrow, true) },
    { label: "Neste mandag", date: monday, secondary: shortcutStamp(monday, false) },
  ];

  useEffect(() => {
    if (open && !opened.current) setCursor(monthOf(dueOn ?? today));
    opened.current = open;
  }, [open, dueOn, today]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const node = event.target as Node;
      if (buttonRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      onOpenChange(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const node = popoverRef.current;
    if (!node) return;
    reserveRef.current?.(node.offsetHeight + 24);
  }, [open, cursor, dueOn]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!open);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          maxWidth: "100%",
          padding: phone ? "9px 12px" : "8px 10px",
          border: "none",
          borderRadius: "var(--r-full)",
          background: "transparent",
          boxShadow: dueOn || open
            ? "inset 0 0 0 1.5px var(--accent)"
            : "inset 0 0 0 1px color-mix(in srgb, var(--text) 18%, transparent)",
          color: dueOn ? "var(--accent)" : "var(--text-muted)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          lineHeight: "normal",
          fontWeight: 400,
        }}
      >
        <Calendar size={14} color={dueOn ? "var(--accent)" : "var(--text-muted)"} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </button>
      {open ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Frist"
          data-frist-popover="true"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 30,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 12,
            background: "var(--tile-2)",
            borderRadius: 12,
            boxShadow: "0 16px 40px #000000B3",
            outline: "1px solid #ffffff14",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              lineHeight: 1.2,
              fontWeight: 400,
              color: "var(--text-muted)",
            }}
          >
            Frist
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {shortcuts.map((row) => {
              const selected = dueOn === row.date;
              return (
                <button
                  key={row.label}
                  type="button"
                  aria-pressed={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange(row.date)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    border: "none",
                    borderRadius: 8,
                    background: selected ? "#ffffff14" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textAlign: "left",
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      lineHeight: 1.2,
                      fontWeight: 400,
                      color: "var(--text)",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      lineHeight: 1.2,
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.secondary}
                  </span>
                  {selected ? <Check size={16} color="var(--accent)" /> : <span aria-hidden style={{ width: 16 }} />}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.2,
                fontWeight: 400,
                color: "var(--text)",
              }}
            >
              {MONTHS[cursor.month - 1]} {cursor.year}
            </span>
            <span style={{ display: "flex", gap: 2 }}>
              <button
                type="button"
                aria-label="Forrige måned"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setCursor((current) => shiftMonth(current, -1))}
                style={chevronStyle}
              >
                <ChevronLeft size={16} color="var(--text-muted)" />
              </button>
              <button
                type="button"
                aria-label="Neste måned"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setCursor((current) => shiftMonth(current, 1))}
                style={chevronStyle}
              >
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center" }}>
            {LETTERS.map((letter) => (
              <span
                key={letter}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  lineHeight: "28px",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                {letter}
              </span>
            ))}
            {monthCells(cursor).map((cell) => {
              const selected = dueOn === cell.iso;
              const day = cell.iso.slice(8, 10);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  aria-pressed={selected}
                  aria-label={cell.iso}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange(cell.iso)}
                  style={{
                    width: "100%",
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: selected ? "var(--accent)" : "transparent",
                      color: selected ? "var(--ink)" : cell.inMonth ? "var(--text)" : "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      lineHeight: 1,
                      fontWeight: 400,
                    }}
                  >
                    {day}
                  </span>
                </button>
              );
            })}
          </div>
          {dueOn ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClear}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                border: "none",
                borderRadius: "var(--r-full)",
                background: DELETE_BG,
                color: DELETE_FG,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: "normal",
                fontWeight: 400,
              }}
            >
              <CalendarX size={14} color={DELETE_FG} />
              Fjern frist
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

const chevronStyle = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "transparent",
  cursor: "pointer",
};
