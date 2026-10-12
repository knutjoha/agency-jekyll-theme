import assert from "node:assert/strict";
import test from "node:test";
import { dinnerPeriod } from "../household/map";
import { osloDateKey } from "../oslo";
import {
  assignPlanIds,
  bearerMatches,
  dayWriteSet,
  dinnerPrompt,
  parseModelJson,
  proposalsFromModel,
  targetMonday,
  weekWriteSet,
} from "./week";

test("Sunday 11 October 2026 plans the following Monday", () => {
  const sunday = new Date("2026-10-11T10:00:00.000Z");
  assert.equal(osloDateKey(sunday), "2026-10-11");
  assert.equal(targetMonday(sunday), "2026-10-12");
  assert.equal(dinnerPeriod(targetMonday(sunday)), "12.10 – 18.10");
});

test("Wednesday 14 October 2026 plans the Monday of that week", () => {
  const wednesday = new Date("2026-10-14T10:00:00.000Z");
  assert.equal(osloDateKey(wednesday), "2026-10-14");
  assert.equal(targetMonday(wednesday), "2026-10-12");
});

test("a day that already has a meal is left out of the week write set", () => {
  const proposals = proposalsFromModel({
    days: [
      { id: "man", title: "Ny lapskaus", minutes: 40, ingredients: [{ name: "Potet", amount: "6 stk" }] },
      { id: "tir", title: "Suppe", minutes: 25, ingredients: [{ name: "Gulrot", amount: "3 stk" }] },
    ],
  });
  const writes = weekWriteSet(
    [
      { id: "man", meal: { title: "Lapskaus" } },
      { id: "tir", meal: null },
    ],
    proposals,
  );
  assert.deepEqual(
    writes.map((meal) => meal.id),
    ["tir"],
  );
});

test("a proposal with no valid ingredient is left out", () => {
  const proposals = proposalsFromModel({
    days: [
      { id: "ons", title: "Tom", minutes: 20, ingredients: [] },
      { id: "tor", title: "Tom", minutes: 20, ingredients: [{ name: " ", amount: "1" }] },
      { id: "fre", title: "Tom", minutes: 20, ingredients: [{ name: "Ost", amount: " " }] },
      { id: "lor", title: "Gryte", minutes: 35, ingredients: [{ name: "Ost", amount: "1 pk" }] },
    ],
  });
  assert.deepEqual(
    proposals.map((meal) => meal.id),
    ["lor"],
  );
});

test("a diets field is not required and is not kept", () => {
  const withDiets = proposalsFromModel({
    days: [
      {
        id: "son",
        title: "Gryte",
        minutes: 30,
        diets: ["Glutenfri"],
        ingredients: [{ name: "Potet", amount: "4 stk" }],
      },
    ],
  });
  const withoutDiets = proposalsFromModel({
    days: [{ id: "man", title: "Suppe", minutes: 20, ingredients: [{ name: "Gulrot", amount: "2 stk" }] }],
  });
  assert.equal(withDiets.length, 1);
  assert.equal("diets" in withDiets[0], false);
  assert.equal(withDiets[0]?.ingredients[0] && "diets" in withDiets[0].ingredients[0], false);
  assert.equal(withoutDiets.length, 1);
  assert.equal(withoutDiets[0]?.title, "Suppe");
});

test("day scope keeps only the requested day", () => {
  const proposals = proposalsFromModel({
    days: [
      { id: "man", title: "Suppe", minutes: 20, ingredients: [{ name: "Gulrot", amount: "2 stk" }] },
      { id: "tir", title: "Gryte", minutes: 35, ingredients: [{ name: "Potet", amount: "4 stk" }] },
    ],
  });
  assert.deepEqual(
    dayWriteSet("tir", proposals).map((meal) => meal.id),
    ["tir"],
  );
});

test("assigned ids stay unique and match the save pattern", () => {
  const meals = proposalsFromModel({
    days: [
      {
        id: "man",
        title: "Suppe",
        minutes: 20,
        ingredients: [
          { name: "Gulrot", amount: "2 stk" },
          { name: "Løk", amount: "1 stk" },
        ],
      },
      { id: "tir", title: "Gryte", minutes: 35, ingredients: [{ name: "Potet", amount: "4 stk" }] },
    ],
  });
  const assigned = assignPlanIds(meals, ["m-man"]);
  const mealIds = assigned.map((day) => day.meal.id);
  assert.deepEqual(mealIds, ["m-man-2", "m-tir"]);
  for (const day of assigned) {
    assert.match(day.meal.id, /^[a-z0-9][a-z0-9-]{0,79}$/);
    assert.equal("diets" in day.meal, false);
    const ingredientIds = day.ingredients.map((item) => item.id);
    assert.equal(new Set(ingredientIds).size, ingredientIds.length);
  }
});

test("model text that is not JSON does not parse", () => {
  assert.equal(parseModelJson("ikke json"), null);
  assert.deepEqual(parseModelJson('{"days":[]}'), { days: [] });
});

test("the prompt carries the target week and asks for dinners only", () => {
  const prompt = dinnerPrompt({
    household: "Notater",
    monday: "2026-10-12",
    days: [
      { id: "man", weekday: "mandag", date: "12.10", meal: null },
      {
        id: "tir",
        weekday: "tirsdag",
        date: "13.10",
        meal: { title: "Lapskaus", minutes: 40, ingredients: [{ name: "Potet", amount: "6 stk" }] },
      },
    ],
    scope: { kind: "week" },
  });
  assert.equal(prompt.startsWith("Notater\n"), true);
  assert.match(prompt, /Mandag: 2026-10-12/);
  assert.match(prompt, /Søndag: 2026-10-18/);
  assert.match(prompt, /Periode: 12\.10 – 18\.10/);
  assert.match(prompt, /man mandag 12\.10: tom/);
  assert.match(prompt, /Lapskaus, 40 min/);
  assert.match(prompt, /tomme/);
  assert.match(prompt, /bare middager/);
  assert.doesNotMatch(prompt, /diets/);
});

test("cron bearer matches only the configured secret", () => {
  assert.equal(bearerMatches("Bearer secret", undefined), false);
  assert.equal(bearerMatches("Bearer secret", ""), false);
  assert.equal(bearerMatches(null, "secret"), false);
  assert.equal(bearerMatches("Bearer other", "secret"), false);
  assert.equal(bearerMatches("Bearer secret", "secret"), true);
});
