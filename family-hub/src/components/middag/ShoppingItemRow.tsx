"use client";

import { Check, X } from "lucide-react";
import type { GroceryItem } from "@/data/types";

export function ShoppingItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div data-item={item.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 11, padding: "3px 0", width: "100%" }}>
      <button
        type="button"
        aria-pressed={Boolean(item.done)}
        aria-label={item.done ? `Merk ${item.name} som ikke kjøpt` : `Kjøp ${item.name}`}
        onClick={() => onToggle(item.id)}
        data-check-item={item.id}
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          background: item.done ? "var(--ok)" : "transparent",
          outline: item.done ? "none" : "1.5px solid var(--text-muted)",
          outlineOffset: item.done ? undefined : -0.75,
        }}
      >
        {item.done ? <Check size={13} color="var(--ink)" strokeWidth={2.5} /> : null}
      </button>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          overflowWrap: "anywhere",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: "normal",
          fontWeight: 400,
          color: item.done ? "var(--text-muted)" : "var(--text)",
        }}
      >
        {item.name}
      </div>
      <div style={{ fontFamily: "var(--font-data)", fontSize: 12, lineHeight: "normal", fontWeight: 400, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {item.quantity}
      </div>
      <button
        type="button"
        data-remove-item={item.id}
        aria-label={`Fjern ${item.name}`}
        onClick={() => onRemove(item.id)}
        style={removeButton}
      >
        <X size={14} color="var(--text-muted)" strokeWidth={2} />
      </button>
    </div>
  );
}

const removeButton = {
  width: 44,
  height: 44,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "var(--text-muted)",
};
