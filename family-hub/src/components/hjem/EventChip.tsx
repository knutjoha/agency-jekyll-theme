import type { CalendarEvent } from "@/data/types";
import type { EventPhase } from "@/lib/home-cache";

export function EventChip({ event }: { event: CalendarEvent & { phase?: EventPhase } }) {
  const phase = event.phase;
  const label = phase === "now" && event.time ? "nå" : phase === "done" ? "ferdig" : null;
  return (
    <div
      data-phase={phase ?? "upcoming"}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "10px 14px",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-3)",
        flexShrink: 1,
        minWidth: 0,
        maxWidth: "100%",
        opacity: phase === "done" ? 0.55 : 1,
        boxShadow: phase === "now" ? "inset 2px 0 0 var(--accent)" : undefined,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 18,
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--text)",
          whiteSpace: "nowrap",
        }}
      >
        {event.time ?? "—"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 15,
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--text-2)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {event.title}
      </div>
      {label ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            lineHeight: 1,
            fontWeight: 400,
            color: phase === "now" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
