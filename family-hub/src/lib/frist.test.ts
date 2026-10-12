import assert from "node:assert/strict";
import { test } from "node:test";
import { fristButtonLabel, fristLabel, isOverdue, nextMonday, parseDueOn } from "./frist.ts";

const today = "2026-10-03";

test("labels a frist against the Oslo day", () => {
  assert.equal(fristLabel(null, today), null);
  assert.equal(fristLabel(undefined, today), null);
  assert.equal(fristLabel("2026-10-02", today), "i går");
  assert.equal(fristLabel("2026-10-03", today), "i dag");
  assert.equal(fristLabel("2026-10-04", today), "i morgen");
  assert.equal(fristLabel("2026-10-05", today), "mandag");
  assert.equal(fristLabel("2026-10-06", today), "tirsdag");
  assert.equal(fristLabel("2026-10-07", today), "onsdag");
  assert.equal(fristLabel("2026-10-08", today), "torsdag");
  assert.equal(fristLabel("2026-10-09", today), "fredag");
  assert.equal(fristLabel("2026-10-10", today), "10.10");
  assert.equal(fristLabel("2026-10-31", today), "31.10");
  assert.equal(fristLabel("2026-11-12", today), "12.11");
  assert.equal(fristLabel("2026-09-28", today), "28.09");
  assert.equal(fristLabel("2025-10-06", today), "06.10");
  assert.equal(fristLabel("2026-10-05", "2026-10-04"), "i morgen");
});

test("the edit button capitalises a word and keeps a numeric day", () => {
  assert.equal(fristButtonLabel(null, today), "Frist");
  assert.equal(fristButtonLabel("2026-10-03", today), "I dag");
  assert.equal(fristButtonLabel("2026-10-04", today), "I morgen");
  assert.equal(fristButtonLabel("2026-10-02", today), "I går");
  assert.equal(fristButtonLabel("2026-10-06", today), "Tirsdag");
  assert.equal(fristButtonLabel("2026-10-31", today), "31.10");
});

test("a date before today is overdue", () => {
  assert.equal(isOverdue("2026-10-02", today), true);
  assert.equal(isOverdue("2026-09-28", today), true);
  assert.equal(isOverdue("2026-10-03", today), false);
  assert.equal(isOverdue("2026-10-04", today), false);
  assert.equal(isOverdue(null, today), false);
  assert.equal(isOverdue("i går", today), false);
});

test("rejects a frist that is not a real date", () => {
  assert.equal(parseDueOn("2026-02-31"), undefined);
  assert.equal(parseDueOn("31.10"), undefined);
  assert.equal(parseDueOn("i morgen"), undefined);
  assert.equal(parseDueOn("2026-10-3"), undefined);
  assert.equal(parseDueOn(""), undefined);
  assert.equal(parseDueOn(20261003), undefined);
  assert.equal(parseDueOn(null), null);
  assert.equal(parseDueOn("2026-10-03"), "2026-10-03");
});

test("next Monday is seven days ahead when today is Monday", () => {
  assert.equal(nextMonday("2026-10-03"), "2026-10-05");
  assert.equal(nextMonday("2026-10-04"), "2026-10-05");
  assert.equal(nextMonday("2026-10-05"), "2026-10-12");
});
