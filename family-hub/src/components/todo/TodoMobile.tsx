"use client";

import { useRef, useState } from "react";
import { Calendar, Check, Plus, TriangleAlert } from "lucide-react";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import { people } from "@/data/fixture";
import type { Person, PersonId, TodoLane, TodoTask, WeatherView } from "@/data/types";
import { writeJson } from "@/lib/persist-client";
import type { OsloNow } from "@/lib/oslo";

const PHONE_EDIT_ID = "knut-dekk";

function personFor(id: PersonId): Person {
  const person = people.find((entry) => entry.id === id);
  if (!person) throw new Error(`Missing person ${id}`);
  return person;
}

function shortName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function openCount(tasks: TodoTask[]): number {
  return tasks.filter((task) => !task.done).length;
}

export function TodoMobile({
  clock,
  weather,
  lanes: initialLanes,
  persisted,
}: {
  clock: OsloNow;
  weather: WeatherView;
  lanes: TodoLane[];
  persisted: boolean;
}) {
  const [lanes, setLanes] = useState<TodoLane[]>(() =>
    initialLanes.map((lane) => ({
      ...lane,
      tasks: lane.tasks.map((task) => ({
        ...task,
        editing: persisted ? false : task.id === PHONE_EDIT_ID,
      })),
    })),
  );
  const [selectedId, setSelectedId] = useState<PersonId>("knut");
  const [drafts, setDrafts] = useState<Partial<Record<PersonId, string>>>({});
  const originals = useRef(new Map(initialLanes.flatMap((lane) => lane.tasks.map((task) => [task.id, task.title]))));

  const selected = lanes.find((lane) => lane.personId === selectedId) ?? lanes[0];
  const person = personFor(selected.personId);
  const draft = drafts[selected.personId];
  const drafting = draft !== undefined;

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

  function beginDraft(personId: PersonId) {
    setLanes((current) =>
      current.map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((task) =>
          task.editing ? { ...task, editing: false, title: originals.current.get(task.id) ?? task.title } : task,
        ),
      })),
    );
    setDrafts({ [personId]: "" });
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
    originals.current.set(task.id, title);
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
    <div
      data-region="todo-mobile"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px 16px 12px",
        boxSizing: "border-box",
      }}
    >
      <PhoneHeader clock={clock} weather={weather} />

      <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
        {lanes.map((lane) => {
          const member = personFor(lane.personId);
          const count = openCount(lane.tasks);
          const selectedPerson = lane.personId === selected.personId;
          const label = shortName(member.name);
          return (
            <button
              key={lane.personId}
              type="button"
              data-person={lane.personId}
              aria-pressed={selectedPerson}
              aria-label={`${label} ${count}`}
              onClick={() => setSelectedId(lane.personId)}
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
                  lineHeight: 1,
                  fontWeight: 400,
                  color: "var(--ink)",
                }}
              >
                {member.initial}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  lineHeight: 1,
                  fontWeight: 400,
                  color: selectedPerson ? "var(--text)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {label} {count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 2px 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text)",
            minWidth: 0,
          }}
        >
          {person.name} · {selected.detail}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {openCount(selected.tasks)} åpne
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {selected.tasks.map((task) => (
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
          <DraftCard
            title={draft}
            onTitle={(title) => setDrafts((current) => ({ ...current, [selected.personId]: title }))}
            onCancel={() => cancelDraft(selected.personId)}
            onSave={() => saveDraft(selected.personId)}
          />
        ) : null}
      </div>

      {drafting ? null : (
        <button
          type="button"
          onClick={() => beginDraft(selected.personId)}
          style={{
            width: "100%",
            height: 48,
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            gap: 8,
            justifyContent: "center",
            alignItems: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            outline: "1.5px solid #ffffff24",
            outlineOffset: -0.75,
            borderRadius: "var(--r-nested)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          <Plus size={17} color="var(--text-muted)" />
          Ny oppgave til {shortName(person.name)}
        </button>
      )}
    </div>
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
        background: "var(--tile)",
        borderRadius: "var(--r-nested)",
        outline: editing ? "1.5px solid var(--accent)" : "none",
        outlineOffset: editing ? -0.75 : undefined,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 11, width: "100%" }}>
        <CheckBox done={Boolean(task.done)} label={task.title} onToggle={onToggle} />
        {editing ? (
          <TitleField value={task.title} onChange={onTitle} onSave={onSave} label={task.title || "Oppgavetittel"} />
        ) : (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.2,
              fontWeight: 400,
              color: task.done ? "var(--text-muted)" : "var(--text)",
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

function DraftCard({
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
        background: "var(--tile)",
        borderRadius: "var(--r-nested)",
        outline: "1.5px solid var(--accent)",
        outlineOffset: -0.75,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 11, width: "100%" }}>
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
            whiteSpace: "pre",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.2,
            fontWeight: 400,
            color: "var(--text)",
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
            color: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            lineHeight: 1.2,
            fontWeight: 400,
          }}
        />
      </span>
      <span aria-hidden style={{ width: 2, height: 19, flexShrink: 0, background: "var(--accent)" }} />
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
        paddingLeft: 37,
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
          lineHeight: 1.2,
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
  padding: "9px 16px",
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
