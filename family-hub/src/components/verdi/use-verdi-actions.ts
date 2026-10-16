"use client";

import { useEffect, useRef, useState } from "react";
import { writeJson } from "@/lib/persist-client";
import {
  extraDraftValid,
  nextSkips,
  parseAmount,
  type VerdiBasic,
  type VerdiDaughterId,
  type VerdiExtra,
  type VerdiLane,
  type VerdiWeek,
} from "@/lib/verdi/model";

export type ExtraDraft = {
  title: string;
  amount: string;
};

export type RemovedExtra = {
  extra: VerdiExtra;
  personId: VerdiDaughterId;
  index: number;
};

function cloneWeek(week: VerdiWeek): VerdiWeek {
  return {
    ...week,
    basics: week.basics.map((basic) => ({ ...basic })),
    lanes: week.lanes.map((lane) => ({
      ...lane,
      extras: lane.extras.map((extra) => ({ ...extra })),
    })),
  };
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
  const [drafts, setDrafts] = useState<Partial<Record<VerdiDaughterId, ExtraDraft>>>({});
  const [editingBasicId, setEditingBasicId] = useState<string | null>(null);
  const [basicTitle, setBasicTitle] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<RemovedExtra | null>(null);
  const extrasOriginal = useRef(new Map(initial.lanes.flatMap((lane) => lane.extras.map((extra) => [extra.id, { ...extra }]))));
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
      lanes: current.lanes.map((lane) => ({
        ...lane,
        extras: lane.extras.map((extra) => {
          if (!extra.editing || extra.id === exceptExtra) return extra;
          const saved = extrasOriginal.current.get(extra.id);
          return saved ? { ...saved, editing: false } : { ...extra, editing: false };
        }),
      })),
    }));
  }

  function patchLane(personId: VerdiDaughterId, patch: (lane: VerdiLane) => VerdiLane) {
    setWeek((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => (lane.personId === personId ? patch(lane) : lane)),
    }));
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

  function openDraft(personId: VerdiDaughterId) {
    if (week.locked) return;
    closeEditors();
    setDrafts({ [personId]: { title: "", amount: "" } });
  }

  function cancelDraft(personId: VerdiDaughterId) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[personId];
      return next;
    });
  }

  function setDraft(personId: VerdiDaughterId, patch: Partial<ExtraDraft>) {
    setDrafts((current) => {
      const draft = current[personId];
      if (!draft) return current;
      return { ...current, [personId]: { ...draft, ...patch } };
    });
  }

  function saveDraft(personId: VerdiDaughterId) {
    const draft = drafts[personId];
    if (!draft || week.locked) return;
    if (!extraDraftValid(draft.title, draft.amount)) return;
    const amountNok = parseAmount(draft.amount);
    if (amountNok === null) return;
    const extra: VerdiExtra = { id: crypto.randomUUID(), title: draft.title.trim(), amountNok };
    extrasOriginal.current.set(extra.id, extra);
    patchLane(personId, (lane) => ({ ...lane, extras: [...lane.extras, extra] }));
    cancelDraft(personId);
    if (!persisted) return;
    void writeJson("/api/verdi", "POST", {
      week: week.week,
      personId,
      id: extra.id,
      title: extra.title,
      amountNok,
    }).then((ok) => {
      if (ok) return;
      extrasOriginal.current.delete(extra.id);
      patchLane(personId, (lane) => ({ ...lane, extras: lane.extras.filter((entry) => entry.id !== extra.id) }));
    });
  }

  function beginEditExtra(id: string) {
    if (week.locked) return;
    closeEditors(id);
    setWeek((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => ({
        ...lane,
        extras: lane.extras.map((extra) => (extra.id === id ? { ...extra, editing: true } : extra)),
      })),
    }));
  }

  function cancelEditExtra(id: string) {
    const saved = extrasOriginal.current.get(id);
    setWeek((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => ({
        ...lane,
        extras: lane.extras.map((extra) => (extra.id === id ? { ...(saved ?? extra), editing: false } : extra)),
      })),
    }));
  }

  function setExtra(id: string, patch: Partial<VerdiExtra>) {
    setWeek((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => ({
        ...lane,
        extras: lane.extras.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)),
      })),
    }));
  }

  function saveExtra(extra: VerdiExtra) {
    if (week.locked) return;
    const title = extra.title.trim();
    const amountNok = extra.amountNok;
    if (!title || !Number.isSafeInteger(amountNok) || amountNok < 1) return;
    extrasOriginal.current.set(extra.id, { id: extra.id, title, amountNok });
    setExtra(extra.id, { title, amountNok, editing: false });
    if (!persisted) return;
    void writeJson("/api/verdi", "PATCH", { op: "extra", week: week.week, id: extra.id, title, amountNok }).then((ok) => {
      if (ok) return;
      const saved = extrasOriginal.current.get(extra.id);
      if (saved) setExtra(extra.id, saved);
    });
  }

  function deleteExtra(id: string) {
    if (week.locked) return;
    let found: RemovedExtra | null = null;
    for (const lane of week.lanes) {
      const index = lane.extras.findIndex((extra) => extra.id === id);
      if (index < 0) continue;
      const extra = extrasOriginal.current.get(id) ?? { ...lane.extras[index], editing: false };
      found = { personId: lane.personId, index, extra };
      break;
    }
    if (!found) return;
    const snapshot = found;
    setRevealedId(null);
    patchLane(snapshot.personId, (lane) => ({ ...lane, extras: lane.extras.filter((extra) => extra.id !== id) }));
    setRemoved(snapshot);
    if (!persisted) return;
    void writeJson("/api/verdi", "DELETE", { week: week.week, id }).then((ok) => {
      if (ok) return;
      patchLane(snapshot.personId, (lane) => {
        if (lane.extras.some((extra) => extra.id === id)) return lane;
        const extras = lane.extras.slice();
        extras.splice(snapshot.index, 0, snapshot.extra);
        return { ...lane, extras };
      });
      setRemoved((current) => (current?.extra.id === id ? null : current));
    });
  }

  function undo() {
    const snapshot = removed;
    if (!snapshot || week.locked) return;
    setRemoved(null);
    extrasOriginal.current.set(snapshot.extra.id, snapshot.extra);
    patchLane(snapshot.personId, (lane) => {
      if (lane.extras.some((extra) => extra.id === snapshot.extra.id)) return lane;
      const extras = lane.extras.slice();
      extras.splice(snapshot.index, 0, snapshot.extra);
      return { ...lane, extras };
    });
    if (!persisted) return;
    void writeJson("/api/verdi", "POST", {
      week: week.week,
      personId: snapshot.personId,
      id: snapshot.extra.id,
      title: snapshot.extra.title,
      amountNok: snapshot.extra.amountNok,
    }).then((ok) => {
      if (ok) return;
      patchLane(snapshot.personId, (lane) => ({
        ...lane,
        extras: lane.extras.filter((extra) => extra.id !== snapshot.extra.id),
      }));
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

  const editingExtra = week.lanes.flatMap((lane) => lane.extras).find((extra) => extra.editing);
  const draftPerson = (Object.keys(drafts)[0] ?? null) as VerdiDaughterId | null;

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
    deleteExtra,
    undo,
    completeWeek,
    reveal: (id: string) => setRevealedId(id),
    closeReveal: () => setRevealedId(null),
    closeEditors,
  };
}
