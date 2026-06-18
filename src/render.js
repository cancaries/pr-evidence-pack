import { analyzeChanges, buildWarnings, suggestedReviewerFocus } from "./analyze.js";

export function buildEvidence(repository, options, now = new Date()) {
  const analysis = analyzeChanges(repository.changes, options.maxFiles);
  const warnings = buildWarnings(repository, options, analysis);
  const reviewerFocus = suggestedReviewerFocus(analysis, options);

  return {
    analysis,
    warnings,
    reviewerFocus,
    evidenceMarkdown: renderEvidenceMarkdown(repository, options, analysis, warnings, reviewerFocus, now),
    prBodyMarkdown: renderPrBodyMarkdown(repository, options, analysis, warnings, reviewerFocus)
  };
}

function renderEvidenceMarkdown(repository, options, analysis, warnings, reviewerFocus, now) {
  const lines = [];
  const title = options.title || `Evidence for ${repository.branch}`;

  lines.push("# PR Evidence Pack");
  lines.push("");
  lines.push(`Generated: ${now.toISOString()}`);
  lines.push("");
  lines.push("## PR Snapshot");
  lines.push("");
  lines.push(`- Title: ${title}`);
  lines.push(`- Branch: ${repository.branch}`);
  lines.push(`- Base: ${repository.base}`);
  lines.push(`- Range: ${repository.range}`);
  lines.push(`- HEAD: ${repository.head}`);
  lines.push(`- Working tree: ${repository.isDirty ? "has uncommitted changes" : "clean"}`);
  lines.push("");
  lines.push("## Change Overview");
  lines.push("");
  lines.push(`- Files changed: ${analysis.totalFiles}`);
  lines.push(`- Additions: ${analysis.additions}`);
  lines.push(`- Deletions: ${analysis.deletions}`);
  if (analysis.binaryFiles > 0) {
    lines.push(`- Binary files: ${analysis.binaryFiles}`);
  }
  lines.push("");
  lines.push("## Changed Files");
  lines.push("");

  if (analysis.totalFiles === 0) {
    lines.push("No changed files were detected against the selected base.");
  } else {
    for (const [group, files] of analysis.groups) {
      lines.push(`### ${capitalize(group)}`);
      lines.push("");
      for (const change of files) {
        lines.push(`- ${formatStatus(change.status)} ${change.file}${formatChurn(change)}`);
      }
      lines.push("");
    }

    if (analysis.omittedCount > 0) {
      lines.push(`_${analysis.omittedCount} additional files omitted by --max-files._`);
      lines.push("");
    }
  }

  lines.push("## Scope");
  lines.push("");
  lines.push("- In scope: derived from the files listed above.");
  lines.push("- Out of scope: TODO before submitting.");
  lines.push("");
  lines.push("## Evidence");
  lines.push("");
  lines.push(`- Linked issue or ticket: ${options.issue || "Not provided"}`);
  lines.push("");
  lines.push("### Reproduction");
  lines.push("");
  pushListOrPlaceholder(lines, options.reproduction, "Not provided");
  lines.push("");
  lines.push("### Tests Run");
  lines.push("");
  pushListOrPlaceholder(lines, options.tests, "Not provided");
  lines.push("");
  lines.push("### Manual Verification");
  lines.push("");
  pushListOrPlaceholder(lines, options.manualChecks, "Not provided");
  lines.push("");
  lines.push("## Risk and Rollback");
  lines.push("");
  lines.push(`- Risk: ${options.risk || "Not provided"}`);
  lines.push(`- Rollback: ${options.rollback || "Not provided"}`);
  lines.push("");
  lines.push("## Reviewer Focus");
  lines.push("");
  pushListOrPlaceholder(lines, reviewerFocus, "Check that the diff matches the stated scope.");
  lines.push("");
  lines.push("## Missing Evidence");
  lines.push("");
  pushListOrPlaceholder(lines, warnings, "No missing evidence detected.");
  lines.push("");
  lines.push("## Commits");
  lines.push("");
  pushListOrPlaceholder(lines, repository.commits, "No commits detected in the selected range.");

  if (repository.stat) {
    lines.push("");
    lines.push("## Git Diff Stat");
    lines.push("");
    lines.push("```text");
    lines.push(repository.stat);
    lines.push("```");
  }

  lines.push("");
  return lines.join("\n");
}

function renderPrBodyMarkdown(repository, options, analysis, warnings, reviewerFocus) {
  const lines = [];
  const title = options.title || "";

  if (title) {
    lines.push(`<!-- ${title} -->`);
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Changed ${analysis.totalFiles} file(s) against \`${repository.base}\`.`);
  lines.push(`- Range: \`${repository.range}\`.`);
  lines.push("");
  lines.push("## Evidence");
  lines.push("");
  lines.push(`- Issue: ${options.issue || "Not provided"}`);
  lines.push(`- Tests: ${options.tests.length > 0 ? options.tests.join("; ") : "Not provided"}`);
  lines.push(`- Manual checks: ${options.manualChecks.length > 0 ? options.manualChecks.join("; ") : "Not provided"}`);
  lines.push("");
  lines.push("## Risk / Rollback");
  lines.push("");
  lines.push(`- Risk: ${options.risk || "Not provided"}`);
  lines.push(`- Rollback: ${options.rollback || "Not provided"}`);
  lines.push("");
  lines.push("## Reviewer Focus");
  lines.push("");
  pushListOrPlaceholder(lines, reviewerFocus, "Check that the diff matches the stated scope.");

  if (warnings.length > 0) {
    lines.push("");
    lines.push("## Before Merge");
    lines.push("");
    pushListOrPlaceholder(lines, warnings, "No missing evidence detected.");
  }

  lines.push("");
  return lines.join("\n");
}

function pushListOrPlaceholder(lines, values, placeholder) {
  if (!values || values.length === 0) {
    lines.push(`- ${placeholder}`);
    return;
  }

  for (const value of values) {
    lines.push(`- ${value}`);
  }
}

function formatStatus(status) {
  if (status.startsWith("R")) {
    return "renamed";
  }
  if (status.startsWith("C")) {
    return "copied";
  }
  return {
    A: "added",
    M: "modified",
    D: "deleted",
    T: "type changed",
    U: "unmerged"
  }[status] || status;
}

function formatChurn(change) {
  if (change.binary) {
    return " (binary)";
  }
  const additions = change.additions || 0;
  const deletions = change.deletions || 0;
  return ` (+${additions}/-${deletions})`;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
