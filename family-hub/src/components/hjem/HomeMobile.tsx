"use client";

import { useState } from "react";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import type { CalendarEvent, Person, SoonItem, WeatherView } from "@/data/types";
import { SOON_EMPTY } from "@/lib/calendar-view";
import type { OsloNow } from "@/lib/oslo";

function eventLine(events: CalendarEvent[]): string {
  return events
    .map((event) => (event.time ? `${event.time} ${event.title}` : event.title))
    .join(" · ");
}

function previewSoon(items: SoonItem[], expanded: boolean): SoonItem[] {
  if (expanded) return items;
  return items.slice(0, 3);
}

function PersonCard({ person }: { person: Person }) {
  return (
    <article
      data-person={person.id}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        padding: 11,
        borderRadius: "var(--r-nested)",
        background: "var(--tile)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: "var(--r-full)",
          background: `var(${person.colorToken})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-heading)",
          fontSize: 17,
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--ink)",
        }}
      >
        {person.initial}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
            }}
          >
            {person.name}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1.25,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          {eventLine(person.events) || person.detail}
        </div>
      </div>
    </article>
  );
}

export function HomeMobile({
  clock,
  weather,
  people,
  soon,
}: {
  clock: OsloNow;
  weather: WeatherView;
  people: Person[];
  soon: SoonItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const rows = previewSoon(soon, expanded);

  return (
    <div
      data-region="hjem-mobile"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 16px 12px",
        boxSizing: "border-box",
      }}
    >
      <PhoneHeader clock={clock} weather={weather} />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 2px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          I dag
        </div>
        <div
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          {clock.numericDate}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {people.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>

      <section
        data-region="soon"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 13,
          borderRadius: "var(--r-tile)",
          background: "var(--tile)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
            }}
          >
            Snart
          </div>
          {soon.length > 3 ? (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((open) => !open)}
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--accent)",
                cursor: "pointer",
              }}
            >
              {expanded ? "vis færre" : "se alle"}
            </button>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.3,
              fontWeight: 400,
              color: "var(--text-muted)",
            }}
          >
            {SOON_EMPTY}
          </div>
        ) : (
          rows.map((item, index) => (
          <div
            key={`${item.date}-${item.title}-${index}`}
            style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                flexShrink: 0,
                borderRadius: "var(--r-full)",
                background: `var(${item.dotToken})`,
              }}
            />
            <div
              style={{
                width: 58,
                flexShrink: 0,
                fontFamily: "var(--font-data)",
                fontSize: 16,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--text-2)",
              }}
            >
              {item.date}
            </div>
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
                  fontSize: 13,
                  lineHeight: 1.2,
                  fontWeight: 400,
                  color: "var(--text-muted)",
                }}
              >
                {item.meta}
              </div>
            </div>
          </div>
          ))
        )}
      </section>
    </div>
  );
}
