import { TriangleAlert } from "lucide-react";
import type { CalendarBlock, CalendarDay, ColorToken } from "@/data/types";

function RoutineBand({ label }: { label: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: 20,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        padding: "0 7px",
        borderRadius: 6,
        background: "color-mix(in srgb, var(--text) 4%, transparent)",
        fontFamily: "var(--font-body)",
        fontSize: 11,
        lineHeight: 1,
        fontWeight: 400,
        color: "var(--text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

function ActivityChip({ block, colorToken }: { block: Extract<CalendarBlock, { kind: "activity" }>; colorToken: ColorToken }) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "5px 8px",
        borderRadius: 8,
        background: `color-mix(in srgb, var(${colorToken}) 15%, transparent)`,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 12,
          lineHeight: 1,
          fontWeight: 400,
          color: `var(${colorToken})`,
          whiteSpace: "nowrap",
        }}
      >
        {block.time}
      </div>
      <div
        style={{
          width: "100%",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          lineHeight: 1.15,
          fontWeight: 400,
          color: "var(--text)",
        }}
      >
        {block.title}
      </div>
      {block.warning ? (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
          <TriangleAlert size={12} color="var(--accent)" />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--accent)",
              whiteSpace: "nowrap",
            }}
          >
            {block.warning}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function DayCell({ day, colorToken }: { day: CalendarDay; colorToken: ColorToken }) {
  return (
    <div
      data-conflict={day.conflict ? "true" : undefined}
      style={{
        flex: 1,
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 5,
        padding: "7px 8px",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-2)",
        outline: day.conflict ? "1.5px solid var(--accent)" : "none",
        outlineOffset: day.conflict ? -0.75 : undefined,
      }}
    >
      {day.blocks.map((block, index) =>
        block.kind === "routine" ? (
          <RoutineBand key={`${block.label}-${index}`} label={block.label} />
        ) : (
          <ActivityChip key={`${block.time}-${block.title}-${index}`} block={block} colorToken={colorToken} />
        ),
      )}
    </div>
  );
}
