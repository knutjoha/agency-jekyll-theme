import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BASE_NOK,
  MINUS,
  SKIP_NOK,
  emptyWeek,
  extraDraftValid,
  formatKr,
  nextSkips,
  parseAmount,
  parseBasicWrite,
  parseExtraCreate,
  parseExtraDelete,
  parseExtraPatch,
  parseLockWrite,
  parseMondayWeek,
  parseSkipWrite,
  shownNok,
  skipLabel,
  weekFromParts,
  writesAllowed,
} from "./model.ts";

test("BASE_NOK is 50 and the formula is 50 + extras − 10 * skips", () => {
  assert.equal(BASE_NOK, 50);
  assert.equal(SKIP_NOK, 10);
  assert.equal(shownNok(0, []), 50);
  assert.equal(shownNok(1, []), 40);
  assert.equal(shownNok(2, [{ amountNok: 50, done: true }]), 80);
  assert.equal(shownNok(0, [{ amountNok: 50 }]), 50);
  assert.equal(shownNok(0, [{ amountNok: 50, done: false }]), 50);
  assert.equal(shownNok(0, [{ amountNok: 50, done: true }]), 100);
  assert.equal(shownNok(5, []), 0);
  assert.equal(shownNok(6, []), -10);
});

test("plus and minus bound skips at 0 and have no cap at four", () => {
  assert.equal(nextSkips(0, -1), 0);
  assert.equal(nextSkips(0, 1), 1);
  assert.equal(nextSkips(2, -1), 1);
  assert.equal(nextSkips(4, 1), 5);
  assert.equal(skipLabel(0), "0");
  assert.equal(skipLabel(1), `${MINUS}10`);
  assert.equal(skipLabel(2), `${MINUS}20`);
  assert.equal(skipLabel(5), `${MINUS}50`);
  assert.equal(formatKr(50), "50 kr");
  assert.equal(formatKr(-10), `${MINUS}10 kr`);
});

test("extras need a title and a positive integer amount, with no cap", () => {
  assert.equal(extraDraftValid("Støvsuge 1. etasje", "50"), true);
  assert.equal(extraDraftValid("  ", "50"), false);
  assert.equal(extraDraftValid("Støvsuge", "0"), false);
  assert.equal(extraDraftValid("Støvsuge", "-10"), false);
  assert.equal(extraDraftValid("Støvsuge", "1.5"), false);
  assert.equal(parseAmount(50), 50);
  assert.equal(parseAmount(100000), 100000);
  assert.equal(parseAmount(0), null);
  assert.equal(parseAmount("050"), null);
});

test("week id must be a Monday, like Middag", () => {
  assert.equal(parseMondayWeek("2026-10-05"), "2026-10-05");
  assert.equal(parseMondayWeek("2026-10-11"), null);
  assert.equal(parseMondayWeek("2026-10-06"), null);
  const week = emptyWeek(new Date("2026-10-11T12:00:00.000Z"));
  assert.equal(week.week, "2026-10-05");
  assert.equal(week.locked, false);
  assert.equal(week.pool.length, 0);
  assert.equal(week.lanes.length, 3);
  assert.deepEqual(
    week.lanes.map((lane) => lane.personId),
    ["amelia", "hedda", "maja"],
  );
  assert.equal(
    week.lanes.every((lane) => lane.skips === 0 && lane.extras.length === 0),
    true,
  );
});

