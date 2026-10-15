"use client";

import { Check, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { FristPicker } from "@/components/todo/FristPicker";
import { addIsoDays } from "@/lib/calendar-view";

const DELETE_BG = "#3A1C1C";
const DELETE_FG = "#FF6B6B";

export function TodoEditor({
  title,
  dueOn,
  today,
  pickerOpen,
  onTitle,
  onDue,
  onPicker,
  onClear,
  onSave,
  onDelete,
  onReserve,
  autoFocus,
  phone,
}: {
  title: string;
  dueOn: string | null;
  today: string;
  pickerOpen: boolean;
  onTitle: (title: string) => void;
  onDue: (dueOn: string) => void;
  onPicker: (open: boolean) => void;
  onClear: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onReserve?: (height: number) => void;
  autoFocus?: boolean;
  phone?: boolean;
}) {
  const tomorrow = addIsoDays(today, 1);
  const titleSize = phone ? 15 : 14;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <FieldLabel>Oppgave</FieldLabel>
        <TitleInput
          value={title}
          onChange={onTitle}
          onSave={onSave}
          fontSize={titleSize}
          autoFocus={autoFocus}
          preventScroll={phone}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <FieldLabel>Frist</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, width: "100%" }}>
          <Shortcut
            label="I dag"
            selected={dueOn === today}
            onClick={() => {
              onDue(today);
              onPicker(false);
            }}
          />
          <Shortcut
            label="I morgen"
            selected={dueOn === tomorrow}
            onClick={() => {
              onDue(tomorrow);
              onPicker(false);
            }}
          />
          <FristPicker
            iconOnly
            dueOn={dueOn}
            today={today}
            open={pickerOpen}
            onOpenChange={onPicker}
            onChange={onDue}
            onClear={onClear}
            onReserve={onReserve}
            shortcutDates={[today, tomorrow]}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
        {onDelete ? <DeletePill onClick={onDelete} /> : <span />}
        <button
          type="button"
          className="pill-primary"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          style={savePill}
        >
          Lagre
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 11,
        lineHeight: 1,
        fontWeight: 400,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function TitleInput({
  value,
  onChange,
  onSave,
  fontSize,
  autoFocus,
  preventScroll,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  fontSize: number;
  autoFocus?: boolean;
  preventScroll?: boolean;
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = fieldRef.current;
    if (!node || !autoFocus || node.getClientRects().length === 0) return;
    node.focus({ preventScroll: Boolean(preventScroll) });
  }, [autoFocus, preventScroll]);
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        minHeight: 44,
        padding: "10px 14px",
        background: "var(--tile-3)",
        borderRadius: "var(--r-nested)",
        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--text) 12%, transparent)",
      }}
    >
      <span
        aria-hidden
        style={{
          visibility: "hidden",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          display: "block",
          fontFamily: "var(--font-body)",
          fontSize,
          lineHeight: 1.3,
          fontWeight: 400,
        }}
      >
        {value || " "}
      </span>
      <textarea
        ref={fieldRef}
        aria-label="Oppgave"
        value={value}
        rows={1}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          margin: 0,
          padding: "10px 14px",
          border: "none",
          resize: "none",
          overflow: "hidden",
          outline: "none",
          background: "transparent",
          caretColor: "var(--accent)",
          color: "var(--text)",
          fontFamily: "var(--font-body)",
          fontSize,
          lineHeight: 1.3,
          fontWeight: 400,
        }}
      />
    </div>
  );
}

function Shortcut({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={selected ? "pill-primary" : "pill-ghost"}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{
        flexShrink: 0,
        padding: "8px 14px",
        border: "none",
        borderRadius: "var(--r-full)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        lineHeight: "normal",
        fontWeight: 400,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function DeletePill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flexShrink: 0,
        padding: "9px 14px",
        border: "none",
        borderRadius: "var(--r-full)",
        background: DELETE_BG,
        color: DELETE_FG,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        lineHeight: "normal",
        fontWeight: 400,
      }}
    >
      <Trash2 size={14} color={DELETE_FG} />
      Slett
    </button>
  );
}

const savePill = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  padding: "9px 16px",
  border: "none",
  borderRadius: "var(--r-full)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: "normal",
  fontWeight: 400,
};

export function CheckBox({
  done,
  label,
  onToggle,
}: {
  done: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={done ? `Merk ${label} som åpen` : `Fullfør ${label}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      style={{
        width: 22,
        height: 22,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        background: done ? "var(--ok)" : "transparent",
        outline: done ? "none" : "1.5px solid var(--text-muted)",
        outlineOffset: done ? undefined : -0.75,
      }}
    >
      {done ? <Check size={12} color="var(--ink)" strokeWidth={2.5} /> : null}
    </button>
  );
}
