import type { Person } from "@/data/types";
import { EventChip } from "@/components/hjem/EventChip";
import { TransportPill } from "@/components/hjem/TransportPill";

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
        {person.events.map((event) => (
          <EventChip key={`${event.time ?? "none"}-${event.title}`} event={event} />
        ))}
      </div>
      <div
        style={{
          width: 175,
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <TransportPill transport={person.transport} />
      </div>
    </div>
  );
}
