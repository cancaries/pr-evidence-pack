import { spawnSync } from "node:child_process";
import path from "node:path";

const defaultBaseCandidates = [
  "origin/main",
  "origin/master",
  "origin/trunk",
  "main",
  "master",
  "trunk",
  "develop"
];

export function inspectRepository({ cwd, env, base }) {
  const git = createGitRunner(cwd, env);
  const root = git.required(["rev-parse", "--show-toplevel"]).trim();
  const branch =
    git.optional(["branch", "--show-current"])?.trim() ||
    git.required(["rev-parse", "--short", "HEAD"]).trim();
  const head = git.required(["rev-parse", "--short=12", "HEAD"]).trim();
  const fullHead = git.required(["rev-parse", "HEAD"]).trim();
  const selectedBase = base || detectBase(git);

  if (!selectedBase) {
    throw new Error(
      "Could not detect a base ref. Pass --base <ref>, for example --base main."
    );
  }

  const mergeBase = git.optional(["merge-base", selectedBase, "HEAD"])?.trim();
  const leftRef = mergeBase || selectedBase;
  const changes = parseNameStatus(
    git.optional(["diff", "--name-status", "--find-renames", "--find-copies", leftRef, "HEAD"]) || ""
  );
  const numstat = parseNumstat(
    git.optional(["diff", "--numstat", leftRef, "HEAD"]) || ""
  );
  const stat = git.optional(["diff", "--stat", "--find-renames", leftRef, "HEAD"])?.trim() || "";
  const commits =
    git.optional(["log", "--oneline", "--decorate=short", `${leftRef}..HEAD`])
      ?.trim()
      .split(/\r?\n/)
      .filter(Boolean) || [];

  return {
    root,
    cwd,
    branch,
    head,
    fullHead,
    base: selectedBase,
    mergeBase: mergeBase || null,
    range: `${shortRef(leftRef)}..${head}`,
    changes: mergeNumstat(changes, numstat),
    stat,
    commits,
    isDirty: Boolean(git.optional(["status", "--porcelain"])?.trim())
  };
}

function createGitRunner(cwd, env) {
  const gitBinary = env.PR_EVIDENCE_GIT || "git";

  return {
    required(args) {
      const result = runGit(gitBinary, args, cwd);
      if (result.status !== 0) {
        throw new Error(formatGitError(args, result));
      }
      return result.stdout;
    },
    optional(args) {
      const result = runGit(gitBinary, args, cwd);
      return result.status === 0 ? result.stdout : null;
    }
  };
}

function runGit(gitBinary, args, cwd) {
  const result = spawnSync(gitBinary, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error
  };
}

function formatGitError(args, result) {
  if (result.error) {
    return `git failed to start: ${result.error.message}`;
  }
  const command = `git ${args.join(" ")}`;
  const detail = result.stderr.trim() || result.stdout.trim() || "no output";
  return `${command} failed: ${detail}`;
}

function detectBase(git) {
  for (const candidate of defaultBaseCandidates) {
    const exists = git.optional(["rev-parse", "--verify", `${candidate}^{commit}`]);
    if (exists) {
      return candidate;
    }
  }
  return null;
}

function parseNameStatus(output) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const status = parts[0];
      const file = parts.at(-1);
      const previous = parts.length > 2 ? parts[1] : null;

      return {
        status,
        file: normalizePath(file),
        previous: previous ? normalizePath(previous) : null,
        additions: 0,
        deletions: 0,
        binary: false
      };
    });
}

function parseNumstat(output) {
  const byFile = new Map();

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const [added, deleted, file] = line.split("\t");
    byFile.set(normalizePath(file), {
      additions: added === "-" ? 0 : Number.parseInt(added, 10),
      deletions: deleted === "-" ? 0 : Number.parseInt(deleted, 10),
      binary: added === "-" || deleted === "-"
    });
  }

  return byFile;
}

function mergeNumstat(changes, numstat) {
  return changes.map((change) => ({
    ...change,
    ...(numstat.get(change.file) || {})
  }));
}

function normalizePath(file) {
  return file.split(path.sep).join("/");
}

function shortRef(ref) {
  return /^[a-f0-9]{40}$/i.test(ref) ? ref.slice(0, 12) : ref;
}
