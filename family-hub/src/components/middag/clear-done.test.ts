import assert from "node:assert/strict";
import { test } from "node:test";
import { collectDone, insertItem, withoutDone } from "./clear-done.ts";
import type { GroceryAisle } from "../../data/types.ts";

const aisles: GroceryAisle[] = [
  {
    id: "gront",
    label: "Frukt og grønt",
    items: [
      { id: "paprika", name: "Paprika", quantity: "2 stk" },
      { id: "lok", name: "Løk", quantity: "3 stk", done: true },
      { id: "sitron", name: "Sitron", quantity: "2 stk" },
    ],
  },
  {
    id: "meieri",
    label: "Meieri, laktosefritt",
    items: [{ id: "smor", name: "Smør", quantity: "1 pk", done: true }],
  },
  {
    id: "kjott",
    label: "Kjøtt og fisk",
    items: [{ id: "laks", name: "Laksefilet", quantity: "800 g" }],
  },
];

test("collects completed shopping items from every aisle", () => {
  const done = collectDone(aisles);
  assert.deepEqual(
    done.map((entry) => entry.item.id),
    ["lok", "smor"],
  );
  assert.equal(done[0].aisleId, "gront");
  assert.equal(done[0].index, 1);
  assert.equal(done[1].aisleId, "meieri");
  assert.equal(done[1].index, 0);
});

test("drops completed items and keeps open ones", () => {
  const next = withoutDone(aisles);
  assert.deepEqual(
    next.map((aisle) => aisle.items.map((item) => item.id)),
    [["paprika", "sitron"], [], ["laks"]],
  );
});

test("restores a failed delete at its aisle index", () => {
  const next = insertItem(withoutDone(aisles), {
    aisleId: "gront",
    index: 1,
    item: { id: "lok", name: "Løk", quantity: "3 stk", done: true },
  });
  assert.deepEqual(
    next.map((aisle) => aisle.items.map((item) => item.id)),
    [["paprika", "lok", "sitron"], [], ["laks"]],
  );
});
