"use client";

import { useEffect, useRef, useState } from "react";
import { writeJson } from "@/lib/persist-client";
import {
  extraDraftValid,
  nextSkips,
  parseAmount,
  POOL_ID,
  type VerdiDaughterId,
  type VerdiExtra,
  type VerdiLane,
  type VerdiOwnerId,
  type VerdiWeek,
} from "@/lib/verdi/model";

export type ExtraDraft = {
  title: string;
  amount: string;
};

export type RemovedExtra = {
  extra: VerdiExtra;
  personId: VerdiOwnerId;
  index: number;
};

function cloneWeek(week: VerdiWeek): VerdiWeek {
  return {
    ...week,
    basics: week.basics.map((basic) => ({ ...basic })),
    pool: (week.pool ?? []).map((extra) => ({ ...extra })),
    lanes: week.lanes.map((lane) => ({
      ...lane,
      extras: lane.extras.map((extra) => ({ ...extra })),
    })),
  };
}

function storedExtra(extra: VerdiExtra): VerdiExtra {
  return { id: extra.id, title: extra.title, amountNok: extra.amountNok, done: Boolean(extra.done) };
}

function extraMap(week: VerdiWeek): Map<string, VerdiExtra> {
  return new Map([
    ...week.pool.map((extra) => [extra.id, storedExtra(extra)] as const),
    ...week.lanes.flatMap((lane) => lane.extras.map((extra) => [extra.id, storedExtra(extra)] as const)),
  ]);
}

function extrasOf(week: VerdiWeek, ownerId: VerdiOwnerId): VerdiExtra[] {
  if (ownerId === POOL_ID) return week.pool;
  return week.lanes.find((lane) => lane.personId === ownerId)?.extras ?? [];
}

function findExtra(week: VerdiWeek, id: string): { ownerId: VerdiOwnerId; index: number; extra: VerdiExtra } | null {
  const poolIndex = week.pool.findIndex((extra) => extra.id === id);
  if (poolIndex >= 0) return { ownerId: POOL_ID, index: poolIndex, extra: week.pool[poolIndex] };
  for (const lane of week.lanes) {
    const index = lane.extras.findIndex((extra) => extra.id === id);
    if (index >= 0) return { ownerId: lane.personId, index, extra: lane.extras[index] };
  }
  return null;
}

function setOwnerExtras(week: VerdiWeek, ownerId: VerdiOwnerId, extras: VerdiExtra[]): VerdiWeek {
  if (ownerId === POOL_ID) return { ...week, pool: extras };
  return {
    ...week,
    lanes: week.lanes.map((lane) => (lane.personId === ownerId ? { ...lane, extras } : lane)),
  };
}

function mapExtra(week: VerdiWeek, id: string, patch: Partial<VerdiExtra>): VerdiWeek {
  return {
    ...week,
    pool: week.pool.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)),
    lanes: week.lanes.map((lane) => ({
      ...lane,
      extras: lane.extras.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)),
    })),
  };
}

function restoreEditing(extra: VerdiExtra, exceptId: string | undefined, originals: Map<string, VerdiExtra>): VerdiExtra {
  if (!extra.editing || extra.id === exceptId) return extra;
  const saved = originals.get(extra.id);
  return saved ? { ...saved, editing: false } : { ...extra, editing: false };
}

