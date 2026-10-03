import { CarFront, TriangleAlert } from "lucide-react";
import type { Transport } from "@/data/types";

export function TransportPill({ transport }: { transport: Transport }) {
  const missing = transport.kind === "missing";
  const color = missing ? "var(--accent)" : "var(--text-2)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: "11px 16px",
        borderRadius: "var(--r-full)",
        background: missing ? "var(--warn-bg)" : "var(--tile-3)",
      }}
    >
      {missing ? <TriangleAlert size={20} color={color} /> : <CarFront size={20} color={color} />}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          lineHeight: 1,
          fontWeight: 400,
          color,
          whiteSpace: "nowrap",
        }}
      >
        {transport.label}
      </span>
    </div>
  );
}
