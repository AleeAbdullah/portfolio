// Run with `node --test scripts/indexnow.test.mjs`.
import assert from "node:assert/strict";
import test from "node:test";
import { changedPaths } from "./indexnow.mjs";

test("maps changed files to the pages they affect", () => {
  assert.deepEqual(changedPaths(["content/blog/a.md"]), ["/", "/blog/", "/blog/a/"]);
  assert.deepEqual(changedPaths(["content/field-notes/b.md", "README.md"]), ["/", "/field-notes/", "/field-notes/b/"]);
  assert.deepEqual(changedPaths(["src/lib/portfolioData.ts", "content/blog/a.md"]), ["*", "/", "/blog/", "/blog/a/"]);
  assert.deepEqual(changedPaths(["scripts/indexnow.mjs", ".github/workflows/indexnow.yml"]), []);
  assert.deepEqual(changedPaths(["content/blog/draft.md"], (file) => file.endsWith("draft.md")), []);
});
