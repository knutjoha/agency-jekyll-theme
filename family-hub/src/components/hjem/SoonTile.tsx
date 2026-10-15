import type { ReactNode } from "react";
import type { SoonItem } from "@/data/types";
import { SOON_EMPTY } from "@/lib/calendar-view";

export function SoonTile({ items, note }: { items: SoonItem[]; note?: ReactNode }) {
  return (
    <section
      data-region="soon"
      style={{
        width: "100%",
        height: 392,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 24,
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
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 22,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text)",
          }}
        >
          Snart
        </div>
        {note}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: 10,
          overflowY: "auto",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              lineHeight: 1.3,
              fontWeight: 400,
              color: "var(--text-muted)",
            }}
          >
            {SOON_EMPTY}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.date}-${item.title}-${index}`}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                width: "100%",
                flexShrink: 0,
              }}
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
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 16,
                    lineHeight: 1.15,
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
                    lineHeight: 1.15,
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
      </div>
    </section>
  );
}