export function useCancelOnOutsidePress(active: boolean, onCancel: () => void) {
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  useEffect(() => {
    if (!active) return;
    function onPointerDown(event: PointerEvent) {
      const node = event.target as HTMLElement | null;
      if (node?.closest("[data-verdi-editor], [data-toast]")) return;
      onCancelRef.current();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [active]);
}

export function useVerdiActions(initial: VerdiWeek, persisted: boolean) {
  const [week, setWeek] = useState(() => cloneWeek(initial));
  const [drafts, setDrafts] = useState<Partial<Record<VerdiOwnerId, ExtraDraft>>>({});
  const [editingBasicId, setEditingBasicId] = useState<string | null>(null);
  const [basicTitle, setBasicTitle] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<RemovedExtra | null>(null);
  const extrasOriginal = useRef(extraMap(initial));
  const basicsOriginal = useRef(new Map(initial.basics.map((basic) => [basic.id, basic.title])));

  useEffect(() => {
    if (!removed) return;
    const id = removed.extra.id;
    const timeout = window.setTimeout(() => {
      setRemoved((current) => (current?.extra.id === id ? null : current));
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [removed]);

  function closeEditors(exceptExtra?: string) {
    setDrafts({});
    setEditingBasicId(null);
    setRevealedId(null);
    setWeek((current) => ({
      ...current,
      pool: current.pool.map((extra) => restoreEditing(extra, exceptExtra, extrasOriginal.current)),
      lanes: current.lanes.map((lane) => ({
        ...lane,
        extras: lane.extras.map((extra) => restoreEditing(extra, exceptExtra, extrasOriginal.current)),
      })),
    }));
  }

  function patchLane(personId: VerdiDaughterId, patch: (lane: VerdiLane) => VerdiLane) {
    setWeek((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => (lane.personId === personId ? patch(lane) : lane)),
    }));
  }

  function patchOwner(ownerId: VerdiOwnerId, extrasFn: (extras: VerdiExtra[]) => VerdiExtra[]) {
    setWeek((current) => setOwnerExtras(current, ownerId, extrasFn(extrasOf(current, ownerId))));
  }

  function setSkips(personId: VerdiDaughterId, delta: 1 | -1) {
    if (week.locked) return;
    const lane = week.lanes.find((entry) => entry.personId === personId);
    if (!lane) return;
    const skips = nextSkips(lane.skips, delta);
    if (skips === lane.skips) return;
    const previous = lane.skips;
    patchLane(personId, (entry) => ({ ...entry, skips }));
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "skip", week: week.week, personId, skips }).then((ok) => {
      if (ok) return;
      patchLane(personId, (entry) => (entry.skips === skips ? { ...entry, skips: previous } : entry));
    });
  }

  function beginEditBasic(id: string) {
    if (week.locked) return;
    const title = week.basics.find((basic) => basic.id === id)?.title ?? "";
    closeEditors();
    setEditingBasicId(id);
    setBasicTitle(title);
  }

  function cancelBasic() {
    setEditingBasicId(null);
  }

  function saveBasic() {
    const id = editingBasicId;
    if (!id || week.locked) return;
    const title = basicTitle.trim();
    if (!title) return;
    const previous = week.basics.map((basic) => ({ ...basic }));
    basicsOriginal.current.set(id, title);
    setWeek((current) => ({
      ...current,
      basics: current.basics.map((basic) => (basic.id === id ? { ...basic, title } : basic)),
    }));
    setEditingBasicId(null);
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "basic", week: week.week, id, title }).then((ok) => {
      if (ok) return;
      setWeek((current) => ({ ...current, basics: previous }));
    });
  }

  function openDraft(personId: VerdiOwnerId) {
    if (week.locked) return;
    closeEditors();
    setDrafts({ [personId]: { title: "", amount: "" } });
  }

  function cancelDraft(personId: VerdiOwnerId) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[personId];
      return next;
    });
  }

  function setDraft(personId: VerdiOwnerId, patch: Partial<ExtraDraft>) {
    setDrafts((current) => {
      const draft = current[personId];
      if (!draft) return current;
      return { ...current, [personId]: { ...draft, ...patch } };
    });
  }

  function saveDraft(personId: VerdiOwnerId) {
    const draft = drafts[personId];
    if (!draft || week.locked) return;
    if (!extraDraftValid(draft.title, draft.amount)) return;
    const amountNok = parseAmount(draft.amount);
    if (amountNok === null) return;
    const extra: VerdiExtra = { id: crypto.randomUUID(), title: draft.title.trim(), amountNok, done: false };
    extrasOriginal.current.set(extra.id, storedExtra(extra));
    patchOwner(personId, (extras) => [...extras, extra]);
    cancelDraft(personId);
    if (!persisted) return;
    void writeJson("/api/verdi", "POST", {
      week: week.week,
      personId,
      id: extra.id,
      title: extra.title,
      amountNok,
      done: false,
    }).then((ok) => {
      if (ok) return;
      extrasOriginal.current.delete(extra.id);
      patchOwner(personId, (extras) => extras.filter((entry) => entry.id !== extra.id));
    });
  }

  function beginEditExtra(id: string) {
    if (week.locked) return;
    closeEditors(id);
    setWeek((current) => mapExtra(current, id, { editing: true }));
  }

  function cancelEditExtra(id: string) {
    const saved = extrasOriginal.current.get(id);
    setWeek((current) => mapExtra(current, id, { ...(saved ?? {}), editing: false }));
  }

  function setExtra(id: string, patch: Partial<VerdiExtra>) {
    setWeek((current) => mapExtra(current, id, patch));
  }

  function saveExtra(extra: VerdiExtra) {
    if (week.locked) return;
    const title = extra.title.trim();
    const amountNok = extra.amountNok;
    if (!title || !Number.isSafeInteger(amountNok) || amountNok < 1) return;
    const found = findExtra(week, extra.id);
    const done = found?.ownerId === POOL_ID ? false : Boolean(extra.done);
    extrasOriginal.current.set(extra.id, { id: extra.id, title, amountNok, done });
    setExtra(extra.id, { title, amountNok, done, editing: false });
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "extra", week: week.week, id: extra.id, title, amountNok, done }).then((ok) => {
      if (ok) return;
      const saved = extrasOriginal.current.get(extra.id);
      if (saved) setExtra(extra.id, saved);
    });
  }

  function toggleDone(id: string) {
    if (week.locked) return;
    const found = findExtra(week, id);
    if (!found || found.ownerId === POOL_ID) return;
    const done = !found.extra.done;
    const previous = Boolean(found.extra.done);
    extrasOriginal.current.set(id, { ...storedExtra(found.extra), done });
    setExtra(id, { done, editing: false });
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "extra", week: week.week, id, done }).then((ok) => {
      if (ok) return;
      extrasOriginal.current.set(id, { ...storedExtra(found.extra), done: previous });
      setExtra(id, { done: previous });
    });
  }

  function claimExtra(id: string, personId: VerdiDaughterId) {
    if (week.locked) return;
    const found = findExtra(week, id);
    if (!found || found.ownerId !== POOL_ID) return;
    const extra = { ...found.extra, done: false, editing: false };
    const index = found.index;
    extrasOriginal.current.set(id, storedExtra(extra));
    setWeek((current) => {
      const from = findExtra(current, id);
      if (!from || from.ownerId !== POOL_ID) return current;
      const claimed = { ...from.extra, done: false, editing: false };
      return {
        ...current,
        pool: current.pool.filter((entry) => entry.id !== id),
        lanes: current.lanes.map((lane) =>
          lane.personId === personId
            ? { ...lane, extras: lane.extras.some((entry) => entry.id === id) ? lane.extras : [...lane.extras, claimed] }
            : lane,
        ),
      };
    });
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "extra", week: week.week, id, personId, done: false }).then((ok) => {
      if (ok) return;
      extrasOriginal.current.set(id, storedExtra(extra));
      setWeek((current) => {
        const without = {
          ...current,
          lanes: current.lanes.map((lane) => ({ ...lane, extras: lane.extras.filter((entry) => entry.id !== id) })),
          pool: current.pool.filter((entry) => entry.id !== id),
        };
        const pool = without.pool.slice();
        pool.splice(index, 0, extra);
        return { ...without, pool };
      });
    });
  }

  function deleteExtra(id: string) {
    if (week.locked) return;
    const found = findExtra(week, id);
    if (!found) return;
    const extra = extrasOriginal.current.get(id) ?? storedExtra(found.extra);
    const snapshot: RemovedExtra = { personId: found.ownerId, index: found.index, extra };
    setRevealedId(null);
    patchOwner(snapshot.personId, (extras) => extras.filter((entry) => entry.id !== id));
    setRemoved(snapshot);
    if (!persisted) return;
    void writeJson("/api/verdi", "DELETE", { week: week.week, id }).then((ok) => {
      if (ok) return;
      patchOwner(snapshot.personId, (extras) => {
        if (extras.some((entry) => entry.id === id)) return extras;
        const next = extras.slice();
        next.splice(snapshot.index, 0, snapshot.extra);
        return next;
      });
      setRemoved((current) => (current?.extra.id === id ? null : current));
    });
  }

  function undo() {
    const snapshot = removed;
    if (!snapshot || week.locked) return;
    setRemoved(null);
    extrasOriginal.current.set(snapshot.extra.id, storedExtra(snapshot.extra));
    patchOwner(snapshot.personId, (extras) => {
      if (extras.some((extra) => extra.id === snapshot.extra.id)) return extras;
      const next = extras.slice();
      next.splice(snapshot.index, 0, snapshot.extra);
      return next;
    });
    if (!persisted) return;
    void writeJson("/api/verdi", "POST", {
      week: week.week,
      personId: snapshot.personId,
      id: snapshot.extra.id,
      title: snapshot.extra.title,
      amountNok: snapshot.extra.amountNok,
      done: snapshot.personId === POOL_ID ? false : Boolean(snapshot.extra.done),
    }).then((ok) => {
      if (ok) return;
      patchOwner(snapshot.personId, (extras) => extras.filter((extra) => extra.id !== snapshot.extra.id));
      setRemoved(snapshot);
    });
  }

  function completeWeek() {
    if (week.locked) return;
    closeEditors();
    setWeek((current) => ({ ...current, locked: true, lockedAt: new Date().toISOString() }));
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "lock", week: week.week, locked: true }).then((ok) => {
      if (ok) return;
      setWeek((current) => ({ ...current, locked: false, lockedAt: null }));
    });
  }

  const editingExtra = [...week.pool, ...week.lanes.flatMap((lane) => lane.extras)].find((extra) => extra.editing);
  const draftPerson = (Object.keys(drafts)[0] ?? null) as VerdiOwnerId | null;

  return {
    week,
    drafts,
    editingBasicId,
    basicTitle,
    setBasicTitle,
    revealedId,
    removed,
    editingExtra,
    draftPerson,
    setSkips,
    beginEditBasic,
    cancelBasic,
    saveBasic,
    openDraft,
    cancelDraft,
    setDraft,
    saveDraft,
    beginEditExtra,
    cancelEditExtra,
    setExtra,
    saveExtra,
    toggleDone,
    claimExtra,
    deleteExtra,
    undo,
    completeWeek,
    reveal: (id: string) => setRevealedId(id),
    closeReveal: () => setRevealedId(null),
    closeEditors,
  };
}
