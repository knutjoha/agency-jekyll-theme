import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aislesFromRows,
  daysFromRows,
  lanesFromRows,
  parseDinnerDays,
  parseShoppingCreate,
  parseTodoCreate,
  parseTodoPatch,
  type DinnerDayRow,
  type LaneTemplate,
  type TodoRow,
} from "./map.ts";

const lanes: LaneTemplate[] = [
  { personId: "knut", detail: "Pappa" },
  { personId: "ulla", detail: "Mamma" },
];

test("groups todos onto the fixture lanes and keeps due text", () => {
  const rows: TodoRow[] = [
    {
      id: "b",
      person_id: "knut",
      title: "Second",
      description: "",
      due_label: "i morgen",
      done: false,
      overdue: false,
      sort_order: 2,
    },
    {
      id: "a",
      person_id: "knut",
      title: "First",
      description: "later",
      due_label: null,
      done: true,
      overdue: false,
      sort_order: 1,
    },
    {
      id: "late",
      person_id: "ulla",
      title: "Late",
      description: "",
      due_label: "i går",
      done: false,
      overdue: true,
      sort_order: 0,
    },
    {
      id: "stray",
      person_id: "guest",
      title: "No",
      description: "",
      due_label: null,
      done: false,
      overdue: false,
      sort_order: 0,
    },
  ];

  const result = lanesFromRows(rows, lanes);
  assert.deepEqual(
    result.map((lane) => ({ person: lane.personId, titles: lane.tasks.map((task) => task.title) })),
    [
      { person: "knut", titles: ["First", "Second"] },
      { person: "ulla", titles: ["Late"] },
    ],
  );
  assert.equal(result[0]?.tasks[1]?.due, "i morgen");
  assert.equal(result[0]?.tasks[0]?.done, true);
  assert.equal(result[1]?.tasks[0]?.overdue, true);
  assert.equal(result[0]?.tasks[0]?.due, undefined);
});

test("requires all seven dinner days", () => {
  const week = { id: "current", starts_on: "2026-09-28", period: "28.09 – 04.10" };
  const base: DinnerDayRow = {
    id: "man",
    weekday: "mandag",
    date_label: "28.09",
    sort_order: 0,
    meal_id: "wok",
    meal_title: "Kyllingwok med nudler",
    meal_minutes: 30,
    meal_diets: ["Glutenfri"],
  };
  assert.equal(daysFromRows(week, [base]), null);

  const days = ["man", "tir", "ons", "tor", "fre", "lor", "son"].map((id, index) => ({
    ...base,
    id,
    sort_order: index,
    meal_id: id === "fre" ? null : base.meal_id,
    meal_title: id === "fre" ? null : base.meal_title,
    meal_minutes: id === "fre" ? null : base.meal_minutes,
    meal_diets: id === "fre" ? [] : ["Laktosefri", "Glutenfri"],
  }));
  const menu = daysFromRows(week, days);
  assert.equal(menu?.startsOn.month, 9);
  assert.equal(menu?.days[4]?.meal, null);
  assert.deepEqual(menu?.days[0]?.meal?.diets, ["Laktosefri", "Glutenfri"]);
});

test("rejects a shopping list with no aisles", () => {
  assert.equal(aislesFromRows([], []), null);
  const aisles = aislesFromRows(
    [
      { id: "b", label: "B", sort_order: 1 },
      { id: "a", label: "A", sort_order: 0 },
    ],
    [
      { id: "2", aisle_id: "a", name: "Løk", quantity: "1 stk", done: true, sort_order: 1 },
      { id: "1", aisle_id: "a", name: "Paprika", quantity: "2 stk", done: false, sort_order: 0 },
    ],
  );
  assert.equal(aisles?.[0]?.label, "A");
  assert.equal(aisles?.[0]?.items[1]?.done, true);
  assert.equal(aisles?.[1]?.items.length, 0);
});

test("parses writes and drops anything that is not a list field", () => {
  assert.equal(parseTodoCreate({ id: "../x", personId: "knut", title: "Ok" }).ok, false);
  assert.equal(parseTodoCreate({ id: "knut-ny", personId: "guest", title: "Ok" }).ok, false);
  const created = parseTodoCreate({ id: "11111111-1111-1111-1111-111111111111", personId: "maja", title: "  Rydde  " });
  assert.equal(created.ok && created.value.title, "Rydde");

  assert.equal(parseTodoPatch({ id: "knut-eu" }).ok, false);
  assert.equal(parseTodoPatch({ id: "knut-eu", done: true }).ok, true);

  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: "Melk", quantity: "1 l" }).ok, true);
  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: "Melk", quantity: "" }).ok, false);

  const days = ["man", "tir", "ons", "tor", "fre", "lor", "son"].map((id) =>
    id === "fre"
      ? { id, meal: null }
      : { id, meal: { id: "wok", title: "Wok", minutes: 30, diets: ["Glutenfri"], editing: true } },
  );
  const parsed = parseDinnerDays({ days });
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value[1]?.meal?.title, "Wok");
  assert.equal(parseDinnerDays({ days: days.slice(0, 6) }).ok, false);
});
