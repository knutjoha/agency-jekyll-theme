"use client";

import { Minus, Plus, Trash2, Undo2 } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { ExtraDraft, RemovedExtra } from "@/components/verdi/use-verdi-actions";
import { extraDraftValid, skipLabel } from "@/lib/verdi/model";

const DELETE_BG = "#3A1C1C";
const DELETE_FG = "#FF6B6B";

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
} as const;

export function FieldLabel({ children }: { children: string }) {
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

export function SkipControl({
  skips,
  locked,
  onMinus,
  onPlus,
}: {
  skips: number;
  locked: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const atZero = skips <= 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <FieldLabel>Hoppet over</FieldLabel>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
        <RoundButton label="Minus" disabled={locked || atZero} onClick={onMinus}>
          <Minus size={16} color={locked || atZero ? "var(--text-muted)" : "var(--text)"} />
        </RoundButton>
        <div
          data-skip={skips}
          style={{
            minWidth: 48,
            textAlign: "center",
            fontFamily: "var(--font-data)",
            fontSize: 18,
            color: skips > 0 ? "var(--accent)" : "var(--text)",
          }}
        >
          {skipLabel(skips)}
        </div>
        <RoundButton label="Pluss" disabled={locked} onClick={onPlus}>
          <Plus size={16} color={locked ? "var(--text-muted)" : "var(--text)"} />
        </RoundButton>
      </div>
    </div>
  );
}

function RoundButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        padding: 0,
        border: "none",
        borderRadius: "var(--r-full)",
        background: "var(--tile-2)",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function CreateExtraButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        height: 46,
        flexShrink: 0,
        display: "flex",
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        alignItems: "center",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        outline: "1.5px solid color-mix(in srgb, var(--text) 14%, transparent)",
        outlineOffset: -0.75,
        borderRadius: "var(--r-nested)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1,
        fontWeight: 400,
        color: "var(--text-muted)",
      }}
    >
      <Plus size={18} color="var(--text-muted)" />
      {label}
    </button>
  );
}

export function ExtraEditor({
  title,
  amount,
  amountNok,
  onTitle,
  onAmount,
  onSave,
  onDelete,
  phone,
  canSave,
}: {
  title: string;
  amount?: string;
  amountNok?: number;
  onTitle: (title: string) => void;
  onAmount: (amount: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  phone?: boolean;
  canSave: boolean;
}) {
  const value = amount ?? (amountNok != null ? String(amountNok) : "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Oppgave</FieldLabel>
        <TitleInput value={title} onChange={onTitle} onSave={canSave ? onSave : undefined} autoFocus fontSize={phone ? 15 : 14} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Beløp</FieldLabel>
        <AmountInput value={value} onChange={onAmount} onSave={canSave ? onSave : undefined} fontSize={phone ? 15 : 14} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
        {onDelete ? <DeletePill onClick={onDelete} /> : <span />}
        <button type="button" className="pill-primary" disabled={!canSave} onClick={onSave} style={{ ...savePill, opacity: canSave ? 1 : 0.45 }}>
          Lagre
        </button>
      </div>
    </div>
  );
}

export function BasicEditor({
  title,
  onTitle,
  onSave,
  phone,
}: {
  title: string;
  onTitle: (title: string) => void;
  onSave: () => void;
  phone?: boolean;
}) {
  const canSave = Boolean(title.trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Oppgave</FieldLabel>
        <TitleInput value={title} onChange={onTitle} onSave={canSave ? onSave : undefined} autoFocus fontSize={phone ? 15 : 14} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="pill-primary" disabled={!canSave} onClick={onSave} style={{ ...savePill, opacity: canSave ? 1 : 0.45 }}>
          Lagre
        </button>
      </div>
    </div>
  );
}

export function DraftEditor({
  draft,
  onTitle,
  onAmount,
  onSave,
  phone,
}: {
  draft: ExtraDraft;
  onTitle: (title: string) => void;
  onAmount: (amount: string) => void;
  onSave: () => void;
  phone?: boolean;
}) {
  return (
    <article
      data-draft="true"
      data-verdi-editor="true"
      style={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        padding: 12,
        background: phone ? "var(--tile)" : "var(--tile-2)",
        borderRadius: "var(--r-nested)",
        outline: "1.5px solid var(--accent)",
        outlineOffset: -0.75,
      }}
    >
      <ExtraEditor
        title={draft.title}
        amount={draft.amount}
        onTitle={onTitle}
        onAmount={onAmount}
        onSave={onSave}
        phone={phone}
        canSave={extraDraftValid(draft.title, draft.amount)}
      />
    </article>
  );
}

