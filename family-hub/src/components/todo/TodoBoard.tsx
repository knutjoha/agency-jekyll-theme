"use client";

import { Calendar, Check, Plus, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FristPicker } from "@/components/todo/FristPicker";
import { draftKey, useTodoActions } from "@/components/todo/use-todo-actions";
import { people } from "@/data/fixture";
import type { Person, PersonId, TodoFilter, TodoLane, TodoTask } from "@/data/types";
import { fristLabel, isOverdue } from "@/lib/frist";

const FILTERS: { id: TodoFilter; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "frist", label: "Med frist" },
  { id: "fullfort", label: "Fullførte" },
];

const DELETE_BG = "#3A1C1C";
const DELETE_FG = "#FF6B6B";

function personFor(id: PersonId): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

function matches(task: TodoTask, filter: TodoFilter): boolean {
  if (task.editing) return true;
  if (filter === "fullfort") return Boolean(task.done);
  if (filter === "frist") return Boolean(task.dueOn);
  return true;
}

export function TodoBoard({ lanes: initialLanes, persisted }: { lanes: TodoLane[]; persisted: boolean }) {
  const [filter, setFilter] = useState<TodoFilter>("alle");
  const actions = useTodoActions(initialLanes, persisted);
  const { lanes, drafts, pickerId, removed, today } = actions;
  const tasks = lanes.flatMap((lane) => lane.tasks);
  const openCount = tasks.filter((task) => !task.done).length;
  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <section
      data-region="todo"
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
            Oppgaver
          </h1>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: "normal",
              fontWeight: 400,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {openCount} åpne · {doneCount} fullført i dag
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.id)}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "var(--r-full)",
                  cursor: "pointer",
                  background: active ? "var(--tile-2)" : "transparent",
                  outline: active ? "none" : "1px solid color-mix(in srgb, var(--text) 8%, transparent)",
                  outlineOffset: active ? undefined : -0.5,
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  lineHeight: "normal",
                  fontWeight: 400,
                  color: active ? "var(--text)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
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
        {lanes.map((lane) => {
          const person = personFor(lane.personId);
          const visible = lane.tasks.filter((task) => matches(task, filter));
          const openInLane = lane.tasks.filter((task) => !task.done).length;
          const draft = drafts[lane.personId];
          const drafting = draft !== undefined;
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
                    lineHeight: 1,
                    fontWeight: 400,
                    color: "var(--ink)",
                  }}
                >
                  {person.initial}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 17,
                      lineHeight: "normal",
                      fontWeight: 400,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {person.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      lineHeight: "normal",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lane.detail}
                  </div>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--r-full)",
                    background: "var(--tile-2)",
                    fontFamily: "var(--font-data)",
                    fontSize: 13,
                    lineHeight: 1,
                    fontWeight: 400,
                    color: "var(--text-2)",
                  }}
                >
                  {openInLane}
                </div>
              </header>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", flex: 1, minHeight: 0, overflowY: "auto" }}>
                {visible.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    pickerOpen={pickerId === task.id}
                    onOpen={() => actions.beginEdit(task.id)}
                    onToggle={() => actions.toggleTask(task.id)}
                    onTitle={(title) => actions.setTitle(task.id, title)}
                    onDue={(dueOn) => actions.setDue(task.id, dueOn)}
                    onPicker={(open) => actions.setPickerId(open ? task.id : null)}
                    onClear={() => {
                      actions.setDue(task.id, null);
                      actions.setPickerId(null);
                    }}
                    onCancel={() => actions.cancelEdit(task.id)}
                    onSave={() => actions.saveEdit(task)}
                    onDelete={() => actions.deleteTask(task.id)}
                  />
                ))}
                {drafting ? (
                  <EditorCard
                    title={draft.title}
                    dueOn={draft.dueOn}
                    today={today}
                    pickerOpen={pickerId === draftKey(lane.personId)}
                    onTitle={(title) => actions.setDraftTitle(lane.personId, title)}
                    onDue={(dueOn) => actions.setDraftDue(lane.personId, dueOn)}
                    onPicker={(open) => actions.setPickerId(open ? draftKey(lane.personId) : null)}
                    onClear={() => {
                      actions.setDraftDue(lane.personId, null);
                      actions.setPickerId(null);
                    }}
                    onCancel={() => actions.cancelDraft(lane.personId)}
                    onSave={() => actions.saveDraft(lane.personId)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => actions.openDraft(lane.personId)}
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
                    Ny oppgave
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {removed ? (
        <div
          role="status"
          data-toast="board"
          style={{
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
          }}
        >
          <Trash2 size={17} color="var(--text-muted)" />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 400,
              color: "var(--text)",
            }}
          >
            «{removed.task.title}» ble slettet
          </span>
          <button type="button" onClick={actions.undo} style={undoPill}>
            <Undo2 size={15} color="var(--accent)" />
            Angre
          </button>
        </div>
      ) : null}
    </section>
  );
}

