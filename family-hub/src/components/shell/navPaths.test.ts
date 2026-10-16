import assert from "node:assert/strict";
import { test } from "node:test";
import { appPathFromHref, isAppPath } from "./navPaths.ts";

test("the five hallway routes are in-app pages", () => {
  assert.equal(isAppPath("/"), true);
  assert.equal(isAppPath("/kalender"), true);
  assert.equal(isAppPath("/todo"), true);
  assert.equal(isAppPath("/middag"), true);
  assert.equal(isAppPath("/verdi"), true);
  assert.equal(isAppPath("/privacy"), false);
  assert.equal(isAppPath("/kalender/extra"), false);
});

test("hrefs keep the path and drop snapshot query", () => {
  assert.equal(appPathFromHref("/todo?snapshot=1"), "/todo");
  assert.equal(appPathFromHref("https://example.com/middag"), "/middag");
  assert.equal(appPathFromHref("/vilkar"), null);
});
