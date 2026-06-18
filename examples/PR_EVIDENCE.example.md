# PR Evidence Pack

Generated: 2026-06-18T00:00:00.000Z

## PR Snapshot

- Title: Add parser support for evidence options
- Branch: feature/evidence-options
- Base: main
- Range: main..abc123def456
- HEAD: abc123def456
- Working tree: clean

## Change Overview

- Files changed: 4
- Additions: 142
- Deletions: 18

## Changed Files

### Source

- modified src/options.js (+64/-6)
- modified src/render.js (+42/-8)

### Tests

- added test/options.test.js (+30/-0)

### Docs

- modified README.md (+6/-4)

## Scope

- In scope: derived from the files listed above.
- Out of scope: TODO before submitting.

## Evidence

- Linked issue or ticket: #123

### Reproduction

- Run the CLI against a branch with repeated evidence options.

### Tests Run

- node --test

### Manual Verification

- Checked generated Markdown in a sample repository.

## Risk and Rollback

- Risk: Low: output-only CLI change.
- Rollback: Revert the PR.

## Reviewer Focus

- Check option parsing for repeated flags.

## Missing Evidence

- No missing evidence detected.

## Commits

- abc123d Add evidence option parser
