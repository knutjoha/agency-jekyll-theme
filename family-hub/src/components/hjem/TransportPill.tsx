import { CarFront, TriangleAlert } from "lucide-react";
import type { Transport } from "@/data/types";

export function TransportPill({
  transport,
  compact = false,
}: {
  transport: Transport;
  compact?: boolean;
}) {
  const missing = transport.kind === "missing";
  const color = missing ? "var(--accent)" : "var(--text-2)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 5 : 8,
        padding: compact ? "4px 9px" : "11px 16px",
        borderRadius: "var(--r-full)",
        background: missing ? "var(--warn-bg)" : "var(--tile-3)",
        flexShrink: 0,
      }}
    >
      {missing ? (
        <TriangleAlert size={compact ? 13 : 20} color={color} />
      ) : (
        <CarFront size={compact ? 13 : 20} color={color} />
      )}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: compact ? 12 : 16,
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
