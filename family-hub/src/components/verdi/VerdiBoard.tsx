"use client";

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
import type { Person } from "@/data/types";
import { extraDraftValid, formatKr, shownNok, type VerdiDaughterId, type VerdiExtra, type VerdiWeek } from "@/lib/verdi/model";

function personFor(id: VerdiDaughterId): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

export function VerdiBoard({ week: initial, persisted }: { week: VerdiWeek; persisted: boolean }) {
  const actions = useVerdiActions(initial, persisted);
  const { week, drafts, editingBasicId, basicTitle } = actions;
  useCancelOnOutsidePress(Boolean(actions.editingExtra || actions.draftPerson || editingBasicId), () => {
    if (actions.editingExtra) actions.cancelEditExtra(actions.editingExtra.id);
    if (actions.draftPerson) actions.cancelDraft(actions.draftPerson);
    if (editingBasicId) actions.cancelBasic();
  });

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
        style={{
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
          return (
            <section
              key={lane.personId}
              data-person={lane.personId}
              style={{
                flex: "1 1 200px",
                minWidth: 200,
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
                <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-heading)", fontSize: 17, color: "var(--text)" }}>
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
                    <ExtraCard
                      key={extra.id}
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
      </div>
      {actions.removed ? <UndoToast removed={actions.removed} onUndo={actions.undo} /> : null}
    </section>
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
      role={editing || locked ? undefined : "button"}
      tabIndex={editing || locked ? undefined : 0}
      onClick={() => {
        if (!editing && !locked) onOpen();
      }}
      onKeyDown={(event) => {
        if (editing || locked) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      style={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        padding: 12,
        background: "var(--tile-2)",
        borderRadius: "var(--r-nested)",
        outline: editing ? "1.5px solid var(--accent)" : "none",
        outlineOffset: editing ? -0.75 : undefined,
        cursor: editing || locked ? "auto" : "pointer",
      }}
    >
      {editing ? (
        <ExtraEditor
          title={extra.title}
          amountNok={extra.amountNok}
          onTitle={onTitle}
          onAmount={onAmount}
          onSave={onSave}
          onDelete={onDelete}
          canSave={extraDraftValid(extra.title, String(extra.amountNok))}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 10, width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)" }}>{extra.title}</div>
          <div style={{ flexShrink: 0, fontFamily: "var(--font-data)", fontSize: 14, color: "var(--text-2)" }}>{formatKr(extra.amountNok)}</div>
        </div>
      )}
    </article>
  );
}
