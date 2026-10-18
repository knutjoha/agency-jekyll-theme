import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aislesFromRows,
  daysFromRows,
  dinnerPeriod,
  emptyDinnerDays,
  lanesFromRows,
  parseDinnerDaySave,
  parseDinnerDays,
  parseShoppingCreate,
  parseShoppingDelete,
  parseTodoCreate,
  parseTodoDelete,
  parseTodoPatch,
  type DinnerDayRow,
  type LaneTemplate,
  type TodoRow,
} from "./map.ts";

const lanes: LaneTemplate[] = [
  { personId: "knut", detail: "Pappa" },
  { personId: "ulla", detail: "Mamma" },
];

test("derives the frist from due_on and ignores a stored label", () => {
  const rows: TodoRow[] = [
    {
      id: "b",
      person_id: "knut",
      title: "Second",
      description: "",
      due_on: "2026-10-04",
      done: false,
      sort_order: 2,
    },
    {
      id: "a",
      person_id: "knut",
      title: "First",
      description: "later",
      due_on: null,
      done: true,
      sort_order: 1,
    },
    {
      id: "late",
      person_id: "ulla",
      title: "Late",
      description: "",
      due_on: "2026-10-02",
      done: false,
      sort_order: 0,
    },
    {
      id: "ahead",
      person_id: "ulla",
      title: "Ahead",
      description: "",
      due_on: "2026-10-31T00:00:00",
      done: false,
      sort_order: 1,
    },
    {
      id: "stray",
      person_id: "guest",
      title: "No",
      description: "",
      due_on: null,
      done: false,
      sort_order: 0,
    },
  ];

  const result = lanesFromRows(rows, lanes, "2026-10-03");
  assert.deepEqual(
    result.map((lane) => ({ person: lane.personId, titles: lane.tasks.map((task) => task.title) })),
    [
      { person: "knut", titles: ["First", "Second"] },
      { person: "ulla", titles: ["Late", "Ahead"] },
    ],
  );
  assert.equal(result[0]?.tasks[1]?.due, "i morgen");
  assert.equal(result[0]?.tasks[1]?.dueOn, "2026-10-04");
  assert.equal(result[0]?.tasks[1]?.overdue, undefined);
  assert.equal(result[0]?.tasks[0]?.done, true);
  assert.equal(result[0]?.tasks[0]?.due, undefined);
  assert.equal(result[0]?.tasks[0]?.sortOrder, 1);
  assert.equal(result[1]?.tasks[0]?.due, "i går");
  assert.equal(result[1]?.tasks[0]?.overdue, true);
  assert.equal(result[1]?.tasks[1]?.due, "31.10");
  assert.equal(result[1]?.tasks[1]?.overdue, undefined);
});

