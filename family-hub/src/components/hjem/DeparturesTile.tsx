import type { ReactNode } from "react";
import { departureDisplay, type Departure, type LineDepartures } from "@/lib/departures";

function DepartureTime({ departure, compact }: { departure: Departure; compact: boolean }) {
  const display = departureDisplay(departure);
  return (
    <div
      data-cancelled={display.cancelled ? "true" : "false"}
      data-delay={display.delayLabel ?? ""}
      style={{
        flex: compact ? "1 1 0" : "0 0 auto",
        minWidth: compact ? 0 : 68,
        display: "flex",
        flexDirection: "column",
        alignItems: compact ? "center" : "flex-end",
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-data)",
          fontSize: compact ? 16 : 18,
          lineHeight: 1,
          fontWeight: 400,
          color: display.cancelled ? "var(--text-muted)" : "var(--text)",
          textDecoration: display.cancelled ? "line-through" : "none",
          whiteSpace: "nowrap",
        }}
      >
        {display.time}
      </div>
      {display.delayLabel ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: compact ? 12 : 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--accent)",
            whiteSpace: "nowrap",
          }}
        >
          {display.delayLabel}
        </div>
      ) : null}
    </div>
  );
}

function LineRow({ line, compact }: { line: LineDepartures; compact: boolean }) {
  const identity = (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: compact ? 8 : 12, minWidth: 0, flex: compact ? undefined : 1 }}>
      <div
        style={{
          minWidth: compact ? 42 : 48,
          padding: "6px 8px",
          borderRadius: "var(--r-nested)",
          background: "var(--tile-2)",
          fontFamily: "var(--font-data)",
          fontSize: compact ? 14 : 15,
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--text)",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {line.line}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--font-body)",
          fontSize: compact ? 15 : 16,
          lineHeight: 1.2,
          fontWeight: 400,
          color: "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {line.destination}
      </div>
    </div>
  );

  const times =
    line.departures.length === 0 ? (
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: compact ? 14 : 15,
          lineHeight: 1.2,
          fontWeight: 400,
          color: "var(--text-muted)",
        }}
      >
        Ingen avganger
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: compact ? "space-between" : "flex-end",
          gap: compact ? 4 : 14,
          flexShrink: 0,
          width: compact ? "100%" : "auto",
        }}
      >
        {line.departures.map((departure) => (
          <DepartureTime key={departure.id} departure={departure} compact={compact} />
        ))}
      </div>
    );

  return (
    <div
      data-line={line.line}
      data-destination={line.destination}
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        alignItems: compact ? "stretch" : "center",
        gap: compact ? 8 : 12,
        minWidth: 0,
      }}
    >
      {identity}
      {times}
    </div>
  );
}

export function DeparturesTile({
  lines,
  note,
  compact = false,
}: {
  lines: LineDepartures[];
  note?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      data-region="departures"
      aria-label="Avganger fra Stabekk"
      style={{
        width: "100%",
        minHeight: compact ? 0 : 180,
        height: "auto",
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: compact ? 10 : 12,
        padding: compact ? 13 : 24,
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
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: compact ? 18 : 22,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          Avganger
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: compact ? 12 : 13,
            lineHeight: 1.2,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          Stabekk
        </div>
      </div>
      {note}
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 12 : 14 }}>
        {lines.map((line) => (
          <LineRow key={line.line} line={line} compact={compact} />
        ))}
      </div>
    </section>
  );
}
