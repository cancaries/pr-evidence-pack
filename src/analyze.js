const sourceExtensions = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".css",
  ".go",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scss",
  ".sh",
  ".swift",
  ".ts",
  ".tsx",
  ".vue"
]);

const docsExtensions = new Set([".md", ".mdx", ".rst", ".txt", ".adoc"]);
const assetExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".svg",
  ".webp"
]);

export function analyzeChanges(changes, maxFiles) {
  const groups = new Map();
  const limited = changes.slice(0, maxFiles);
  const omittedCount = Math.max(0, changes.length - limited.length);
  let additions = 0;
  let deletions = 0;
  let binaryFiles = 0;

  for (const change of changes) {
    additions += change.additions || 0;
    deletions += change.deletions || 0;
    if (change.binary) {
      binaryFiles += 1;
    }
  }

  for (const change of limited) {
    const group = classifyFile(change.file);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(change);
  }

  const sortedGroups = [...groups.entries()].sort(([left], [right]) =>
    groupOrder(left) - groupOrder(right) || left.localeCompare(right)
  );

  const largestFiles = [...changes]
    .sort((left, right) => churn(right) - churn(left))
    .slice(0, 5);

  return {
    totalFiles: changes.length,
    additions,
    deletions,
    binaryFiles,
    groups: sortedGroups,
    omittedCount,
    largestFiles,
    touchedTests: changes.some((change) => classifyFile(change.file) === "tests"),
    touchedDocs: changes.some((change) => classifyFile(change.file) === "docs"),
    touchedConfig: changes.some((change) => classifyFile(change.file) === "config")
  };
}

export function classifyFile(file) {
  const normalized = file.toLowerCase();
  const extension = extensionOf(normalized);

  if (
    normalized.includes("/test/") ||
    normalized.includes("/tests/") ||
    normalized.includes("/__tests__/") ||
    normalized.includes(".test.") ||
    normalized.includes(".spec.")
  ) {
    return "tests";
  }

  if (
    normalized.startsWith("docs/") ||
    normalized.includes("/docs/") ||
    docsExtensions.has(extension)
  ) {
    return "docs";
  }

  if (
    normalized.startsWith(".github/") ||
    normalized === ".editorconfig" ||
    normalized === ".gitattributes" ||
    normalized === ".gitignore" ||
    normalized === ".npmrc" ||
    normalized === ".nvmrc" ||
    normalized.endsWith("package.json") ||
    normalized.endsWith("package-lock.json") ||
    normalized.endsWith("pnpm-lock.yaml") ||
    normalized.endsWith("yarn.lock") ||
    normalized.endsWith("tsconfig.json") ||
    normalized.endsWith("eslint.config.js") ||
    normalized.endsWith(".eslintrc") ||
    normalized.endsWith("dockerfile") ||
    normalized.includes("/.github/")
  ) {
    return "config";
  }

  if (sourceExtensions.has(extension)) {
    return "source";
  }

  if (assetExtensions.has(extension)) {
    return "assets";
  }

  return "other";
}

export function buildWarnings(repository, options, analysis) {
  const warnings = [];

  if (!options.issue) {
    warnings.push("No linked issue, ticket, or decision record was provided.");
  }

  if (options.scope.length === 0) {
    warnings.push("No explicit in-scope note was provided.");
  }

  if (options.outOfScope.length === 0) {
    warnings.push("No explicit out-of-scope note was provided.");
  }

  if (options.tests.length === 0) {
    warnings.push("No test command was recorded.");
  }

  if (options.manualChecks.length === 0) {
    warnings.push("No manual verification note was recorded.");
  }

  if (!options.risk) {
    warnings.push("No risk note was provided.");
  }

  if (!options.rollback) {
    warnings.push("No rollback note was provided.");
  }

  if (!analysis.touchedTests && analysis.totalFiles > 0 && options.tests.length === 0) {
    warnings.push("No changed test files were detected and no test command was recorded.");
  }

  if (repository.isDirty) {
    warnings.push("The working tree has uncommitted changes; generated evidence may not match the final PR.");
  }

  return warnings;
}

export function suggestedReviewerFocus(analysis, options) {
  if (options.reviewerFocus) {
    return [options.reviewerFocus];
  }

  const focus = [];

  if (analysis.largestFiles.length > 0) {
    const largest = analysis.largestFiles
      .map((file) => `${file.file} (${churn(file)} lines)`)
      .join(", ");
    focus.push(`Largest changed files: ${largest}.`);
  }

  if (analysis.touchedConfig) {
    focus.push("Configuration or workflow files changed; check local and CI assumptions.");
  }

  if (analysis.touchedTests) {
    focus.push("Test files changed; check that assertions cover the intended behavior.");
  }

  if (!analysis.touchedDocs && analysis.totalFiles > 0) {
    focus.push("No documentation files changed; confirm docs are not needed for this PR.");
  }

  return focus.length > 0 ? focus : ["Check that the diff matches the stated scope."];
}

function extensionOf(file) {
  const slashIndex = file.lastIndexOf("/");
  const name = slashIndex >= 0 ? file.slice(slashIndex + 1) : file;
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex) : "";
}

function groupOrder(group) {
  return {
    source: 1,
    tests: 2,
    docs: 3,
    config: 4,
    assets: 5,
    other: 6
  }[group] || 99;
}

function churn(change) {
  return (change.additions || 0) + (change.deletions || 0);
}
