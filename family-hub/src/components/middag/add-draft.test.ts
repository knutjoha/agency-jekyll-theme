import assert from "node:assert/strict";
import { test } from "node:test";
import { commitAddDraft } from "./add-draft.ts";

test("a named draft is added and the editor stays open", () => {
  assert.deepEqual(commitAddDraft(" Melk "), { kind: "add", name: "Melk" });
});

test("an empty or whitespace draft closes and does not chain", () => {
  assert.deepEqual(commitAddDraft(""), { kind: "close" });
  assert.deepEqual(commitAddDraft("   "), { kind: "close" });
});
