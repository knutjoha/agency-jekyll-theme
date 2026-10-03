import type { CalendarEvent } from "@/data/types";

export function EventChip({ event }: { event: CalendarEvent }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "10px 14px",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-3)",
        flexShrink: 0,
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
        }}
      >
        {event.title}
      </div>
    </div>
  );
}
