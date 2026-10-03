import { ShoppingBasket } from "lucide-react";
import type { Dinner } from "@/data/types";

export function DinnerTile({ dinner }: { dinner: Dinner }) {
  return (
    <section
      data-region="dinner"
      style={{
        width: "100%",
        height: 160,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 24,
        borderRadius: "var(--r-tile)",
        background: "var(--tile)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          lineHeight: 1,
          fontWeight: 400,
          letterSpacing: 2,
          color: "var(--text-muted)",
        }}
      >
        MIDDAG I DAG
      </div>
      <div
        style={{
          width: "100%",
          fontFamily: "var(--font-heading)",
          fontSize: 27,
          lineHeight: 1.1,
          fontWeight: 400,
          color: "var(--text)",
        }}
      >
        {dinner.dish}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }}>
          {dinner.diets.map((diet) => (
            <div
              key={diet}
              style={{
                padding: "7px 12px",
                borderRadius: "var(--r-full)",
                background: "var(--tile-2)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--text-2)",
                whiteSpace: "nowrap",
              }}
            >
              {diet}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            borderRadius: "var(--r-full)",
            background: "var(--tile-3)",
          }}
        >
          <ShoppingBasket size={17} color="var(--text-2)" />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 400,
              color: "var(--text-2)",
              whiteSpace: "nowrap",
            }}
          >
            {dinner.shoppingCount} varer
          </span>
        </div>
      </div>
    </section>
  );
}
