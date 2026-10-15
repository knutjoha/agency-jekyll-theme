import assert from "node:assert/strict";
import test from "node:test";
import { dinnerMenu } from "../../data/middag";
import type { MenuDay } from "../../data/types";
import { formatOslo, SNAPSHOT_AT } from "../oslo";
import {
  DINNER_EMPTY_LABEL,
  dinnerTileForToday,
  isDinnerWeekPayload,
  todayIsoFromClock,
  todayMenuDay,
} from "./today";

const FIXTURE_WEEK = "2026-09-28";

function day(id: string, weekday: string, date: string, title: string | null, ingredients = 0): MenuDay {
  return {
    id,
    weekday,
    date,
    meal: title
      ? {
          id: `m-${id}`,
          title,
          minutes: 30,
          ingredients: Array.from({ length: ingredients }, (_, index) => ({
            id: `i-${index + 1}`,
            name: `Vare ${index + 1}`,
            amount: "1 stk",
          })),
        }
      : null,
  };
}

const liveWeek: MenuDay[] = [
  day("man", "mandag", "12.10", "Kyllingwok"),
  day("tir", "tirsdag", "13.10", "Laksepasta"),
  day("ons", "onsdag", "14.10", null),
  day("tor", "torsdag", "15.10", "Linsesuppe", 4),
  day("fre", "fredag", "16.10", "Taco", 6),
  day("lor", "lørdag", "17.10", null),
  day("son", "søndag", "18.10", "Fiskegrateng"),
];

test("the snapshot Saturday is Oslo 3 October 2026", () => {
  const today = todayIsoFromClock(formatOslo(SNAPSHOT_AT));
  assert.equal(today, "2026-10-03");
});

test("Hjem reads Saturday from the fixture week the same way Middag does", () => {
  const tile = dinnerTileForToday(dinnerMenu.days, FIXTURE_WEEK, "2026-10-03");
  assert.equal(tile.dish, "Ovnsbakt laks med poteter");
  assert.equal(todayMenuDay(dinnerMenu.days, FIXTURE_WEEK, "2026-10-03")?.id, "lor");
});

test("an empty Middag day stays empty on Hjem, not a leftover sample", () => {
  const friday = dinnerTileForToday(dinnerMenu.days, FIXTURE_WEEK, "2026-10-02");
  assert.equal(friday.dish, "");
  assert.equal(friday.shoppingCount, 0);
  assert.equal(DINNER_EMPTY_LABEL, "Ledig");
});

test("a leftover fixture week does not paint a later Oslo day", () => {
  const tile = dinnerTileForToday(dinnerMenu.days, FIXTURE_WEEK, "2026-10-15");
  assert.equal(tile.dish, "");
  assert.equal(tile.shoppingCount, 0);
});

test("today in the current Oslo week is that day's dish and ingredient count", () => {
  const thursday = dinnerTileForToday(liveWeek, "2026-10-12", "2026-10-15");
  assert.equal(thursday.dish, "Linsesuppe");
  assert.equal(thursday.shoppingCount, 4);
  const emptyWednesday = dinnerTileForToday(liveWeek, "2026-10-12", "2026-10-14");
  assert.equal(emptyWednesday.dish, "");
  assert.equal(emptyWednesday.shoppingCount, 0);
});

test("GET /api/dinner shape is accepted when the week has seven days", () => {
  assert.equal(
    isDinnerWeekPayload({ persisted: true, week: "2026-10-12", days: liveWeek }),
    true,
  );
  assert.equal(isDinnerWeekPayload({ persisted: false, week: FIXTURE_WEEK, days: dinnerMenu.days }), true);
  assert.equal(isDinnerWeekPayload({ persisted: true, week: "2026-10-12", days: liveWeek.slice(0, 6) }), false);
  assert.equal(isDinnerWeekPayload({ week: "2026-10-12", days: liveWeek }), false);
});
