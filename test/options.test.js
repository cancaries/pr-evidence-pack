import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/options.js";

test("parses repeated evidence options", () => {
  const options = parseArgs([
    "--base",
    "main",
    "--test",
    "node --test",
    "--test=lint",
    "--manual",
    "Checked output",
    "--reproduction",
    "Open the fixture",
    "--body-output",
    "PR_BODY.md",
    "--fail-on-warnings"
  ]);

  assert.equal(options.base, "main");
  assert.deepEqual(options.tests, ["node --test", "lint"]);
  assert.deepEqual(options.manualChecks, ["Checked output"]);
  assert.deepEqual(options.reproduction, ["Open the fixture"]);
  assert.equal(options.bodyOutput, "PR_BODY.md");
  assert.equal(options.failOnWarnings, true);
});

test("rejects unknown options", () => {
  assert.throws(() => parseArgs(["--surprise"]), /Unknown option/);
});

test("dry run implies stdout and no write", () => {
  const options = parseArgs(["--dry-run"]);
  assert.equal(options.stdout, true);
  assert.equal(options.noWrite, true);
});
