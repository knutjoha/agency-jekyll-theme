"use client";

import { useRef, useState } from "react";
import { Calendar, Check, Plus, TriangleAlert } from "lucide-react";
import { people } from "@/data/fixture";
import type { Person, PersonId, TodoFilter, TodoLane, TodoTask } from "@/data/types";
import { writeJson } from "@/lib/persist-client";

const FILTERS: { id: TodoFilter; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "frist", label: "Med frist" },
  { id: "fullfort", label: "Fullførte" },
];

function cloneLanes(lanes: TodoLane[]): TodoLane[] {
  return lanes.map((lane) => ({
    ...lane,
    tasks: lane.tasks.map((task) => ({ ...task })),
  }));
}

function personFor(id: PersonId): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

function matches(task: TodoTask, filter: TodoFilter): boolean {
  if (filter === "fullfort") return Boolean(task.done);
  if (filter === "frist") return Boolean(task.due);
  return true;
}

export function TodoBoard({ lanes: initialLanes, persisted }: { lanes: TodoLane[]; persisted: boolean }) {
  const [lanes, setLanes] = useState(() => cloneLanes(initialLanes));
  const [filter, setFilter] = useState<TodoFilter>("alle");
  const [drafts, setDrafts] = useState<Partial<Record<PersonId, string>>>({});
  const originals = useRef(new Map(initialLanes.flatMap((lane) => lane.tasks.map((task) => [task.id, task.title]))));

  const tasks = lanes.flatMap((lane) => lane.tasks);
  const openCount = tasks.filter((task) => !task.done).length;
  const doneCount = tasks.filter((task) => task.done).length;

  function updateTask(id: string, patch: Partial<TodoTask>) {
    setLanes((current) =>
      current.map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
      })),
    );
  }

  function toggleTask(id: string) {
    const task = lanes.flatMap((lane) => lane.tasks).find((entry) => entry.id === id);
    if (!task) return;
    const done = !task.done;
    setLanes((current) =>
      current.map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((entry) => (entry.id === id ? { ...entry, done, editing: false } : entry)),
      })),
    );
    if (!persisted) return;
    void writeJson("/api/todos", "PATCH", { id, done }).then((ok) => {
      if (ok) return;
      setLanes((current) =>
        current.map((lane) => ({
          ...lane,
          tasks: lane.tasks.map((entry) => (entry.id === id && entry.done === done ? { ...entry, done: !done } : entry)),
        })),
      );
    });
  }

  function cancelEdit(id: string) {
    updateTask(id, { editing: false, title: originals.current.get(id) ?? "" });
  }

  function saveEdit(task: TodoTask) {
    const title = task.title.trim();
    if (!title) {
      cancelEdit(task.id);
      return;
    }
    const previous = originals.current.get(task.id) ?? title;
    originals.current.set(task.id, title);
    updateTask(task.id, { editing: false, title });
    if (!persisted) return;
    void writeJson("/api/todos", "PATCH", { id: task.id, title }).then((ok) => {
      if (ok) return;
      originals.current.set(task.id, previous);
      updateTask(task.id, { title: previous });
    });
  }

  function openDraft(personId: PersonId) {
    setDrafts((current) => ({ ...current, [personId]: current[personId] ?? "" }));
  }

  function cancelDraft(personId: PersonId) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[personId];
      return next;
    });
  }

  function saveDraft(personId: PersonId) {
    const title = (drafts[personId] ?? "").trim();
    if (!title) {
      cancelDraft(personId);
      return;
    }
    const task: TodoTask = { id: crypto.randomUUID(), title };
    setLanes((current) =>
      current.map((lane) => (lane.personId === personId ? { ...lane, tasks: [...lane.tasks, task] } : lane)),
    );
    cancelDraft(personId);
    if (!persisted) return;
    void writeJson("/api/todos", "POST", { id: task.id, personId, title }).then((ok) => {
      if (ok) return;
      setLanes((current) =>
        current.map((lane) => ({
          ...lane,
          tasks: lane.tasks.filter((entry) => entry.id !== task.id),
        })),
      );
    });
  }

  return (
    <section
      data-region="todo"
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
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
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
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
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                flex: 1,
                minWidth: 0,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 12,
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
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {visible.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onTitle={(title) => updateTask(task.id, { title })}
                    onCancel={() => cancelEdit(task.id)}
                    onSave={() => saveEdit(task)}
                  />
                ))}
                {drafting ? (
                  <EditorCard
                    title={draft}
                    onTitle={(title) => setDrafts((current) => ({ ...current, [lane.personId]: title }))}
                    onCancel={() => cancelDraft(lane.personId)}
                    onSave={() => saveDraft(lane.personId)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => openDraft(lane.personId)}
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
    </section>
  );
}

function TaskCard({
  task,
  onToggle,
  onTitle,
  onCancel,
  onSave,
}: {
  task: TodoTask;
  onToggle: () => void;
  onTitle: (title: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const editing = Boolean(task.editing);
  const showDue = Boolean(task.due) && !task.done && !editing;
  return (
    <article
      data-task={task.id}
      data-editing={editing ? "true" : undefined}
      data-done={task.done ? "true" : undefined}
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
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 10, width: "100%" }}>
        <CheckBox done={Boolean(task.done)} label={task.title} onToggle={onToggle} />
        {editing ? (
          <TitleField value={task.title} onChange={onTitle} onSave={onSave} label={task.title || "Oppgavetittel"} />
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
      {showDue ? <DueRow due={task.due ?? ""} overdue={Boolean(task.overdue)} /> : null}
      {editing ? <EditorActions onCancel={onCancel} onSave={onSave} /> : null}
    </article>
  );
}

function EditorCard({
  title,
  onTitle,
  onCancel,
  onSave,
}: {
  title: string;
  onTitle: (title: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <article
      data-draft="true"
      style={{
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
      <EditorActions onCancel={onCancel} onSave={onSave} />
    </article>
  );
}

function CheckBox({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={done ? `Merk ${label} som åpen` : `Fullfør ${label}`}
      onClick={onToggle}
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
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "row", alignItems: "center", gap: 3 }}>
      <span style={{ position: "relative", display: "inline-flex", maxWidth: "100%", minWidth: 2 }}>
        <span
          aria-hidden
          style={{
            visibility: "hidden",
            whiteSpace: "pre",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          {value || " "}
        </span>
        <input
          aria-label={label}
          value={value}
          autoFocus={autoFocus}
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
            margin: 0,
            padding: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            caretColor: "transparent",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 400,
          }}
        />
      </span>
      <span aria-hidden style={{ width: 2, height: 18, flexShrink: 0, background: "var(--accent)" }} />
    </div>
  );
}

function EditorActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 8, width: "100%" }}>
      <button type="button" onClick={onCancel} style={ghostPill}>
        Avbryt
      </button>
      <button type="button" onClick={onSave} style={savePill}>
        Lagre
      </button>
    </div>
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
