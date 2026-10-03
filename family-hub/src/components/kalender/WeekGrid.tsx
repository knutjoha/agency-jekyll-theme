import { ChevronLeft, ChevronRight } from "lucide-react";
import { people } from "@/data/fixture";
import type { CalendarSource, CalendarWeek, Person } from "@/data/types";
import { DayCell } from "@/components/kalender/DayCell";
import { isoWeekNumber, type OsloNow } from "@/lib/oslo";

const WEEKDAYS = ["man", "tir", "ons", "tor", "fre", "lør", "søn"] as const;

type DayColumn = {
  key: string;
  weekday: string;
  dateLabel: string;
  today: boolean;
};

function shiftDate(iso: string, days: number): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function columnsFor(clock: OsloNow, startsOn: string): { columns: DayColumn[]; period: string; weekNumber: number } {
  const [day, month, year] = clock.numericDate.split(".");
  const todayKey = `${year}-${month}-${day}`;
  const columns = WEEKDAYS.map((weekday, index) => {
    const date = shiftDate(startsOn, index);
    const key = `${date.year}-${pad(date.month)}-${pad(date.day)}`;
    return {
      key,
      weekday,
      dateLabel: pad(date.day),
      today: key === todayKey,
    };
  });
  const start = shiftDate(startsOn, 0);
  const end = shiftDate(startsOn, 6);
  return {
    columns,
    period: `${pad(start.day)}.${pad(start.month)} – ${pad(end.day)}.${pad(end.month)}.${end.year}`,
    weekNumber: isoWeekNumber(start.year, start.month, start.day),
  };
}

function personFor(id: Person["id"]): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

export function WeekGrid({
  clock,
  week,
  source,
  onShift,
}: {
  clock: OsloNow;
  week: CalendarWeek;
  source: CalendarSource;
  onShift: (startsOn: string, deltaWeeks: number) => void;
}) {
  const { columns, period, weekNumber } = columnsFor(clock, week.startsOn);
  const canShift = source === "google";

  return (
    <section
      data-region="calendar"
      data-calendar-source={source}
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        borderRadius: "var(--r-tile)",
        background: "var(--tile)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 24,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
            }}
          >
            Uke {weekNumber}
          </div>
          <div
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 15,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {period}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
          {week.notice ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: "7px 13px",
                borderRadius: "var(--r-full)",
                background: "var(--tile-2)",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  flexShrink: 0,
                  borderRadius: "var(--r-full)",
                  background: "var(--accent)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: "var(--text-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {week.notice}
              </span>
            </div>
          ) : null}
          <button
            type="button"
            aria-label="Forrige uke"
            aria-disabled={canShift ? undefined : true}
            onClick={canShift ? () => onShift(week.startsOn, -1) : undefined}
            style={{ ...navButtonStyle, cursor: canShift ? "pointer" : "default" }}
          >
            <ChevronLeft size={20} color="var(--text-2)" />
          </button>
          <button
            type="button"
            aria-label="Neste uke"
            aria-disabled={canShift ? undefined : true}
            onClick={canShift ? () => onShift(week.startsOn, 1) : undefined}
            style={{ ...navButtonStyle, cursor: canShift ? "pointer" : "default" }}
          >
            <ChevronRight size={20} color="var(--text-2)" />
          </button>
        </div>
      </div>
      <div style={gridRowStyle}>
        <div style={{ width: 140, flexShrink: 0 }} />
        {columns.map((column) => (
          <div
            key={column.key}
            data-today={column.today ? "true" : undefined}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "7px 0",
              borderRadius: "var(--r-nested)",
              background: column.today ? "var(--tile-2)" : "transparent",
              outline: column.today ? "1.5px solid var(--accent)" : "none",
              outlineOffset: column.today ? -0.75 : undefined,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1,
                fontWeight: 400,
                color: column.today ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {column.today ? "i dag" : column.weekday}
            </div>
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 19,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--text)",
              }}
            >
              {column.dateLabel}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {week.rows.map((row) => {
          const person = personFor(row.personId);
          return (
            <div key={row.personId} data-person={row.personId} style={{ ...gridRowStyle, flex: 1, minHeight: 0 }}>
              <div
                style={{
                  width: 140,
                  flexShrink: 0,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 12px",
                  borderRadius: "var(--r-nested)",
                  background: "var(--tile-2)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    flexShrink: 0,
                    borderRadius: "var(--r-full)",
                    background: `var(${person.colorToken})`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 17,
                      lineHeight: 1,
                      fontWeight: 400,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {person.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      lineHeight: 1.15,
                      fontWeight: 400,
                      color: "var(--text-muted)",
                    }}
                  >
                    {row.detail}
                  </div>
                </div>
              </div>
              {row.days.map((day, index) => (
                <DayCell key={columns[index].key} day={day} colorToken={person.colorToken} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const gridRowStyle = {
  display: "flex",
  flexDirection: "row" as const,
  gap: 10,
  width: "100%",
  alignItems: "stretch" as const,
};

const navButtonStyle = {
  width: 38,
  height: 38,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--tile-2)",
  cursor: "default",
};
