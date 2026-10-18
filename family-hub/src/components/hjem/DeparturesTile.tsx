import type { ReactNode } from "react";
import { departureDisplay, type Departure, type LineDepartures } from "@/lib/departures";

const TONE_BACKGROUND = {
  ontime: "var(--departure-ontime)",
  delayed: "var(--departure-delayed)",
  cancelled: "var(--departure-cancelled)",
} as const;

function DepartureTime({ departure, now, compact }: { departure: Departure; now: Date; compact: boolean }) {
  const display = departureDisplay(departure, now);
  return (
    <div
      className={compact ? undefined : "departures-chip"}
      data-cancelled={display.cancelled ? "true" : "false"}
      data-delay={display.delayLabel ?? ""}
      data-until={display.untilLabel ?? ""}
      data-tone={display.tone}
      style={{
        flex: compact ? "1 1 0" : undefined,
        minWidth: compact ? 0 : undefined,
        minHeight: compact ? 56 : 62,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 3,
        padding: compact ? "6px 4px" : "7px 8px",
        borderRadius: 8,
        background: TONE_BACKGROUND[display.tone],
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
      {display.untilLabel ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: compact ? 12 : 13,
            lineHeight: 1,
            fontWeight: 400,
            color: display.untilLabel === "nå" ? "var(--accent)" : "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {display.untilLabel}
        </div>
      ) : null}
      {display.tone === "delayed" && display.delayLabel ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: compact ? 10 : 11,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--accent)",
            whiteSpace: "nowrap",
          }}
        >
          {display.delayLabel}
        </div>
      ) : null}
      {display.cancelled ? (
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
          Innstilt
        </div>
      ) : null}
    </div>
  );
}

function LineRow({ line, now, compact }: { line: LineDepartures; now: Date; compact: boolean }) {
  const identity = (
    <div
      className={compact ? undefined : "departures-id"}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 8 : 12,
        minWidth: 0,
      }}
    >
      <div
        className={compact ? undefined : "departures-line-badge"}
        style={{
          minWidth: compact ? 42 : undefined,
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
        className={compact ? undefined : "departures-times"}
        style={{
          display: compact ? "flex" : undefined,
          flexDirection: compact ? "row" : undefined,
          alignItems: compact ? "flex-start" : undefined,
          justifyContent: compact ? "space-between" : undefined,
          gap: compact ? 6 : undefined,
          flexShrink: compact ? 0 : undefined,
          width: compact ? "100%" : undefined,
        }}
      >
        {line.departures.map((departure) => (
          <DepartureTime key={departure.id} departure={departure} now={now} compact={compact} />
        ))}
      </div>
    );

  return (
    <div
      className={compact ? undefined : "departures-line"}
      data-line={line.line}
      data-destination={line.destination}
      style={{
        display: compact ? "flex" : undefined,
        flexDirection: compact ? "column" : undefined,
        alignItems: compact ? "stretch" : undefined,
        gap: compact ? 8 : undefined,
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
  now,
  note,
  compact = false,
}: {
  lines: LineDepartures[];
  now: Date;
  note?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={compact ? undefined : "departures-tile"}
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
          <LineRow key={line.line} line={line} now={now} compact={compact} />
        ))}
      </div>
    </section>
  );
}
