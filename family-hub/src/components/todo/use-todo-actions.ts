"use client";

import { useEffect, useRef, useState } from "react";
import type { PersonId, TodoLane, TodoTask } from "@/data/types";
import { dueFields } from "@/lib/frist";
import { osloDateKey } from "@/lib/oslo";
import { writeJson } from "@/lib/persist-client";

export type DraftState = {
  title: string;
  dueOn: string | null;
};

export type RemovedTodo = {
  task: TodoTask;
  personId: PersonId;
  index: number;
};

type Saved = {
  title: string;
  dueOn?: string;
  due?: string;
  overdue?: boolean;
};

function cloneLanes(lanes: TodoLane[]): TodoLane[] {
  return lanes.map((lane) => ({
    ...lane,
    tasks: lane.tasks.map((task) => ({ ...task })),
  }));
}

function remember(task: TodoTask): Saved {
  return { title: task.title, dueOn: task.dueOn, due: task.due, overdue: task.overdue };
}

function restored(task: TodoTask, saved: Saved | undefined): TodoTask {
  if (!saved) return { ...task, editing: false };
  return {
    ...task,
    editing: false,
    title: saved.title,
    dueOn: saved.dueOn,
    due: saved.due,
    overdue: saved.overdue,
  };
}

function without(lanes: TodoLane[], personId: PersonId, id: string): TodoLane[] {
  return lanes.map((lane) =>
    lane.personId === personId ? { ...lane, tasks: lane.tasks.filter((task) => task.id !== id) } : lane,
  );
}

function inserted(lanes: TodoLane[], personId: PersonId, index: number, task: TodoTask): TodoLane[] {
  return lanes.map((lane) => {
    if (lane.personId !== personId) return lane;
    if (lane.tasks.some((entry) => entry.id === task.id)) return lane;
    const tasks = lane.tasks.slice();
    tasks.splice(Math.min(Math.max(index, 0), tasks.length), 0, task);
    return { ...lane, tasks };
  });
}

export function draftKey(personId: PersonId): string {
  return `draft:${personId}`;
}

