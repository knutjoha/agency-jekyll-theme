"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Calendar, Plus, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import { ClearDoneButton } from "@/components/todo/ClearDoneButton";
import { CheckBox, TodoEditor } from "@/components/todo/TodoEditor";
import { draftKey, useCancelOnOutsidePress, useTodoActions } from "@/components/todo/use-todo-actions";
import { PhoneHeader } from "@/components/shell/PhoneHeader";
import { people } from "@/data/fixture";
import type { Person, PersonId, TodoLane, TodoTask, WeatherView } from "@/data/types";
import { fristLabel, isOverdue } from "@/lib/frist";
import type { OsloNow } from "@/lib/oslo";

const PHONE_EDIT_ID = "knut-dekk";
const ACTION = 84;
const GAP = 8;
const DELETE_BG = "#3A1C1C";
const DELETE_FG = "#FF6B6B";

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
  snapshot = false,
}: {
  clock: OsloNow;
  weather: WeatherView;
  lanes: TodoLane[];
  persisted: boolean;
  snapshot?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<PersonId>("knut");
  const actions = useTodoActions(
    initialLanes.map((lane) => ({
      ...lane,
      tasks: lane.tasks.map((task) => ({
        ...task,
        editing: persisted ? false : snapshot && task.id === PHONE_EDIT_ID,
      })),
    })),
    persisted,
  );
  const { lanes, drafts, pickerId, revealedId, removed, today } = actions;
  const selected = lanes.find((lane) => lane.personId === selectedId) ?? lanes[0];
  const person = personFor(selected.personId);
  const draft = drafts[selected.personId];
  const drafting = draft !== undefined;
  const editingTask = selected.tasks.find((task) => task.editing);
  const allTasks = lanes.flatMap((lane) => lane.tasks);
  const doneCount = allTasks.filter((task) => task.done).length;
  const openAll = allTasks.filter((task) => !task.done).length;
  useCancelOnOutsidePress(Boolean(editingTask || drafting), () => {
    if (editingTask) actions.cancelEdit(editingTask.id);
    if (drafting) actions.cancelDraft(selected.personId);
  });

  return (
    <div
      data-region="todo-mobile"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: removed ? "16px 16px 80px" : "16px 16px 12px",
        boxSizing: "border-box",
      }}
    >
      <PhoneHeader clock={clock} weather={weather} />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "2px 0 0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: 400,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {openAll} åpne · {doneCount} fullført
        </div>
        <ClearDoneButton disabled={doneCount === 0} onClick={actions.clearDone} />
      </div>

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
        {selected.tasks.map((task) => {
          const card = (
            <TaskCard
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
              onSave={() => actions.saveEdit(task)}
              onDelete={() => actions.deleteTask(task.id)}
            />
          );
          if (task.editing) return <div key={task.id}>{card}</div>;
          return (
            <SwipeRow
              key={task.id}
              open={revealedId === task.id}
              onOpenChange={(open) => (open ? actions.reveal(task.id) : actions.closeReveal())}
              onDelete={() => actions.deleteTask(task.id)}
            >
              {card}
            </SwipeRow>
          );
        })}
        {drafting ? (
          <DraftCard
            title={draft.title}
            dueOn={draft.dueOn}
            today={today}
            pickerOpen={pickerId === draftKey(selected.personId)}
            onTitle={(title) => actions.setDraftTitle(selected.personId, title)}
            onDue={(dueOn) => actions.setDraftDue(selected.personId, dueOn)}
            onPicker={(open) => actions.setPickerId(open ? draftKey(selected.personId) : null)}
            onClear={() => {
              actions.setDraftDue(selected.personId, null);
              actions.setPickerId(null);
            }}
            onSave={() => actions.saveDraft(selected.personId)}
          />
        ) : null}
      </div>

      {drafting ? null : (
        <button
          type="button"
          onClick={() => actions.openDraft(selected.personId)}
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

      {editingTask || drafting ? (
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

      {removed ? (
        <div
          role="status"
          data-toast="phone"
          style={{
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
          }}
        >
          <Trash2 size={16} color="var(--text-muted)" />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--text)",
            }}
          >
            «{removed.task.title}» slettet
          </span>
          <button type="button" onClick={actions.undo} style={undoPill}>
            <Undo2 size={14} color="var(--accent)" />
            Angre
          </button>
        </div>
      ) : null}
    </div>
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

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    function end(event: PointerEvent) {
      finishRef.current(event);
    }
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

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

const EDIT_TOP_GAP = 12;

function scrollingAncestor(node: HTMLElement): HTMLElement {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
    const main = document.querySelector<HTMLElement>(".shell-main");
    if (main) return main;
  }
  let parent = node.parentElement;
  while (parent && parent !== document.documentElement) {
    const overflow = getComputedStyle(parent).overflowY;
    if (/(auto|scroll)/.test(overflow) && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }
    parent = parent.parentElement;
  }
  const main = document.querySelector<HTMLElement>(".shell-main");
  if (main && main.scrollHeight > main.clientHeight + 1) return main;
  return document.documentElement;
}

