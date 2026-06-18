import test from "node:test";
import assert from "node:assert/strict";
import { buildEvidence } from "../src/render.js";

test("renders evidence and PR body markdown", () => {
  const evidence = buildEvidence(
    {
      branch: "feature/test",
      base: "main",
      range: "main..abc123",
      head: "abc123",
      isDirty: false,
      changes: [
        { file: "src/cli.js", status: "M", additions: 12, deletions: 3 },
        { file: "test/cli.test.js", status: "A", additions: 30, deletions: 0 }
      ],
      commits: ["abc123 Add CLI"],
      stat: " src/cli.js | 15 +++++"
    },
    {
      title: "Add CLI",
      issue: "#7",
      scope: ["CLI rendering path"],
      outOfScope: ["Executing test commands"],
      tests: ["node --test"],
      manualChecks: ["Ran dry-run output"],
      reproduction: ["Run the command on a feature branch"],
      risk: "Low",
      rollback: "Revert the commit",
      reviewerFocus: null,
      maxFiles: 80
    },
    new Date("2026-06-18T00:00:00.000Z")
  );

  assert.match(evidence.evidenceMarkdown, /# PR Evidence Pack/);
  assert.match(evidence.evidenceMarkdown, /Linked issue or ticket: #7/);
  assert.match(evidence.evidenceMarkdown, /CLI rendering path/);
  assert.match(evidence.evidenceMarkdown, /node --test/);
  assert.match(evidence.prBodyMarkdown, /## Summary/);
  assert.equal(evidence.warnings.length, 0);
});
