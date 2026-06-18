# pr-evidence-pack

Generate a maintainer-friendly evidence pack for a pull request from local git
metadata.

This tool is for contributors who want reviewers to trust the work faster. It
does not review code, score code quality, or pretend to know whether a change is
correct. Instead, it packages the evidence a maintainer usually has to ask for:
scope, changed files, tests run, manual verification, risk, rollback, and review
focus.

## Why this exists

Open-source maintainers are reviewing more AI-assisted and agent-generated pull
requests. Generic PR summaries are already common. The missing layer is not more
confidence or more prose. The missing layer is reviewable evidence.

`pr-evidence-pack` is local-first and conservative:

- no network calls;
- no hosted bot;
- no automatic PR comments;
- no AI dependency;
- plain Markdown output you can inspect before posting.

## Install

```bash
npm install -g pr-evidence-pack
```

During local development:

```bash
node ./bin/pr-evidence-pack.js --help
```

## Usage

Run it from a git repository:

```bash
pr-evidence-pack --base main --test "npm test" --issue "#123"
```

That writes `PR_EVIDENCE.md` in the repository root.

To also create a concise PR body draft:

```bash
pr-evidence-pack \
  --base main \
  --issue "#123" \
  --test "npm test" \
  --manual "Checked the CLI output on a sample repository" \
  --risk "Low: Markdown-only output" \
  --rollback "Revert this PR" \
  --body-output PR_BODY.md
```

Dry run without writing files:

```bash
pr-evidence-pack --dry-run --base main
```

Fail CI when important evidence is missing:

```bash
pr-evidence-pack --base main --fail-on-warnings
```

## Output

The evidence pack includes:

- PR snapshot: branch, base, range, HEAD, working tree state;
- change overview: files, additions, deletions, binary files;
- changed files grouped by source, tests, docs, config, assets, and other;
- linked issue or ticket;
- reproduction notes;
- tests run;
- manual verification;
- risk and rollback;
- reviewer focus;
- missing evidence warnings;
- commit list;
- git diff stat.

See [examples/PR_EVIDENCE.example.md](examples/PR_EVIDENCE.example.md).

## Options

```text
--base <ref>              Base branch or commit. Auto-detected by default.
--output <path>           Evidence Markdown path. Default: PR_EVIDENCE.md
--body-output <path>      Also write a concise PR body draft.
--title <text>            PR title or working title.
--issue <value>           Linked issue, ticket, or URL.
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
```

If `git` is not on `PATH`, set `PR_EVIDENCE_GIT` to the git executable path.

## What this is not

- It is not an AI reviewer.
- It is not a replacement for tests or human review.
- It is not a maintainer bypass.
- It does not prove a PR is correct.

The point is to make contributor evidence visible before a reviewer has to ask
for it.

## Maintainer note

Generated evidence is only as good as the commands and notes supplied by the
contributor. Reviewers should treat it as a structured starting point, not as a
guarantee.

## License

MIT