function safeAreaInsetTop(): number {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;inset:0 auto auto 0;height:env(safe-area-inset-top,0px);width:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

function stickyTopOffset(scroller: HTMLElement): number {
  const origin = scroller === document.documentElement || scroller === document.body ? 0 : scroller.getBoundingClientRect().top;
  const scope = scroller === document.documentElement ? document.body : scroller;
  let offset = 0;
  for (const el of scope.querySelectorAll<HTMLElement>("*")) {
    const position = getComputedStyle(el).position;
    if (position !== "sticky" && position !== "fixed") continue;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0 || rect.bottom <= origin) continue;
    if (rect.top <= origin + 1) offset = Math.max(offset, rect.bottom - origin);
  }
  return offset;
}

function isPhoneLayout(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

function scrollEditCardToTop(node: HTMLElement) {
  if (!isPhoneLayout() || node.getClientRects().length === 0) return;
  const parent = scrollingAncestor(node);
  const parentTop = parent === document.documentElement || parent === document.body ? 0 : parent.getBoundingClientRect().top;
  const topPad = Math.max(safeAreaInsetTop(), stickyTopOffset(parent)) + EDIT_TOP_GAP;
  const delta = node.getBoundingClientRect().top - parentTop - topPad;
  if (Math.abs(delta) < 1) return;
  parent.scrollTop += delta;
}

function useScrollEditIntoView(active: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const run = () => scrollEditCardToTop(node);
    run();
    const frame = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(frame);
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => scrollEditCardToTop(node));
    return () => window.cancelAnimationFrame(frame);
  }, [active]);
  return ref;
}

function usePopoverRoom(open: boolean) {
  const [reserved, setReserved] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) setReserved(0);
  }, [open]);
  useLayoutEffect(() => {
    if (!open || reserved <= 0) return;
    const node = ref.current?.querySelector<HTMLElement>("[data-frist-popover]");
    if (!node) return;
    const parent = scrollingAncestor(node);
    const rect = node.getBoundingClientRect();
    const limit = parent === document.documentElement ? window.innerHeight - 88 : parent.getBoundingClientRect().bottom;
    const overflow = rect.bottom - (limit - 16);
    if (overflow > 0) parent.scrollTop += overflow;
  }, [open, reserved]);
  return { reserved, setReserved, ref };
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
  onSave: () => void;
  onDelete: () => void;
}) {
  const editing = Boolean(task.editing);
  const dueLabel = task.dueOn ? fristLabel(task.dueOn, today) : (task.due ?? null);
  const dueOverdue = task.dueOn ? isOverdue(task.dueOn, today) : Boolean(task.overdue);
  const showDue = Boolean(dueLabel) && !task.done && !editing;
  const room = usePopoverRoom(pickerOpen);
  const scrollRef = useScrollEditIntoView(editing);
  return (
    <div ref={room.ref}>
    <article
      ref={scrollRef}
      data-task={task.id}
      data-editing={editing ? "true" : undefined}
      data-done={task.done ? "true" : undefined}
      onClick={() => {
        if (!editing) onOpen();
      }}
      data-todo-editor={editing ? "true" : undefined}
      style={{
        position: "relative",
        zIndex: pickerOpen ? 40 : undefined,
        scrollMarginTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
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
        cursor: editing ? "auto" : "pointer",
      }}
    >
      {editing ? (
        <TodoEditor
          phone
          title={task.title}
          dueOn={task.dueOn ?? null}
          today={today}
          pickerOpen={pickerOpen}
          onTitle={onTitle}
          onDue={onDue}
          onPicker={onPicker}
          onClear={onClear}
          onSave={onSave}
          onDelete={onDelete}
          onReserve={room.setReserved}
          autoFocus
        />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 11, width: "100%" }}>
            <CheckBox done={Boolean(task.done)} label={task.title} onToggle={onToggle} />
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
          </div>
          {showDue ? <DueRow due={dueLabel ?? ""} overdue={dueOverdue} /> : null}
        </>
      )}
    </article>
    {room.reserved > 0 ? <div aria-hidden style={{ height: room.reserved }} /> : null}
    </div>
  );
}

function DraftCard({
  title,
  dueOn,
  today,
  pickerOpen,
  onTitle,
  onDue,
  onPicker,
  onClear,
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
  onSave: () => void;
}) {
  const room = usePopoverRoom(pickerOpen);
  const scrollRef = useScrollEditIntoView(true);
  return (
    <div ref={room.ref}>
    <article
      ref={scrollRef}
      data-draft="true"
      data-todo-editor="true"
      style={{
        position: "relative",
        zIndex: pickerOpen ? 40 : undefined,
        scrollMarginTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
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
      <TodoEditor
        phone
        title={title}
        dueOn={dueOn}
        today={today}
        pickerOpen={pickerOpen}
        onTitle={onTitle}
        onDue={onDue}
        onPicker={onPicker}
        onClear={onClear}
        onSave={onSave}
        onReserve={room.setReserved}
        autoFocus
      />
    </article>
    {room.reserved > 0 ? <div aria-hidden style={{ height: room.reserved }} /> : null}
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
        paddingLeft: 33,
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

const undoPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
  padding: "8px 13px",
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--tile-3)",
  color: "var(--accent)",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  lineHeight: "normal",
  fontWeight: 400,
};