test("requires all seven dinner days and keeps ingredients on the meal", () => {
  const week = { id: "2026-09-28", starts_on: "2026-09-28", period: "28.09 – 04.10" };
  const base: DinnerDayRow = {
    id: "man",
    weekday: "mandag",
    date_label: "28.09",
    sort_order: 0,
    meal_id: "wok",
    meal_title: "Kyllingwok med nudler",
    meal_minutes: 30,
  };
  assert.equal(daysFromRows(week, [base]), null);

  const days = ["man", "tir", "ons", "tor", "fre", "lor", "son"].map((id, index) => ({
    ...base,
    id,
    sort_order: index,
    meal_id: id === "fre" ? null : `${base.meal_id}-${id}`,
    meal_title: id === "fre" ? null : base.meal_title,
    meal_minutes: id === "fre" ? null : base.meal_minutes,
  }));
  const menu = daysFromRows(week, days, [
    { meal_id: "wok-man", id: "kylling", name: "Kylling", amount: "600 g", sort_order: 0 },
  ]);
  assert.equal(menu?.startsOn.month, 9);
  assert.equal(menu?.days[4]?.meal, null);
  assert.equal(menu?.days[0]?.meal && "diets" in menu.days[0].meal, false);
  assert.deepEqual(menu?.days[0]?.meal?.ingredients, [{ id: "kylling", name: "Kylling", amount: "600 g" }]);
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
  assert.equal(created.ok && created.value.dueOn, null);
  assert.equal(created.ok && created.value.done, false);
  assert.equal(created.ok && created.value.sortOrder, null);
  const restored = parseTodoCreate({
    id: "knut-eu",
    personId: "knut",
    title: "Bestille",
    dueOn: "2026-10-31",
    done: true,
    sortOrder: 0,
  });
  assert.equal(restored.ok && restored.value.dueOn, "2026-10-31");
  assert.equal(restored.ok && restored.value.done, true);
  assert.equal(restored.ok && restored.value.sortOrder, 0);
  assert.equal(parseTodoCreate({ id: "knut-eu", personId: "knut", title: "Ok", dueOn: "i morgen" }).ok, false);
  assert.equal(parseTodoCreate({ id: "knut-eu", personId: "knut", title: "Ok", sortOrder: 1.5 }).ok, false);

  assert.equal(parseTodoPatch({ id: "knut-eu" }).ok, false);
  assert.equal(parseTodoPatch({ id: "knut-eu", done: true }).ok, true);
  const onlyDue = parseTodoPatch({ id: "knut-eu", dueOn: null });
  assert.equal(onlyDue.ok && onlyDue.value.dueOn, null);
  assert.equal(onlyDue.ok && onlyDue.value.title, undefined);
  assert.equal(parseTodoPatch({ id: "knut-eu", dueOn: "2026-10-03" }).ok, true);
  assert.equal(parseTodoPatch({ id: "knut-eu", dueOn: "2026-02-31" }).ok, false);
  assert.equal(parseTodoPatch({ id: "knut-eu", dueOn: "31.10" }).ok, false);
  assert.equal(parseTodoPatch({ id: "knut-eu", dueOn: "i morgen" }).ok, false);
  assert.equal(parseTodoDelete({ id: "knut-eu" }).ok, true);
  assert.equal(parseTodoDelete({ id: "../x" }).ok, false);
  assert.equal(parseTodoDelete({}).ok, false);

  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: "Melk", quantity: "1 l", week: "2026-10-05" }).ok, true);
  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: "Melk", quantity: "" }).ok, false);
  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: "Melk", quantity: "1 l" }).ok, false);
  assert.equal(parseShoppingDelete({ id: "melk" }).ok, true);
  assert.equal(parseShoppingDelete({ id: "../x" }).ok, false);
  assert.equal(parseShoppingDelete({}).ok, false);

  const days = ["man", "tir", "ons", "tor", "fre", "lor", "son"].map((id) =>
    id === "fre"
      ? { id, meal: null }
      : { id, meal: { id: `wok-${id}`, title: "Wok", minutes: 30, diets: ["Glutenfri"], editing: true } },
  );
  const parsed = parseDinnerDays({ week: "2026-10-05", days });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.days[1]?.meal?.title, "Wok");
    assert.equal(parsed.value.days[1]?.meal && "diets" in parsed.value.days[1].meal, false);
  }
  assert.equal(parseDinnerDays({ week: "2026-10-05", days: days.slice(0, 6) }).ok, false);
  const withoutDiets = days.map((day) =>
    day.meal ? { id: day.id, meal: { id: day.meal.id, title: day.meal.title, minutes: day.meal.minutes } } : day,
  );
  assert.equal(parseDinnerDays({ week: "2026-10-05", days: withoutDiets }).ok, true);
});

test("a repeated meal id in one week fails", () => {
  const days = ["man", "tir", "ons", "tor", "fre", "lor", "son"].map((id) => ({
    id,
    meal: id === "fre" ? null : { id: id === "tir" ? "wok-man" : `wok-${id}`, title: "Wok", minutes: 30 },
  }));
  assert.equal(parseDinnerDays({ week: "2026-10-05", days }).ok, false);
});

test("ingredient name and amount limits match the shopping limits", () => {
  const name200 = "a".repeat(200);
  const name201 = "a".repeat(201);
  const amount40 = "b".repeat(40);
  const amount41 = "b".repeat(41);
  const body = (name: string, amount: string) => ({
    week: "2026-10-12",
    dayId: "fre",
    meal: { id: "taco", title: "Taco", minutes: 30 },
    ingredients: [{ id: "kjottdeig", name, amount }],
  });
  assert.equal(parseDinnerDaySave(body(name200, amount40)).ok, true);
  assert.equal(parseDinnerDaySave(body(name201, amount40)).ok, false);
  assert.equal(parseDinnerDaySave(body(name200, amount41)).ok, false);
  assert.equal(parseDinnerDaySave(body("  ", "400 g")).ok, false);
  assert.equal(parseDinnerDaySave(body("Kjøttdeig", "  ")).ok, false);
  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: name200, quantity: amount40, week: "2026-10-05" }).ok, true);
  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: name201, quantity: amount40, week: "2026-10-05" }).ok, false);
  assert.equal(parseShoppingCreate({ id: "melk", aisleId: "meieri", name: name200, quantity: amount41, week: "2026-10-05" }).ok, false);
});

test("a dinner save does not produce shopping lines", () => {
  const saved = parseDinnerDaySave({
    week: "2026-10-12",
    dayId: "fre",
    meal: { id: "taco", title: "Taco", minutes: 30 },
    ingredients: [
      { id: "kjottdeig", name: "Kjøttdeig", amount: "400 g" },
      { id: "lefse", name: "Lefser", amount: "8 stk" },
    ],
  });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal("aisles" in saved.value, false);
  assert.equal(Object.keys(saved.value).sort().join(" "), "dayId ingredients meal week");
  assert.equal(saved.value.ingredients.length, 2);
});

test("a new Monday builds the dinner period from that Monday", () => {
  assert.equal(dinnerPeriod("2026-10-05"), "05.10 – 11.10");
  assert.equal(emptyDinnerDays("2026-10-05")[0]?.date, "05.10");
  assert.equal(emptyDinnerDays("2026-10-05")[6]?.date, "11.10");
  assert.equal(emptyDinnerDays("2026-10-05")[6]?.meal, null);
});
