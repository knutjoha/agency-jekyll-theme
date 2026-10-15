import type { ReactNode } from "react";
import { departureDisplay, type Departure } from "@/lib/departures";

export function DeparturesTile({
  rows,
  note,
  compact = false,
}: {
  rows: Departure[];
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
      {rows.length === 0 ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: compact ? 15 : 16,
            lineHeight: 1.3,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          Ingen avganger nå
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 10 }}>
          {rows.map((row) => {
            const display = departureDisplay(row);
            return (
              <div
                key={row.id}
                data-line={row.line}
                data-destination={row.destination}
                data-cancelled={display.cancelled ? "true" : "false"}
                data-delay={display.delayLabel ?? ""}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: compact ? 10 : 12,
                  minWidth: 0,
                }}
              >
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
                  {row.line}
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
                  {row.destination}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    flexShrink: 0,
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
                        fontSize: 13,
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
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
