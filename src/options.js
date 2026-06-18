const repeatedOptions = new Set(["test", "manual", "reproduction", "scope", "outofscope"]);

export function parseArgs(argv) {
  const options = {
    base: null,
    output: "PR_EVIDENCE.md",
    bodyOutput: null,
    title: null,
    issue: null,
    scope: [],
    outOfScope: [],
    tests: [],
    manualChecks: [],
    reproduction: [],
    risk: null,
    rollback: null,
    reviewerFocus: null,
    maxFiles: 80,
    stdout: false,
    noWrite: false,
    failOnWarnings: false,
    help: false,
    version: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      options.version = true;
      continue;
    }

    if (arg === "--stdout") {
      options.stdout = true;
      continue;
    }

    if (arg === "--no-write") {
      options.noWrite = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.stdout = true;
      options.noWrite = true;
      continue;
    }

    if (arg === "--fail-on-warnings") {
      options.failOnWarnings = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const [rawName, inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
      const name = normalizeOptionName(rawName);
      const value = inlineValue ?? argv[index + 1];

      if (!isKnownValueOption(name)) {
        throw new Error(`Unknown option: --${rawName}`);
      }

      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Missing value for --${rawName}`);
      }

      if (inlineValue === undefined) {
        index += 1;
      }

      applyValueOption(options, name, value);
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

function normalizeOptionName(name) {
  return name.replaceAll("-", "");
}

function isKnownValueOption(name) {
  return [
    "base",
    "output",
    "bodyoutput",
    "prbody",
    "title",
    "issue",
    "scope",
    "outofscope",
    "test",
    "tests",
    "manual",
    "manualcheck",
    "reproduction",
    "risk",
    "rollback",
    "reviewerfocus",
    "maxfiles"
  ].includes(name);
}

function applyValueOption(options, name, value) {
  if (repeatedOptions.has(name)) {
    if (name === "test") {
      options.tests.push(value);
    } else if (name === "manual") {
      options.manualChecks.push(value);
    } else if (name === "reproduction") {
      options.reproduction.push(value);
    } else if (name === "scope") {
      options.scope.push(value);
    } else {
      options.outOfScope.push(value);
    }
    return;
  }

  if (name === "tests") {
    options.tests.push(value);
  } else if (name === "manualcheck") {
    options.manualChecks.push(value);
  } else if (name === "base") {
    options.base = value;
  } else if (name === "output") {
    options.output = value;
  } else if (name === "bodyoutput" || name === "prbody") {
    options.bodyOutput = value;
  } else if (name === "title") {
    options.title = value;
  } else if (name === "issue") {
    options.issue = value;
  } else if (name === "scope") {
    options.scope.push(value);
  } else if (name === "outofscope") {
    options.outOfScope.push(value);
  } else if (name === "risk") {
    options.risk = value;
  } else if (name === "rollback") {
    options.rollback = value;
  } else if (name === "reviewerfocus") {
    options.reviewerFocus = value;
  } else if (name === "maxfiles") {
    options.maxFiles = parsePositiveInteger(value, "--max-files");
  }
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

export function helpText() {
  return `pr-evidence-pack

Generate a maintainer-friendly pull request evidence pack from local git metadata.

Usage:
  pr-evidence-pack [options]

Options:
  --base <ref>              Base branch or commit. Auto-detected by default.
  --output <path>           Evidence Markdown path. Default: PR_EVIDENCE.md
  --body-output <path>      Also write a concise PR body draft.
  --title <text>            PR title or working title.
  --issue <value>           Linked issue, ticket, or URL.
  --scope <note>            In-scope note. Can be repeated.
  --out-of-scope <note>     Explicit non-goal. Can be repeated.
  --test <command>          Test command that was run. Can be repeated.
  --manual <note>           Manual verification note. Can be repeated.
  --reproduction <step>     Reproduction step. Can be repeated.
  --risk <note>             Risk note.
  --rollback <note>         Rollback note.
  --reviewer-focus <note>   Area reviewers should inspect.
  --max-files <number>      Maximum changed files shown in detail. Default: 80
  --stdout                  Print the evidence pack too.
  --no-write                Do not write files.
  --dry-run                 Same as --stdout --no-write.
  --fail-on-warnings        Exit with code 2 when evidence is missing.
  --help                    Show this help.
  --version                 Show version.

Environment:
  PR_EVIDENCE_GIT          Optional path to the git executable.

Examples:
  pr-evidence-pack --base main --issue "#123" --scope "Parser fix" --test "npm test"
  pr-evidence-pack --dry-run --scope "Docs update" --out-of-scope "Runtime behavior"
`;
}
