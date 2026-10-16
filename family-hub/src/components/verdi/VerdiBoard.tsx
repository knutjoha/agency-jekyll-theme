"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BasicEditor,
  CompleteWeekButton,
  CreateExtraButton,
  DraftEditor,
  ExtraCard,
  FieldLabel,
  PoolMark,
  SkipControl,
  UndoToast,
} from "@/components/verdi/VerdiEditors";
import { useCancelOnOutsidePress, useVerdiActions } from "@/components/verdi/use-verdi-actions";
import { people } from "@/data/fixture";
import type { Person } from "@/data/types";
import {
  POOL_ID,
  formatKr,
  shownNok,
  type VerdiDaughterId,
  type VerdiExtra,
  type VerdiWeek,
} from "@/lib/verdi/model";

type Lift = {
  extra: VerdiExtra;
  targetPersonId: VerdiDaughterId | null;
  left: number;
  top: number;
  width: number;
};

function personFor(id: VerdiDaughterId): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

export function VerdiBoard({ week: initial, persisted }: { week: VerdiWeek; persisted: boolean }) {
  const actions = useVerdiActions(initial, persisted);
  const { week, drafts, editingBasicId, basicTitle } = actions;
  const rootRef = useRef<HTMLDivElement>(null);
  const liftState = useRef<Lift | null>(null);
  const [lift, setLift] = useState<Lift | null>(null);
  useCancelOnOutsidePress(Boolean(actions.editingExtra || actions.draftPerson || editingBasicId), () => {
    if (actions.editingExtra) actions.cancelEditExtra(actions.editingExtra.id);
    if (actions.draftPerson) actions.cancelDraft(actions.draftPerson);
    if (editingBasicId) actions.cancelBasic();
  });

  function trackDrag(event: PointerEvent) {
    const drag = liftState.current;
    const root = rootRef.current;
    if (!drag || !root) return;
    const rect = root.getBoundingClientRect();
    const left = event.clientX - rect.left - drag.width / 2;
    const top = event.clientY - rect.top - 24;
    const floater = root.querySelector("[data-lift]") as HTMLElement | null;
    if (floater) floater.style.pointerEvents = "none";
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (floater) floater.style.pointerEvents = "";
    const owner = hit?.closest("[data-person]")?.getAttribute("data-person") ?? null;
    const targetPersonId = owner && owner !== POOL_ID ? (owner as VerdiDaughterId) : null;
    const next = { ...drag, left, top, targetPersonId };
    liftState.current = next;
    setLift(next);
  }

  function finishDrag() {
    const drag = liftState.current;
    liftState.current = null;
    setLift(null);
    if (!drag?.targetPersonId) return;
    actions.claimExtra(drag.extra.id, drag.targetPersonId);
  }

  function startLift(event: ReactPointerEvent<HTMLButtonElement>, extra: VerdiExtra) {
    if (week.locked || extra.editing) return;
    event.preventDefault();
    const root = rootRef.current;
    if (!root) return;
    const card = event.currentTarget.closest("[data-extra]") as HTMLElement | null;
    const cardRect = card?.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const width = cardRect?.width ?? 200;
    const next: Lift = {
      extra,
      targetPersonId: null,
      width,
      left: (cardRect?.left ?? event.clientX) - rootRect.left,
      top: (cardRect?.top ?? event.clientY) - rootRect.top,
    };
    liftState.current = next;
    setLift(next);
    const move = (pointer: PointerEvent) => trackDrag(pointer);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      finishDrag();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    trackDrag(event.nativeEvent);
  }

  function extraHandlers(extra: VerdiExtra) {
    return {
      extra,
      locked: week.locked,
      onOpen: () => actions.beginEditExtra(extra.id),
      onTitle: (title: string) => actions.setExtra(extra.id, { title }),
      onAmount: (amount: string) => {
        const amountNok = Number(amount);
        actions.setExtra(extra.id, { amountNok: Number.isSafeInteger(amountNok) ? amountNok : extra.amountNok });
      },
      onSave: () => actions.saveExtra(extra),
      onDelete: () => actions.deleteExtra(extra.id),
    };
  }

  const poolDraft = drafts[POOL_ID];
  const targetId = lift?.targetPersonId ?? null;

  return (
    <section
      data-region="verdi"
      data-week={week.week}
      data-locked={week.locked ? "true" : undefined}
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "0 4px",
          boxSizing: "border-box",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14, minWidth: 0, flex: "1 1 auto" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontSize: 24,
              lineHeight: "normal",
              fontWeight: 400,
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            Verdi
          </h1>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Uke {week.weekNumber} · {week.period}
          </div>
        </div>
        <CompleteWeekButton locked={week.locked} onComplete={actions.completeWeek} />
      </div>
      <div
        ref={rootRef}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: 16,
          alignItems: "stretch",
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        {week.lanes.map((lane) => {
          const person = personFor(lane.personId);
          const draft = drafts[lane.personId];
          const shown = shownNok(lane.skips, lane.extras);
          const dropTarget = targetId === lane.personId;
          return (
            <section
              key={lane.personId}
              data-person={lane.personId}
              data-drop={dropTarget ? "true" : undefined}
              style={{
                flex: "1 1 180px",
                minWidth: 180,
                minHeight: 0,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 12,
                overflow: "hidden",
                background: "var(--tile)",
                borderRadius: "var(--r-tile)",
                outline: dropTarget ? "1.5px solid var(--accent)" : "none",
                outlineOffset: dropTarget ? -0.75 : undefined,
              }}
            >
              <header
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 4,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--r-full)",
                    background: `var(${person.colorToken})`,
                    fontFamily: "var(--font-heading)",
                    fontSize: 15,
                    color: "var(--ink)",
                  }}
                >
                  {person.initial}
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-heading)",
                    fontSize: 17,
                    color: "var(--text)",
                  }}
                >
                  {person.name}
                </div>
                <div
                  data-shown={shown}
                  style={{
                    flexShrink: 0,
                    fontFamily: "var(--font-data)",
                    fontSize: 15,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatKr(shown)}
                </div>
              </header>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", flex: 1, minHeight: 0, overflowY: "auto" }}>
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
                          background: "var(--tile-2)",
                          borderRadius: "var(--r-nested)",
                          outline: "1.5px solid var(--accent)",
                          outlineOffset: -0.75,
                        }}
                      >
                        <BasicEditor title={basicTitle} onTitle={actions.setBasicTitle} onSave={actions.saveBasic} />
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
                          padding: "10px 12px",
                          border: "none",
                          background: "var(--tile-2)",
                          borderRadius: "var(--r-nested)",
                          color: "var(--text)",
                          fontFamily: "var(--font-body)",
                          fontSize: 14,
                          cursor: week.locked ? "default" : "pointer",
                        }}
                      >
                        {basic.title}
                      </button>
                    ),
                  )}
                </div>
                <SkipControl
                  skips={lane.skips}
                  locked={week.locked}
                  onMinus={() => actions.setSkips(lane.personId, -1)}
                  onPlus={() => actions.setSkips(lane.personId, 1)}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FieldLabel>Ekstra</FieldLabel>
                  {lane.extras.map((extra) => (
                    <ExtraCard key={extra.id} {...extraHandlers(extra)} onToggleDone={() => actions.toggleDone(extra.id)} />
                  ))}
                  {draft ? (
                    <DraftEditor
                      draft={draft}
                      onTitle={(title) => actions.setDraft(lane.personId, { title })}
                      onAmount={(amount) => actions.setDraft(lane.personId, { amount })}
                      onSave={() => actions.saveDraft(lane.personId)}
                    />
                  ) : week.locked ? null : (
                    <CreateExtraButton label="Ny ekstra" onClick={() => actions.openDraft(lane.personId)} />
                  )}
                </div>
              </div>
            </section>
          );
        })}
        <section
          data-person={POOL_ID}
          style={{
            flex: "1 1 180px",
            minWidth: 180,
            minHeight: 0,
            height: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 12,
            overflow: "hidden",
            background: "var(--tile)",
            borderRadius: "var(--r-tile)",
          }}
        >
          <header
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 4,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <PoolMark size={30} />
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-heading)", fontSize: 17, color: "var(--text)" }}>Ledige</div>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", flex: 1, minHeight: 0, overflowY: "auto" }}>
            <FieldLabel>Ekstra</FieldLabel>
            {week.pool.map((extra) => (
              <ExtraCard
                key={extra.id}
                {...extraHandlers(extra)}
                pool
                dragging={lift?.extra.id === extra.id}
                onGrip={(event) => startLift(event, extra)}
              />
            ))}
            {poolDraft ? (
              <DraftEditor
                draft={poolDraft}
                onTitle={(title) => actions.setDraft(POOL_ID, { title })}
                onAmount={(amount) => actions.setDraft(POOL_ID, { amount })}
                onSave={() => actions.saveDraft(POOL_ID)}
              />
            ) : week.locked ? null : (
              <CreateExtraButton label="Ny ekstra" onClick={() => actions.openDraft(POOL_ID)} />
            )}
          </div>
        </section>
        {lift ? (
          <div
            data-lift="true"
            style={{
              position: "absolute",
              left: lift.left,
              top: lift.top,
              width: lift.width,
              zIndex: 6,
              pointerEvents: "none",
              transform: "rotate(-1.5deg)",
              boxShadow: "0 10px 28px #000000A6",
              borderRadius: "var(--r-nested)",
            }}
          >
            <ExtraCard extra={lift.extra} locked pool />
          </div>
        ) : null}
      </div>
      {actions.removed ? <UndoToast removed={actions.removed} onUndo={actions.undo} /> : null}
    </section>
  );
}
