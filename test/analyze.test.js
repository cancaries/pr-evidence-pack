import test from "node:test";
import assert from "node:assert/strict";
import { analyzeChanges, buildWarnings, classifyFile, suggestedReviewerFocus } from "../src/analyze.js";

test("classifies common repository files", () => {
  assert.equal(classifyFile("src/cli.js"), "source");
  assert.equal(classifyFile("test/cli.test.js"), "tests");
  assert.equal(classifyFile("docs/usage.md"), "docs");
  assert.equal(classifyFile(".github/workflows/ci.yml"), "config");
  assert.equal(classifyFile(".gitattributes"), "config");
  assert.equal(classifyFile("assets/logo.png"), "assets");
});

test("analysis groups files and calculates churn", () => {
  const analysis = analyzeChanges(
    [
      { file: "src/cli.js", status: "M", additions: 10, deletions: 2 },
      { file: "test/cli.test.js", status: "A", additions: 20, deletions: 0 },
      { file: "README.md", status: "M", additions: 4, deletions: 1 }
    ],
    10
  );

  assert.equal(analysis.totalFiles, 3);
  assert.equal(analysis.additions, 34);
  assert.equal(analysis.deletions, 3);
  assert.equal(analysis.touchedTests, true);
  assert.deepEqual(
    analysis.groups.map(([group]) => group),
    ["source", "tests", "docs"]
  );
});

test("warnings call out missing evidence", () => {
  const warnings = buildWarnings(
    { isDirty: true },
    {
      issue: null,
      scope: [],
      outOfScope: [],
      tests: [],
      manualChecks: [],
      risk: null,
      rollback: null
    },
    { totalFiles: 1, touchedTests: false }
  );

  assert.ok(warnings.some((warning) => warning.includes("No linked issue")));
  assert.ok(warnings.some((warning) => warning.includes("No explicit in-scope")));
  assert.ok(warnings.some((warning) => warning.includes("working tree")));
});

test("reviewer focus uses explicit note first", () => {
  const focus = suggestedReviewerFocus(
    { largestFiles: [], touchedConfig: false, touchedTests: false, touchedDocs: false, totalFiles: 1 },
    { reviewerFocus: "Check parser edge cases." }
  );

  assert.deepEqual(focus, ["Check parser edge cases."]);
});
