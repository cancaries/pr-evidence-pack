# Contributing

Thank you for considering a contribution.

`pr-evidence-pack` exists to reduce review burden, so contributions should model
the same behavior the tool encourages.

## Before opening a PR

- Keep the change scoped.
- Include tests for behavior changes.
- Run `node --test`.
- Include manual verification notes when the change affects CLI output.
- Explain risk and rollback in the PR description.

## Pull request checklist

- What changed?
- Why is this the right scope?
- How can a reviewer reproduce the behavior?
- What tests were run?
- What should reviewers inspect closely?
- What is the rollback path?

Using `pr-evidence-pack` on this repository is encouraged:

```bash
node ./bin/pr-evidence-pack.js \
  --base main \
  --test "node --test" \
  --manual "Reviewed generated Markdown output" \
  --risk "Low: local CLI-only change" \
  --rollback "Revert the PR"
```

## Non-goals

- Do not add hosted services to the core CLI.
- Do not add automatic PR comments in v0.x.
- Do not add AI dependencies to the default path.
- Do not turn missing-evidence warnings into claims that a PR is correct or
  incorrect.
