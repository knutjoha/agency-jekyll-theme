"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addIsoDays } from "@/lib/calendar-view";
import type { OsloNow } from "@/lib/oslo";

export type IngredientDraft = {
  id: string;
  name: string;
  amount: string;
};

export type DinnerDraft = {
  dayId: string;
  mealId: string | null;
  title: string;
  minutes: string;
  ingredients: IngredientDraft[];
  saving: boolean;
  error: string | null;
};

export function dayIsToday(clock: OsloNow, week: string, index: number): boolean {
  const [day, month, year] = clock.numericDate.split(".");
  return addIsoDays(week, index) === `${year}-${month}-${day}`;
}

export function WeekButtons({
  enabled,
  onPrevious,
  onNext,
}: {
  enabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Forrige uke"
        aria-disabled={enabled ? undefined : true}
        onClick={enabled ? onPrevious : undefined}
        style={{ ...navButtonStyle, cursor: enabled ? "pointer" : "default" }}
      >
        <ChevronLeft size={20} color="var(--text-2)" />
      </button>
      <button
        type="button"
        aria-label="Neste uke"
        aria-disabled={enabled ? undefined : true}
        onClick={enabled ? onNext : undefined}
        style={{ ...navButtonStyle, cursor: enabled ? "pointer" : "default" }}
      >
        <ChevronRight size={20} color="var(--text-2)" />
      </button>
    </div>
  );
}

export function DinnerEditor({
  variant,
  draft,
  weekday,
  onChange,
  onClose,
  onSave,
}: {
  variant: "dialog" | "sheet";
  draft: DinnerDraft;
  weekday: string;
  onChange: (draft: DinnerDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (variant !== "dialog") return;
    const root = dialogRef.current;
    if (!root) return;
    const selector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab" || !root) return;
      const nodes = [...root.querySelectorAll<HTMLElement>(selector)].filter((node) => !node.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    root.addEventListener("keydown", trap);
    return () => root.removeEventListener("keydown", trap);
  }, [variant, draft.ingredients.length]);

  const fields = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.saving) onSave();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <label style={labelStyle}>
        Rett
        <input
          aria-label="Rett"
          autoFocus
          disabled={draft.saving}
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value, error: null })}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        Minutter
        <input
          aria-label="Minutter"
          inputMode="numeric"
          disabled={draft.saving}
          value={draft.minutes}
          onChange={(event) => onChange({ ...draft, minutes: event.target.value, error: null })}
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {draft.ingredients.map((ingredient, index) => (
          <div key={ingredient.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input
              aria-label={`Ingrediens ${index + 1}`}
              disabled={draft.saving}
              value={ingredient.name}
              onChange={(event) =>
                onChange({
                  ...draft,
                  error: null,
                  ingredients: draft.ingredients.map((row) =>
                    row.id === ingredient.id ? { ...row, name: event.target.value } : row,
                  ),
                })
              }
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              aria-label={`Mengde ${index + 1}`}
              disabled={draft.saving}
              value={ingredient.amount}
              onChange={(event) =>
                onChange({
                  ...draft,
                  error: null,
                  ingredients: draft.ingredients.map((row) =>
                    row.id === ingredient.id ? { ...row, amount: event.target.value } : row,
                  ),
                })
              }
              style={{ ...inputStyle, width: 96, flexShrink: 0 }}
            />
            <button
              type="button"
              disabled={draft.saving}
              onClick={() =>
                onChange({
                  ...draft,
                  ingredients: draft.ingredients.filter((row) => row.id !== ingredient.id),
                })
              }
              style={ghostPill}
            >
              Fjern
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={draft.saving}
          onClick={() =>
            onChange({
              ...draft,
              ingredients: [...draft.ingredients, { id: crypto.randomUUID(), name: "", amount: "" }],
            })
          }
          style={{ ...ghostPill, alignSelf: "flex-start" }}
        >
          Legg til ingrediens
        </button>
      </div>
      {draft.error ? (
        <div role="alert" style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.3, color: "var(--accent)" }}>
          {draft.error}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onClose} style={ghostPill}>
          Avbryt
        </button>
        <button type="submit" disabled={draft.saving} style={{ ...savePill, opacity: draft.saving ? 0.6 : 1 }}>
          Lagre
        </button>
      </div>
    </form>
  );

  const heading = (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div id={`dinner-editor-title-${variant}`} style={headingStyle}>
        {weekday}
      </div>
      <button type="button" onClick={onClose} style={ghostPill}>
        Lukk
      </button>
    </div>
  );

  if (variant === "sheet") {
    return (
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`dinner-editor-title-${variant}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 14,
          borderRadius: "var(--r-tile)",
          background: "var(--tile)",
        }}
      >
        {heading}
        {fields}
      </section>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#00000080",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`dinner-editor-title-${variant}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 480,
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 20,
          borderRadius: "var(--r-tile)",
          background: "var(--tile)",
        }}
      >
        {heading}
        {fields}
      </div>
    </div>
  );
}

const navButtonStyle = {
  width: 44,
  height: 44,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--tile-2)",
  color: "var(--text-2)",
};

const headingStyle = {
  fontFamily: "var(--font-heading)",
  fontSize: 20,
  lineHeight: 1.1,
  fontWeight: 400,
  color: "var(--text)",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: 1.2,
  color: "var(--text-muted)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border: "none",
  borderRadius: "var(--r-nested)",
  background: "var(--tile-2)",
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  lineHeight: 1.2,
};

const pillBase = {
  padding: "8px 14px",
  border: "none",
  borderRadius: "var(--r-full)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: "normal",
  fontWeight: 400,
  whiteSpace: "nowrap" as const,
};

const ghostPill = {
  ...pillBase,
  background: "var(--tile-3)",
  color: "var(--text-2)",
};

const savePill = {
  ...pillBase,
  background: "var(--accent)",
  color: "var(--ink)",
};
