const examples = {
  feature: `git clone https://github.com/cancaries/pr-evidence-pack.git
cd pr-evidence-pack
node ./bin/pr-evidence-pack.js \\
  --base main \\
  --issue "#123" \\
  --scope "CLI evidence generation" \\
  --out-of-scope "Hosted review bot behavior" \\
  --test "node --test" \\
  --manual "Checked generated Markdown locally" \\
  --risk "Low: Markdown-only output" \\
  --rollback "Revert this PR"`,
  docs: `node ./bin/pr-evidence-pack.js \\
  --base main \\
  --issue "docs refresh" \\
  --scope "README and website copy" \\
  --out-of-scope "Runtime behavior" \\
  --test "node --test" \\
  --manual "Checked the rendered docs page" \\
  --risk "Low: documentation-only change" \\
  --rollback "Revert the docs commit"`,
  ci: `node ./bin/pr-evidence-pack.js \\
  --base main \\
  --scope "CI evidence enforcement" \\
  --out-of-scope "Blocking maintainers from merging manually" \\
  --test "node --test" \\
  --fail-on-warnings`
};

const commandExample = document.querySelector("#command-example code");
const segments = document.querySelectorAll("[data-mode]");

for (const segment of segments) {
  segment.addEventListener("click", () => {
    const mode = segment.dataset.mode;
    commandExample.textContent = examples[mode];

    for (const item of segments) {
      const active = item === segment;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    }
  });
}

for (const button of document.querySelectorAll("[data-copy-target]")) {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    const text = target?.innerText || "";
    let copied = false;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = copyWithTextarea(text);
    }

    if (copied) {
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = "Copy command";
      }, 1600);
    } else {
      selectTargetText(target);
      button.textContent = "Selected";
    }
  });
}

function copyWithTextarea(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

function selectTargetText(target) {
  if (!target) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(target);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
