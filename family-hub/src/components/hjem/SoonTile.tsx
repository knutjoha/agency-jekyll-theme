import type { SoonItem } from "@/data/types";

export function SoonTile({ items }: { items: SoonItem[] }) {
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
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          neste 6 uker
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        {items.map((item) => (
          <div
            key={`${item.date}-${item.title}`}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              width: "100%",
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
        ))}
      </div>
    </section>
  );
}