function TaskCard({
  task,
  today,
  pickerOpen,
  onOpen,
  onToggle,
  onTitle,
  onDue,
  onPicker,
  onClear,
  onCancel,
  onSave,
  onDelete,
}: {
  task: TodoTask;
  today: string;
  pickerOpen: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onTitle: (title: string) => void;
  onDue: (dueOn: string) => void;
  onPicker: (open: boolean) => void;
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const editing = Boolean(task.editing);
  const dueLabel = task.dueOn ? fristLabel(task.dueOn, today) : (task.due ?? null);
  const dueOverdue = task.dueOn ? isOverdue(task.dueOn, today) : Boolean(task.overdue);
  const showDue = Boolean(dueLabel) && !task.done && !editing;
  const [reserved, setReserved] = useState(0);
  useEffect(() => {
    if (!pickerOpen) setReserved(0);
  }, [pickerOpen]);
  return (
    <div>
    <article
      data-task={task.id}
      data-editing={editing ? "true" : undefined}
      data-done={task.done ? "true" : undefined}
      role={editing ? undefined : "button"}
      tabIndex={editing ? undefined : 0}
      onClick={() => {
        if (!editing) onOpen();
      }}
      onKeyDown={(event) => {
        if (editing) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      style={{
        position: "relative",
        zIndex: pickerOpen ? 20 : undefined,
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
        cursor: editing ? "auto" : "pointer",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 10, width: "100%" }}>
        <CheckBox done={Boolean(task.done)} label={task.title} onToggle={onToggle} />
        {editing ? (
          <TitleField value={task.title} onChange={onTitle} onSave={onSave} label={task.title || "Oppgavetittel"} autoFocus />
        ) : (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: "normal",
              fontWeight: 400,
              color: task.done ? "var(--text-muted)" : "var(--text)",
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.title}
          </div>
        )}
      </div>
      {showDue ? <DueRow due={dueLabel ?? ""} overdue={dueOverdue} /> : null}
      {editing ? (
        <EditorActions
          dueOn={task.dueOn ?? null}
          today={today}
          pickerOpen={pickerOpen}
          onDue={onDue}
          onPicker={onPicker}
          onClear={onClear}
          onCancel={onCancel}
          onSave={onSave}
          onDelete={onDelete}
          deleteLabel={task.title}
          onReserve={setReserved}
        />
      ) : null}
    </article>
    {reserved > 0 ? <div aria-hidden style={{ height: reserved }} /> : null}
    </div>
  );
}

function EditorCard({
  title,
  dueOn,
  today,
  pickerOpen,
  onTitle,
  onDue,
  onPicker,
  onClear,
  onCancel,
  onSave,
}: {
  title: string;
  dueOn: string | null;
  today: string;
  pickerOpen: boolean;
  onTitle: (title: string) => void;
  onDue: (dueOn: string) => void;
  onPicker: (open: boolean) => void;
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <article
      data-draft="true"
      style={{
        position: "relative",
        zIndex: pickerOpen ? 20 : undefined,
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        padding: 12,
        background: "var(--tile-2)",
        borderRadius: "var(--r-nested)",
        outline: "1.5px solid var(--accent)",
        outlineOffset: -0.75,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 10, width: "100%" }}>
        <span
          aria-hidden
          style={{
            width: 26,
            height: 26,
            flexShrink: 0,
            borderRadius: 8,
            outline: "1.5px solid var(--text-muted)",
            outlineOffset: -0.75,
          }}
        />
        <TitleField value={title} onChange={onTitle} onSave={onSave} label="Ny oppgave" autoFocus />
      </div>
      <EditorActions
        dueOn={dueOn}
        today={today}
        pickerOpen={pickerOpen}
        onDue={onDue}
        onPicker={onPicker}
        onClear={onClear}
        onCancel={onCancel}
        onSave={onSave}
      />
    </article>
  );
}

function CheckBox({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
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
        width: 26,
        height: 26,
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
      {done ? <Check size={16} color="var(--ink)" strokeWidth={2.5} /> : null}
    </button>
  );
}

function TitleField({
  value,
  onChange,
  onSave,
  label,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  label: string;
  autoFocus?: boolean;
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = fieldRef.current;
    if (!node || !autoFocus || node.getClientRects().length === 0) return;
    node.focus();
  }, [autoFocus]);
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
      <span style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            visibility: "hidden",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1.3,
            fontWeight: 400,
          }}
        >
          {value || " "}
        </span>
        <textarea
          ref={fieldRef}
          aria-label={label}
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
            margin: 0,
            padding: 0,
            border: "none",
            resize: "none",
            overflow: "hidden",
            outline: "none",
            background: "transparent",
            caretColor: "transparent",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1.3,
            fontWeight: 400,
          }}
        />
      </span>
      <span aria-hidden style={{ width: 2, height: 18, flexShrink: 0, background: "var(--accent)" }} />
    </div>
  );
}

