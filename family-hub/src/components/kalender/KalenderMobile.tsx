"use client";

import { Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { columnsFor } from "@/components/kalender/WeekGrid";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import { calendarWeek } from "@/data/calendar";
import { people } from "@/data/fixture";
import type { Person, WeatherView } from "@/data/types";
import { formatOslo, type OsloNow } from "@/lib/oslo";

type AgendaItem = {
  time: string;
  title: string;
  people: Person[];
  warning: boolean;
};

function personFor(id: Person["id"]): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

function fixtureTitle(person: Person, time: string, fallback: string): string {
  return person.events.find((event) => event.time === time)?.title ?? fallback;
}

function agendaFor(dayIndex: number): AgendaItem[] {
  const items = new Map<string, AgendaItem>();
  for (const row of calendarWeek.rows) {
    const person = personFor(row.personId);
    for (const block of row.days[dayIndex]?.blocks ?? []) {
      if (block.kind !== "activity") continue;
      const title = fixtureTitle(person, block.time, block.title);
      const key = `${block.time}|${title}`;
      const existing = items.get(key);
      if (existing) {
        existing.people.push(person);
        existing.warning = existing.warning || Boolean(block.warning);
      } else {
        items.set(key, {
          time: block.time,
          title,
          people: [person],
          warning: Boolean(block.warning),
        });
      }
    }
  }
  return [...items.values()].sort((left, right) => left.time.localeCompare(right.time));
}

function detailFor(item: AgendaItem): string {
  const names = item.people.map((person) => person.name).join(" · ");
  if (item.warning) {
    const missing = item.people.find((person) => person.transport.kind === "missing");
    return `${names} · ${missing?.transport.label ?? "Sjåfør mangler"}`;
  }
  if (item.people.length === 1) {
    const person = item.people[0];
    const timed = person.events.filter((event) => event.time);
    if (person.transport.kind === "assigned" && timed.length === 1 && timed[0].time === item.time) {
      return `${names} · ${person.transport.label}`;
    }
  }
  return names;
}

function headingFor(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return formatOslo(new Date(Date.UTC(year, month - 1, day, 10, 0, 0))).weekdayLine;
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "hendelse" : "hendelser"}`;
}

export function KalenderMobile({ clock, weather }: { clock: OsloNow; weather: WeatherView }) {
  const { columns } = columnsFor(clock);
  const todayKey = columns.find((column) => column.today)?.key ?? columns[0].key;
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const selectedIndex = Math.max(
    0,
    columns.findIndex((column) => column.key === selectedKey),
  );
  const items = agendaFor(selectedIndex);

  return (
    <div
      data-region="kalender-mobile"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 16px 12px",
        boxSizing: "border-box",
      }}
    >
      <PhoneHeader clock={clock} weather={weather} />

      <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
        {columns.map((column) => {
          const selected = column.key === selectedKey;
          return (
            <button
              key={column.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedKey(column.key)}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "9px 0",
                border: 0,
                borderRadius: "var(--r-nested)",
                background: selected ? "var(--tile-2)" : "var(--tile)",
                outline: selected ? "1.5px solid var(--accent)" : "none",
                outlineOffset: selected ? -0.75 : undefined,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: selected ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {column.weekday}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 17,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: "var(--text)",
                }}
              >
                {column.dateLabel}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "4px 2px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          {headingFor(columns[selectedIndex].key)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {countLabel(items.length)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const detailColor = item.warning ? "var(--accent)" : "var(--text-muted)";
          return (
            <article
              key={`${item.time}-${item.title}`}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 11,
                borderRadius: "var(--r-nested)",
                background: "var(--tile)",
                outline: item.warning ? "1px solid var(--accent)" : "none",
                outlineOffset: item.warning ? -0.5 : undefined,
              }}
            >
              <div
                style={{
                  width: 44,
                  flexShrink: 0,
                  fontFamily: "var(--font-data)",
                  fontSize: 14,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: "var(--text-2)",
                }}
              >
                {item.time}
              </div>
              <div
                style={{
                  width: 9,
                  height: 9,
                  flexShrink: 0,
                  borderRadius: "var(--r-full)",
                  background: `var(${item.people[0].colorToken})`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    lineHeight: 1.2,
                    fontWeight: 400,
                    color: "var(--text)",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    lineHeight: 1.2,
                    fontWeight: 400,
                    color: detailColor,
                  }}
                >
                  {detailFor(item)}
                </div>
              </div>
              {item.warning ? <TriangleAlert size={15} color="var(--accent)" /> : null}
            </article>
          );
        })}
      </div>

      <button
        type="button"
        style={{
          height: 48,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: 0,
          borderRadius: "var(--r-nested)",
          background: "transparent",
          outline: "1.5px solid #ffffff24",
          outlineOffset: -0.75,
          cursor: "pointer",
        }}
      >
        <Plus size={17} color="var(--text-muted)" />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          Ny hendelse
        </span>
      </button>
    </div>
  );
}