export function useCancelOnOutsidePress(active: boolean, onCancel: () => void) {
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  useEffect(() => {
    if (!active) return;
    function onPointerDown(event: PointerEvent) {
      const node = event.target as HTMLElement | null;
      if (node?.closest("[data-todo-editor], [data-frist-popover], [data-toast]")) return;
      onCancelRef.current();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [active]);
}

export function useTodoActions(initialLanes: TodoLane[], persisted: boolean) {
  const [lanes, setLanes] = useState(() => cloneLanes(initialLanes));
  const [drafts, setDrafts] = useState<Partial<Record<PersonId, DraftState>>>({});
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<RemovedTodo | null>(null);
  const originals = useRef(new Map(initialLanes.flatMap((lane) => lane.tasks.map((task) => [task.id, remember(task)]))));
  const op = useRef(0);
  const inflight = useRef(new Map<string, Promise<boolean>>());
  const today = osloDateKey(new Date());

  useEffect(() => {
    if (!removed) return;
    const id = removed.task.id;
    const timeout = window.setTimeout(() => {
      setRemoved((current) => (current?.task.id === id ? null : current));
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [removed]);

  function updateTask(id: string, patch: Partial<TodoTask>) {
    setLanes((current) =>
      current.map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
      })),
    );
  }

  function closeOpen(current: TodoLane[], exceptId?: string): TodoLane[] {
    return current.map((lane) => ({
      ...lane,
      tasks: lane.tasks.map((task) => {
        if (!task.editing || task.id === exceptId) return task;
        return restored(task, originals.current.get(task.id));
      }),
    }));
  }

  function toggleTask(id: string) {
    const task = lanes.flatMap((lane) => lane.tasks).find((entry) => entry.id === id);
    if (!task) return;
    const done = !task.done;
    setLanes((current) =>
      current.map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((entry) => (entry.id === id ? { ...entry, done } : entry)),
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

  function beginEdit(id: string) {
    const task = lanes.flatMap((lane) => lane.tasks).find((entry) => entry.id === id);
    if (!task || task.editing) return;
    setPickerId(null);
    setRevealedId(null);
    setDrafts({});
    setLanes((current) =>
      closeOpen(current).map((lane) => ({
        ...lane,
        tasks: lane.tasks.map((entry) => (entry.id === id ? { ...entry, editing: true } : entry)),
      })),
    );
  }

  function cancelEdit(id: string) {
    const saved = originals.current.get(id);
    setPickerId((current) => (current === id ? null : current));
    if (!saved) {
      updateTask(id, { editing: false });
      return;
    }
    updateTask(id, {
      editing: false,
      title: saved.title,
      dueOn: saved.dueOn,
      due: saved.due,
      overdue: saved.overdue,
    });
  }

  function saveEdit(task: TodoTask) {
    const title = task.title.trim();
    if (!title) {
      cancelEdit(task.id);
      return;
    }
    const dueOn = task.dueOn ?? null;
    const fields = dueFields(dueOn, osloDateKey(new Date()));
    const previous = originals.current.get(task.id) ?? remember(task);
    originals.current.set(task.id, { title, ...fields });
    setPickerId((current) => (current === task.id ? null : current));
    updateTask(task.id, { editing: false, title, ...fields });
    if (!persisted) return;
    void writeJson("/api/todos", "PATCH", { id: task.id, title, dueOn }).then((ok) => {
      if (ok) return;
      originals.current.set(task.id, previous);
      updateTask(task.id, { title: previous.title, dueOn: previous.dueOn, due: previous.due, overdue: previous.overdue });
    });
  }

  function setTitle(id: string, title: string) {
    updateTask(id, { title });
  }

  function setDue(id: string, dueOn: string | null) {
    updateTask(id, dueOn ? { dueOn } : { dueOn: undefined });
  }

  function deleteTask(id: string) {
    let found: RemovedTodo | null = null;
    for (const lane of lanes) {
      const index = lane.tasks.findIndex((task) => task.id === id);
      if (index < 0) continue;
      const task = lane.tasks[index];
      const saved = originals.current.get(id);
      found = {
        personId: lane.personId,
        index,
        task: saved
          ? { ...task, editing: false, title: saved.title, dueOn: saved.dueOn, due: saved.due, overdue: saved.overdue }
          : { ...task, editing: false },
      };
      break;
    }
    if (!found) return;
    const snapshot = found;
    setPickerId(null);
    setRevealedId(null);
    setLanes((current) => without(current, snapshot.personId, id));
    setRemoved(snapshot);
    if (!persisted) return;
    const token = ++op.current;
    const request = writeJson("/api/todos", "DELETE", { id });
    inflight.current.set(id, request);
    void request.then((ok) => {
      if (inflight.current.get(id) === request) inflight.current.delete(id);
      if (op.current !== token) return;
      if (ok) return;
      setLanes((current) => inserted(current, snapshot.personId, snapshot.index, snapshot.task));
      setRemoved((current) => (current?.task.id === id ? null : current));
    });
  }

  function undo() {
    const snapshot = removed;
    if (!snapshot) return;
    const token = ++op.current;
    const task = { ...snapshot.task, editing: false };
    setRemoved(null);
    setLanes((current) => inserted(current, snapshot.personId, snapshot.index, task));
    if (!persisted) return;
    void (async () => {
      const pending = inflight.current.get(task.id);
      if (pending) await pending;
      if (op.current !== token) return;
      const ok = await writeJson("/api/todos", "POST", {
        id: task.id,
        personId: snapshot.personId,
        title: task.title,
        dueOn: task.dueOn ?? null,
        done: Boolean(task.done),
        sortOrder: task.sortOrder ?? snapshot.index,
      });
      if (op.current !== token) return;
      if (ok) {
        originals.current.set(task.id, remember(task));
        return;
      }
      setLanes((current) => without(current, snapshot.personId, task.id));
      setRemoved(snapshot);
    })();
  }

  function openDraft(personId: PersonId) {
    setPickerId(null);
    setRevealedId(null);
    setLanes((current) => closeOpen(current));
    setDrafts({ [personId]: { title: "", dueOn: null } });
  }

  function cancelDraft(personId: PersonId) {
    setPickerId((current) => (current === draftKey(personId) ? null : current));
    setDrafts((current) => {
      const next = { ...current };
      delete next[personId];
      return next;
    });
  }

  function saveDraft(personId: PersonId) {
    const draft = drafts[personId];
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      cancelDraft(personId);
      return;
    }
    const fields = dueFields(draft.dueOn, osloDateKey(new Date()));
    const index = lanes.find((lane) => lane.personId === personId)?.tasks.length ?? 0;
    const task: TodoTask = { id: crypto.randomUUID(), title, sortOrder: index, ...fields };
    originals.current.set(task.id, remember(task));
    setLanes((current) =>
      current.map((lane) => (lane.personId === personId ? { ...lane, tasks: [...lane.tasks, task] } : lane)),
    );
    cancelDraft(personId);
    if (!persisted) return;
    const body: { id: string; personId: PersonId; title: string; dueOn?: string } = { id: task.id, personId, title };
    if (draft.dueOn) body.dueOn = draft.dueOn;
    void writeJson("/api/todos", "POST", body).then((ok) => {
      if (ok) return;
      originals.current.delete(task.id);
      setLanes((current) => without(current, personId, task.id));
    });
  }

  function setDraftTitle(personId: PersonId, title: string) {
    setDrafts((current) => {
      const draft = current[personId];
      if (!draft) return current;
      return { ...current, [personId]: { ...draft, title } };
    });
  }

  function setDraftDue(personId: PersonId, dueOn: string | null) {
    setDrafts((current) => {
      const draft = current[personId];
      if (!draft) return current;
      return { ...current, [personId]: { ...draft, dueOn } };
    });
  }

  function reveal(id: string) {
    setRevealedId(id);
    setPickerId(null);
  }

  function closeReveal() {
    setRevealedId(null);
  }

  return {
    lanes,
    drafts,
    pickerId,
    revealedId,
    removed,
    today,
    setPickerId,
    toggleTask,
    beginEdit,
    cancelEdit,
    saveEdit,
    setTitle,
    setDue,
    deleteTask,
    undo,
    openDraft,
    cancelDraft,
    saveDraft,
    setDraftTitle,
    setDraftDue,
    reveal,
    closeReveal,
  };
}