function EditorActions({
  dueOn,
  today,
  pickerOpen,
  onDue,
  onPicker,
  onClear,
  onCancel,
  onSave,
  onDelete,
  deleteLabel,
  onReserve,
}: {
  dueOn: string | null;
  today: string;
  pickerOpen: boolean;
  onDue: (dueOn: string) => void;
  onPicker: (open: boolean) => void;
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  onReserve?: (height: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <FristPicker
          dueOn={dueOn}
          today={today}
          open={pickerOpen}
          onOpenChange={onPicker}
          onChange={onDue}
          onClear={onClear}
          onReserve={onReserve}
        />
        {onDelete ? <IconDelete label={deleteLabel || "oppgave"} onClick={onDelete} /> : null}
      </div>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          style={ghostPill}
        >
          Avbryt
        </button>
        <button
          type="button"
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

function IconDelete({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Slett ${label}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        border: "none",
        borderRadius: "var(--r-full)",
        background: DELETE_BG,
        cursor: "pointer",
      }}
    >
      <Trash2 size={16} color={DELETE_FG} />
    </button>
  );
}

function DueRow({ due, overdue }: { due: string; overdue: boolean }) {
  const color = overdue ? "var(--accent)" : "var(--text-muted)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingLeft: 36,
        width: "100%",
        boxSizing: "border-box",
        color,
      }}
    >
      {overdue ? <TriangleAlert size={13} color={color} /> : <Calendar size={13} color={color} />}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--font-body)",
          fontSize: 12,
          lineHeight: "normal",
          fontWeight: 400,
          color,
        }}
      >
        {due}
      </span>
    </div>
  );
}

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

const undoPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  flexShrink: 0,
  padding: "9px 15px",
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--tile-3)",
  color: "var(--accent)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: "normal",
  fontWeight: 400,
};
