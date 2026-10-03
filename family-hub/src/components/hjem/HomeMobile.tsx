"use client";

import { useState } from "react";
import { WeatherIcon } from "@/components/hjem/Meteogram";
import { TransportPill } from "@/components/hjem/TransportPill";
import { people, soon } from "@/data/fixture";
import type { CalendarEvent, Person, SoonItem, WeatherView } from "@/data/types";
import type { OsloNow } from "@/lib/oslo";

const previewDates = ["05.10", "06.10", "18.10"];

function eventLine(events: CalendarEvent[]): string {
  return events
    .map((event) => (event.time ? `${event.time} ${event.title}` : event.title))
    .join(" · ");
}

function previewSoon(items: SoonItem[], expanded: boolean): SoonItem[] {
  if (expanded) return items;
  const picked = previewDates
    .map((date) => items.find((item) => item.date === date))
    .filter((item): item is SoonItem => Boolean(item));
  return picked.length > 0 ? picked : items.slice(0, 3);
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
          <TransportPill transport={person.transport} compact />
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
          {eventLine(person.events)}
        </div>
      </div>
    </article>
  );
}

export function HomeMobile({ clock, weather }: { clock: OsloNow; weather: WeatherView }) {
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
      <header data-region="header" style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: "1.8px",
            color: "var(--text-muted)",
          }}
        >
          FAMILIEN VIDVEI
        </div>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 27,
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          {clock.weekdayLine}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingTop: 3,
            minWidth: 0,
          }}
        >
          <WeatherIcon symbol={weather.headerSymbol} size={16} color="var(--text-2)" />
          <div
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 15,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text)",
              flexShrink: 0,
            }}
          >
            {weather.temperature}°
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              lineHeight: 1.2,
              fontWeight: 400,
              color: "var(--text-muted)",
              minWidth: 0,
            }}
          >
            {weather.summary}
          </div>
        </div>
      </header>

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
        </div>
        {rows.map((item) => (
          <div
            key={`${item.date}-${item.title}`}
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
        ))}
      </section>
    </div>
  );
}
