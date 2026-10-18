import assert from "node:assert/strict";
import { test } from "node:test";
import { collectDone, withoutDone } from "./clear-done.ts";
import type { TodoLane } from "../../data/types.ts";

const lanes: TodoLane[] = [
  {
    personId: "knut",
    detail: "Pappa",
    tasks: [
      { id: "open", title: "Åpen" },
      { id: "done-knut", title: "Ferdig", done: true, editing: true },
    ],
  },
  {
    personId: "ulla",
    detail: "Mamma",
    tasks: [{ id: "done-ulla", title: "Også ferdig", done: true }],
  },
  {
    personId: "amelia",
    detail: "8A",
    tasks: [{ id: "school", title: "Lekser" }],
  },
];

test("collects completed tasks from every lane", () => {
  const done = collectDone(lanes);
  assert.deepEqual(
    done.map((item) => item.task.id),
    ["done-knut", "done-ulla"],
  );
  assert.equal(done[0].personId, "knut");
  assert.equal(done[0].index, 1);
  assert.equal(done[0].task.editing, false);
  assert.equal(done[1].personId, "ulla");
});

test("drops completed tasks and keeps open ones", () => {
  const next = withoutDone(lanes);
  assert.deepEqual(
    next.map((lane) => lane.tasks.map((task) => task.id)),
    [["open"], [], ["school"]],
  );
});
