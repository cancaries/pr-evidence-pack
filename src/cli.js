import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRepository } from "./git.js";
import { buildEvidence } from "./render.js";
import { helpText, parseArgs } from "./options.js";

const packageJsonPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "package.json"
);

export async function run(argv, context) {
  const io = normalizeContext(context);

  try {
    const options = parseArgs(argv);

    if (options.help) {
      io.stdout.write(helpText());
      return 0;
    }

    if (options.version) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      io.stdout.write(`${packageJson.version}\n`);
      return 0;
    }

    const repository = inspectRepository({
      cwd: io.cwd,
      env: io.env,
      base: options.base
    });
    const evidence = buildEvidence(repository, options);
    const written = [];

    if (!options.noWrite) {
      const outputPath = path.resolve(repository.root, options.output);
      writeFile(outputPath, evidence.evidenceMarkdown);
      written.push(outputPath);

      if (options.bodyOutput) {
        const bodyPath = path.resolve(repository.root, options.bodyOutput);
        writeFile(bodyPath, evidence.prBodyMarkdown);
        written.push(bodyPath);
      }
    }

    if (options.stdout) {
      io.stdout.write(evidence.evidenceMarkdown);
    }

    if (written.length > 0) {
      io.stdout.write(`Wrote ${written.map((file) => path.relative(repository.root, file)).join(", ")}\n`);
    }

    if (evidence.warnings.length > 0) {
      io.stderr.write(
        `Evidence warnings: ${evidence.warnings.length}. Review the Missing Evidence section before submitting.\n`
      );
    }

    return options.failOnWarnings && evidence.warnings.length > 0 ? 2 : 0;
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return 1;
  }
}

function normalizeContext(context = {}) {
  return {
    cwd: context.cwd || process.cwd(),
    env: context.env || process.env,
    stdout: context.stdout || process.stdout,
    stderr: context.stderr || process.stderr
  };
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents, "utf8");
}
