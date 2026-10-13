import type { Person } from "@/data/types";
import { EventChip } from "@/components/hjem/EventChip";

export function PersonRow({ person }: { person: Person }) {
  return (
    <div
      data-person={person.id}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: "10px 18px",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-2)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          flexShrink: 0,
          borderRadius: "var(--r-full)",
          background: `var(${person.colorToken})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-heading)",
          fontSize: 24,
          lineHeight: 1,
          fontWeight: 400,
          color: "var(--ink)",
        }}
      >
        {person.initial}
      </div>
      <div
        style={{
          width: 144,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 26,
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
            fontSize: 15,
            lineHeight: 1.2,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          {person.detail}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
          {person.transport ? (
          <div
            data-transport={person.transport.kind}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--r-full)",
              background: person.transport.kind === "missing" ? "var(--warn-bg)" : "var(--tile-3)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              lineHeight: 1,
              fontWeight: 400,
              color: person.transport.kind === "missing" ? "var(--accent)" : "var(--text-2)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {person.transport.label}
          </div>
        ) : null}
        {person.events.map((event, index) => (
          <EventChip key={`${event.time ?? "none"}-${event.title}-${index}`} event={event} />
        ))}
      </div>
    </div>
  );
}