test("writes parse daughters only and reject a locked week at the guard", () => {
  assert.equal(writesAllowed(false), true);
  assert.equal(writesAllowed(true), false);

  const skip = parseSkipWrite({ week: "2026-10-05", personId: "hedda", skips: 0 });
  assert.equal(skip.ok && skip.value.skips, 0);
  assert.equal(parseSkipWrite({ week: "2026-10-05", personId: "hedda", skips: -1 }).ok, false);
  assert.equal(parseSkipWrite({ week: "2026-10-05", personId: "ulla", skips: 1 }).ok, false);
  assert.equal(parseSkipWrite({ week: "2026-10-05", personId: "knut", skips: 1 }).ok, false);

  const extra = parseExtraCreate({
    week: "2026-10-05",
    personId: "maja",
    id: "11111111-1111-1111-1111-111111111111",
    title: "  Støvsuge 1. etasje  ",
    amountNok: 50,
  });
  assert.equal(extra.ok && extra.value.title, "Støvsuge 1. etasje");
  assert.equal(extra.ok && extra.value.amountNok, 50);
  assert.equal(
    parseExtraCreate({
      week: "2026-10-05",
      personId: "maja",
      id: "x",
      title: "",
      amountNok: 50,
    }).ok,
    false,
  );
  assert.equal(parseExtraPatch({ week: "2026-10-05", id: "x", title: "Ok", amountNok: 20 }).ok, true);
  assert.equal(parseExtraPatch({ week: "2026-10-05", id: "x" }).ok, false);
  const poolCreate = parseExtraCreate({
    week: "2026-10-05",
    personId: "pool",
    id: "p",
    title: "Tømme oppvaskmaskin",
    amountNok: 20,
    done: true,
  });
  assert.equal(poolCreate.ok && poolCreate.value.personId, "pool");
  assert.equal(poolCreate.ok && poolCreate.value.done, false);
  const claim = parseExtraPatch({ week: "2026-10-05", id: "p", personId: "amelia" });
  assert.equal(claim.ok && claim.value.personId, "amelia");
  const complete = parseExtraPatch({ week: "2026-10-05", id: "p", done: true });
  assert.equal(complete.ok && complete.value.done, true);
  const backToPool = parseExtraPatch({ week: "2026-10-05", id: "p", personId: "pool", done: true });
  assert.equal(backToPool.ok && backToPool.value.personId, "pool");
  assert.equal(backToPool.ok && backToPool.value.done, false);
  assert.equal(parseExtraDelete({ week: "2026-10-05", id: "x" }).ok, true);
  assert.equal(parseBasicWrite({ id: "gangen", title: "Ryddig i gangen" }).ok, true);
  assert.equal(parseBasicWrite({ id: "other", title: "Nope" }).ok, false);
  assert.equal(parseLockWrite({ week: "2026-10-05" }).ok, true);
  assert.equal(parseLockWrite({ week: "2026-10-06" }).ok, false);
});

test("weekFromParts keeps a locked week locked and drops parent extras", () => {
  const week = weekFromParts({
    week: "2026-10-05",
    locked: true,
    lockedAt: "2026-10-11T18:00:00.000Z",
    basics: [{ id: "gangen", title: "Sko i hylla" }],
    skips: { amelia: 2, hedda: -3 },
    extras: [
      { id: "a", personId: "maja", title: "Støvsuge", amountNok: 50, done: true },
      { id: "b", personId: "ulla", title: "Nope", amountNok: 10 },
      { id: "c", personId: "pool", title: "Tømme oppvaskmaskin", amountNok: 20 },
    ],
  });
  assert.equal(week?.locked, true);
  assert.equal(week?.lanes.find((lane) => lane.personId === "amelia")?.skips, 2);
  assert.equal(week?.lanes.find((lane) => lane.personId === "hedda")?.skips, 0);
  assert.equal(week?.lanes.find((lane) => lane.personId === "maja")?.extras[0]?.amountNok, 50);
  assert.equal(week?.lanes.find((lane) => lane.personId === "maja")?.extras[0]?.done, true);
  assert.equal(week?.lanes.find((lane) => lane.personId === "amelia")?.extras.length, 0);
  assert.equal(week?.pool.length, 1);
  assert.equal(week?.pool[0]?.title, "Tømme oppvaskmaskin");
  assert.equal(week?.pool[0]?.done, false);
  assert.equal(week?.basics[0]?.title, "Sko i hylla");
  assert.equal(week?.basics[1]?.title, "Ta ut av gymbagen");
  assert.equal(shownNok(2, []), 30);
});
