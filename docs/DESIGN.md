# Design Notes

## Product thesis

Modern code review is bottlenecked less by prose and more by trust. Reviewers
need enough evidence to decide where to spend attention:

- what changed;
- whether the scope is understandable;
- what tests were run;
- what manual checks were performed;
- where risk lives;
- how rollback works.

`pr-evidence-pack` targets that evidence layer.

## Why local-first

The first version intentionally avoids services, bots, and network calls.

Local-first keeps the tool:

- safe to try inside private repositories;
- easy to understand;
- useful before a PR exists;
- compatible with GitHub, GitLab, Forgejo, email patches, and internal forges.

## Why not an AI reviewer

AI review and PR summary tools are crowded. They also create a subtle trust
problem when they sound confident without showing how the contributor verified
the change.

This project stays narrower. It packages evidence supplied by git metadata and
the contributor. It helps humans review; it does not replace them.

## Warning philosophy

Missing evidence warnings are prompts, not verdicts. A warning means "a reviewer
will probably ask for this" rather than "the PR is bad."

## V0.1 boundaries

Included:

- git branch/base/range detection;
- changed-file grouping;
- churn summary;
- test/manual/risk/rollback notes supplied by flags;
- Markdown evidence output;
- optional PR body draft.

Excluded:

- executing tests;
- posting comments;
- querying hosting provider APIs;
- AI-generated judgments;
- secret scanning;
- policy enforcement beyond optional exit-on-warning.

## Future directions

- Repository-local policy file.
- GitHub Action wrapper.
- Evidence templates by ecosystem.
- SARIF or JSON output for CI systems.
- Screenshot or log attachment references without copying large files.
