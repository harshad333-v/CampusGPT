import test from "node:test";
import assert from "node:assert/strict";
import {
  canInvokeAiWithDocumentScope,
  normalizeAccessibleDocumentIds
} from "../src/services/ai-access-policy.js";

test("an empty allow-list never invokes the AI retriever", () => {
  assert.equal(canInvokeAiWithDocumentScope([]), false);
  assert.equal(canInvokeAiWithDocumentScope(null), false);
  assert.equal(canInvokeAiWithDocumentScope(undefined), false);
});

test("accessible document IDs are normalized, de-duplicated, and remain an explicit allow-list", () => {
  const ids = normalizeAccessibleDocumentIds([
    " public-doc ",
    "owned-doc",
    "public-doc",
    "",
    null,
    4
  ]);
  assert.deepEqual(ids, ["public-doc", "owned-doc"]);
  assert.equal(canInvokeAiWithDocumentScope(ids), true);
});
