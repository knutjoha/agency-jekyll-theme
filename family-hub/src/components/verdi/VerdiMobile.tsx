"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import {
  BasicEditor,
  CompleteWeekButton,
  CreateExtraButton,
  DraftEditor,
  ExtraEditor,
  FieldLabel,
  SkipControl,
  UndoToast,
} from "@/components/verdi/VerdiEditors";
import { useCancelOnOutsidePress, useVerdiActions } from "@/components/verdi/use-verdi-actions";
import { people } from "@/data/fixture";
import type { Person, WeatherView } from "@/data/types";
import type { OsloNow } from "@/lib/oslo";
import { extraDraftValid, formatKr, shownNok, type VerdiDaughterId, type VerdiExtra, type VerdiWeek } from "@/lib/verdi/model";

const ACTION = 84;
const GAP = 8;
const DELETE_BG = "#3A1C1C";
const DELETE_FG = "#FF6B6B";

function personFor(id: VerdiDaughterId): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

function shortName(name: string): string {
  return name.split(" ")[0] ?? name;
}

export function VerdiMobile({
  clock,
  weather,
  week: initial,
  persisted,
}: {
  clock: OsloNow;
  weather: WeatherView;
  week: VerdiWeek;
  persisted: boolean;
}) {
  const [selectedId, setSelectedId] = useState<VerdiDaughterId>("amelia");
  const actions = useVerdiActions(initial, persisted);
  const { week, drafts, editingBasicId, basicTitle } = actions;
  const selected = week.lanes.find((lane) => lane.personId === selectedId) ?? week.lanes[0];
  const person = personFor(selected.personId);
  const draft = drafts[selected.personId];
  const editingExtra = selected.extras.find((extra) => extra.editing);
  useCancelOnOutsidePress(Boolean(editingExtra || draft || editingBasicId), () => {
    if (editingExtra) actions.cancelEditExtra(editingExtra.id);
    if (draft) actions.cancelDraft(selected.personId);
    if (editingBasicId) actions.cancelBasic();
  });

  return (
    <div
      data-region="verdi-mobile"
      data-week={week.week}
      data-locked={week.locked ? "true" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: actions.removed ? "16px 16px 80px" : "16px 16px 12px",
        boxSizing: "border-box",
      }}
    >
      <PhoneHeader clock={clock} weather={weather} />

      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--text)", minWidth: 0 }}>
          Verdi · Uke {week.weekNumber}
        </div>
        <CompleteWeekButton locked={week.locked} onComplete={actions.completeWeek} />
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>{week.period}</div>

      <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
        {week.lanes.map((lane) => {
          const member = personFor(lane.personId);
          const selectedPerson = lane.personId === selected.personId;
          const label = shortName(member.name);
          const shown = shownNok(lane.skips, lane.extras);
          return (
            <button
              key={lane.personId}
              type="button"
              data-person={lane.personId}
              aria-pressed={selectedPerson}
              aria-label={`${label} ${shown}`}
              onClick={() => {
                actions.closeReveal();
                setSelectedId(lane.personId);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--r-full)",
                  background: `var(${member.colorToken})`,
                  outline: selectedPerson ? "2px solid var(--accent)" : "none",
                  outlineOffset: selectedPerson ? -1 : undefined,
                  fontFamily: "var(--font-heading)",
                  fontSize: 18,
                  color: "var(--ink)",
                }}
              >
                {member.initial}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: selectedPerson ? "var(--text)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {label} {shown}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 2px 0" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--text)", minWidth: 0 }}>{person.name}</div>
        <div data-shown={shownNok(selected.skips, selected.extras)} style={{ fontFamily: "var(--font-data)", fontSize: 16, color: "var(--text)", whiteSpace: "nowrap" }}>
          {formatKr(shownNok(selected.skips, selected.extras))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Faste oppgaver</FieldLabel>
        {week.basics.map((basic) =>
          editingBasicId === basic.id ? (
            <article
              key={basic.id}
              data-verdi-editor="true"
              data-basic={basic.id}
              style={{
                padding: 12,
                background: "var(--tile)",
                borderRadius: "var(--r-nested)",
                outline: "1.5px solid var(--accent)",
                outlineOffset: -0.75,
              }}
            >
              <BasicEditor phone title={basicTitle} onTitle={actions.setBasicTitle} onSave={actions.saveBasic} />
            </article>
          ) : (
            <button
              key={basic.id}
              type="button"
              data-basic={basic.id}
              onClick={() => actions.beginEditBasic(basic.id)}
              disabled={week.locked}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px",
                border: "none",
                background: "var(--tile)",
                borderRadius: "var(--r-nested)",
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: 15,
                cursor: week.locked ? "default" : "pointer",
              }}
            >
              {basic.title}
            </button>
          ),
        )}
      </div>

      <SkipControl
        skips={selected.skips}
        locked={week.locked}
        onMinus={() => actions.setSkips(selected.personId, -1)}
        onPlus={() => actions.setSkips(selected.personId, 1)}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Ekstra</FieldLabel>
        {selected.extras.map((extra) => {
          const card = (
            <ExtraCard
              extra={extra}
              locked={week.locked}
              onOpen={() => actions.beginEditExtra(extra.id)}
              onTitle={(title) => actions.setExtra(extra.id, { title })}
              onAmount={(amount) => {
                const amountNok = Number(amount);
                actions.setExtra(extra.id, { amountNok: Number.isSafeInteger(amountNok) ? amountNok : extra.amountNok });
              }}
              onSave={() => actions.saveExtra(extra)}
              onDelete={() => actions.deleteExtra(extra.id)}
            />
          );
          if (extra.editing || week.locked) return <div key={extra.id}>{card}</div>;
          return (
            <SwipeRow
              key={extra.id}
              open={actions.revealedId === extra.id}
              onOpenChange={(open) => (open ? actions.reveal(extra.id) : actions.closeReveal())}
              onDelete={() => actions.deleteExtra(extra.id)}
            >
              {card}
            </SwipeRow>
          );
        })}
        {draft ? (
          <DraftEditor
            phone
            draft={draft}
            onTitle={(title) => actions.setDraft(selected.personId, { title })}
            onAmount={(amount) => actions.setDraft(selected.personId, { amount })}
            onSave={() => actions.saveDraft(selected.personId)}
          />
        ) : week.locked ? null : (
          <CreateExtraButton label={`Ny ekstra til ${shortName(person.name)}`} onClick={() => actions.openDraft(selected.personId)} />
        )}
      </div>

      {editingExtra || draft || editingBasicId ? (
        <div
          aria-hidden
          data-edit-spacer="true"
          style={{
            height: "calc(100dvh - env(safe-area-inset-bottom, 0px) - 72px)",
            flexShrink: 0,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {actions.removed ? <UndoToast phone removed={actions.removed} onUndo={actions.undo} /> : null}
    </div>
  );
}

function ExtraCard({
  extra,
  locked,
  onOpen,
  onTitle,
  onAmount,
  onSave,
  onDelete,
}: {
  extra: VerdiExtra;
  locked: boolean;
  onOpen: () => void;
  onTitle: (title: string) => void;
  onAmount: (amount: string) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const editing = Boolean(extra.editing);
  return (
    <article
      data-extra={extra.id}
      data-verdi-editor={editing ? "true" : undefined}
      onClick={() => {
        if (!editing && !locked) onOpen();
      }}
      style={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        padding: 12,
        background: "var(--tile)",
        borderRadius: "var(--r-nested)",
        outline: editing ? "1.5px solid var(--accent)" : "none",
        outlineOffset: editing ? -0.75 : undefined,
        cursor: editing || locked ? "auto" : "pointer",
      }}
    >
      {editing ? (
        <ExtraEditor
          phone
          title={extra.title}
          amountNok={extra.amountNok}
          onTitle={onTitle}
          onAmount={onAmount}
          onSave={onSave}
          onDelete={onDelete}
          canSave={extraDraftValid(extra.title, String(extra.amountNok))}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 11, width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text)" }}>{extra.title}</div>
          <div style={{ flexShrink: 0, fontFamily: "var(--font-data)", fontSize: 14, color: "var(--text-2)" }}>{formatKr(extra.amountNok)}</div>
        </div>
      )}
    </article>
  );
}

function SwipeRow({
  open,
  onOpenChange,
  onDelete,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const [width, setWidth] = useState(open ? ACTION : 0);
  const [dragging, setDragging] = useState(false);
  const widthRef = useRef(width);
  const drag = useRef<{ id: number; x: number; y: number; origin: number; axis: "x" | "y" | null } | null>(null);
  const suppress = useRef(false);

  function setReveal(next: number) {
    widthRef.current = next;
    setWidth(next);
  }

  useEffect(() => {
    if (!dragging) setReveal(open ? ACTION : 0);
  }, [open, dragging]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, a")) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: widthRef.current, axis: null };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (state.axis === "y") return;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (state.axis !== "x") return;
    setReveal(Math.min(ACTION, Math.max(0, state.origin - dx)));
  }

  function finish(event: { pointerId: number }) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    if (state.axis !== "x") return;
    suppress.current = true;
    window.setTimeout(() => {
      suppress.current = false;
    }, 350);
    const snap = widthRef.current > ACTION / 2;
    setDragging(false);
    setReveal(snap ? ACTION : 0);
    onOpenChange(snap);
  }

  return (
    <div
      data-revealed={open ? "true" : undefined}
      style={{ display: "flex", alignItems: "stretch", touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClickCapture={(event) => {
        if (!suppress.current) return;
        suppress.current = false;
        const target = event.target as HTMLElement;
        if (target.closest("[data-swipe-delete]")) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</div>
      <div
        style={{
          width,
          marginLeft: width > 0 ? GAP : 0,
          overflow: "hidden",
          flexShrink: 0,
          transition: dragging ? "none" : "width 160ms ease, margin-left 160ms ease",
        }}
      >
        <button
          type="button"
          aria-label="Slett"
          data-swipe-delete="true"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          style={{
            width: ACTION,
            height: "100%",
            border: "none",
            borderRadius: 12,
            background: DELETE_BG,
            color: DELETE_FG,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Trash2 size={19} color={DELETE_FG} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1, color: DELETE_FG }}>Slett</span>
        </button>
      </div>
    </div>
  );
}