function TitleInput({
  value,
  onChange,
  onSave,
  fontSize,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  fontSize: number;
  autoFocus?: boolean;
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = fieldRef.current;
    if (!node || !autoFocus || node.getClientRects().length === 0) return;
    node.focus({ preventScroll: true });
  }, [autoFocus]);
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
            onSave?.();
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
        }}
      />
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  onSave,
  fontSize,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  fontSize: number;
}) {
  return (
    <input
      aria-label="Beløp"
      inputMode="numeric"
      value={value}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onSave?.();
        }
      }}
      style={{
        width: "100%",
        boxSizing: "border-box",
        height: 44,
        padding: "10px 14px",
        border: "none",
        borderRadius: "var(--r-nested)",
        background: "var(--tile-3)",
        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--text) 12%, transparent)",
        outline: "none",
        color: "var(--text)",
        caretColor: "var(--accent)",
        fontFamily: "var(--font-data)",
        fontSize,
      }}
    />
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

export function CompleteWeekButton({ locked, onComplete }: { locked: boolean; onComplete: () => void }) {
  if (locked) {
    return (
      <div
        data-locked="true"
        style={{
          padding: "9px 16px",
          borderRadius: "var(--r-full)",
          background: "var(--tile-2)",
          color: "var(--text-muted)",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          lineHeight: "normal",
          whiteSpace: "nowrap",
        }}
      >
        Uken er låst
      </div>
    );
  }
  return (
    <button type="button" className="pill-primary" onClick={onComplete} style={{ ...savePill, padding: "9px 18px", fontSize: 14 }}>
      Fullfør uke
    </button>
  );
}

export function UndoToast({
  removed,
  onUndo,
  phone,
}: {
  removed: RemovedExtra;
  onUndo: () => void;
  phone?: boolean;
}) {
  return (
    <div
      role="status"
      data-toast={phone ? "phone" : "board"}
      style={
        phone
          ? {
              position: "fixed",
              left: 16,
              right: 16,
              bottom: "calc(60px + env(safe-area-inset-bottom))",
              zIndex: 30,
              height: 56,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "0 14px",
              background: "var(--tile-2)",
              borderRadius: 12,
              boxShadow: "0 8px 24px #000000A6",
            }
          : {
              position: "absolute",
              left: "50%",
              bottom: 8,
              transform: "translateX(-50%)",
              zIndex: 8,
              width: 380,
              maxWidth: "calc(100% - 32px)",
              height: 58,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "0 16px",
              background: "var(--tile-2)",
              borderRadius: 12,
              boxShadow: "0 10px 28px #000000A6",
            }
      }
    >
      <Trash2 size={phone ? 16 : 17} color="var(--text-muted)" />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-body)",
          fontSize: phone ? 14 : 15,
          color: "var(--text)",
        }}
      >
        «{removed.extra.title}» {phone ? "slettet" : "ble slettet"}
      </span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          flexShrink: 0,
          padding: phone ? "8px 13px" : "9px 15px",
          border: "none",
          borderRadius: "var(--r-full)",
          background: "var(--tile-3)",
          color: "var(--accent)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: phone ? 13 : 14,
        }}
      >
        <Undo2 size={phone ? 14 : 15} color="var(--accent)" />
        Angre
      </button>
    </div>
  );
}
