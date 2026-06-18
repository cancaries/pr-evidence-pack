import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { run } from "../src/cli.js";

const gitBinary = process.env.PR_EVIDENCE_GIT || "git";

test("CLI writes evidence files from a git repository", async (t) => {
  const repo = makeTempRepo(t);
  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test User"]);
  fs.mkdirSync(path.join(repo, "src"));
  fs.writeFileSync(path.join(repo, "src", "index.js"), "export const value = 1;\n");
  fs.writeFileSync(path.join(repo, "README.md"), "# Fixture\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "Initial commit"]);
  git(repo, ["checkout", "-b", "feature/evidence"]);
  fs.writeFileSync(path.join(repo, "src", "index.js"), "export const value = 2;\n");
  fs.mkdirSync(path.join(repo, "test"));
  fs.writeFileSync(path.join(repo, "test", "index.test.js"), "import 'node:test';\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "Add evidence fixture"]);

  const stdout = capture();
  const stderr = capture();
  const code = await run(
    [
      "--base",
      "main",
      "--issue",
      "#123",
      "--test",
      "node --test",
      "--manual",
      "Checked generated Markdown",
      "--risk",
      "Low",
      "--rollback",
      "Revert this PR",
      "--body-output",
      "PR_BODY.md"
    ],
    {
      cwd: repo,
      env: { ...process.env, PR_EVIDENCE_GIT: gitBinary },
      stdout,
      stderr
    }
  );

  assert.equal(code, 0);
  assert.match(stdout.text, /Wrote PR_EVIDENCE.md, PR_BODY.md/);
  assert.equal(stderr.text, "");
  assert.match(fs.readFileSync(path.join(repo, "PR_EVIDENCE.md"), "utf8"), /## Changed Files/);
  assert.match(fs.readFileSync(path.join(repo, "PR_BODY.md"), "utf8"), /## Evidence/);
});

test("CLI can fail on missing evidence warnings", async (t) => {
  const repo = makeTempRepo(t);
  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test User"]);
  fs.writeFileSync(path.join(repo, "index.js"), "console.log('one');\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "Initial commit"]);
  git(repo, ["checkout", "-b", "feature/warnings"]);
  fs.writeFileSync(path.join(repo, "index.js"), "console.log('two');\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "Change output"]);

  const code = await run(["--base", "main", "--fail-on-warnings"], {
    cwd: repo,
    env: { ...process.env, PR_EVIDENCE_GIT: gitBinary },
    stdout: capture(),
    stderr: capture()
  });

  assert.equal(code, 2);
});

function makeTempRepo(t) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "pr-evidence-pack-"));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  return repo;
}

function git(cwd, args) {
  const result = spawnSync(gitBinary, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function capture() {
  return {
    text: "",
    write(chunk) {
      this.text += chunk;
    }
  };
}
