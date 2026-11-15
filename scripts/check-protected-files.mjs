#!/usr/bin/env node
// Pull request guard. Fails when a PR (1) changes a protected file without the `protected-approved` label, or
// (2) adds a line that looks like a secret (this one has no override). Runs in CI before anything is installed.
//
//   BASE_SHA, HEAD_SHA  the two commits to compare (three-dot diff, i.e. what the PR adds)
//   PR_LABELS           JSON array of the PR's label names (optional)
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const OVERRIDE_LABEL = "protected-approved";

// Files an AI coding tool must not change without the owner's explicit say-so.
const PROTECTED = [
  [/^package\.json$/, "dependencies and scripts"],
  [
    /^(bun\.lockb?|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bunfig\.toml)$/,
    "lockfile / package manager config",
  ],
  [/^(vite|vitest)\.config\.[cm]?[jt]s$/, "build and test configuration"],
  [/^tsconfig[^/]*\.json$/, "TypeScript configuration"],
  [/^(eslint\.config\.[cm]?js|components\.json)$/, "lint / component configuration"],
  [/^\.env(\..*)?$/, "environment files"],
  [/^(vercel\.json|wrangler\.[a-z]+)$/, "hosting configuration"],
  [/^\.lovable\//, "Lovable project files"],
  [/^\.github\//, "CI and repository automation"],
  [/^supabase\//, "database migrations, drafts and tests (changed by Claude only)"],
  [/^src\/integrations\/supabase\//, "generated Supabase client and types"],
];

// Strings that must never be added to the repository.
const SECRETS = [
  [/sb_secret_[A-Za-z0-9_-]{8,}/, "Supabase secret key"],
  [/\bre_[A-Za-z0-9]{20,}\b/, "Resend API key"],
  [/AIza[0-9A-Za-z_-]{35}/, "Google API key (AI Studio may inject one)"],
  [/\bsk-[A-Za-z0-9_-]{20,}/, "API secret key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [
    /\b(?:SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|CRON_SECRET|THROTTLE_PEPPER|GEMINI_API_KEY)\s*[=:]\s*["']?[A-Za-z0-9._-]{12,}/,
    "a secret setting with a value",
  ],
  [/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/, "a signed token (JWT)"],
];

const ref = /^[0-9a-zA-Z._\/~^-]{4,100}$/;
const { BASE_SHA: base, HEAD_SHA: head } = process.env;
if (!base || !head || !ref.test(base) || !ref.test(head)) {
  console.error("BASE_SHA and HEAD_SHA must be set to commit ids.");
  process.exit(2);
}
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

let labels = [];
try {
  labels = JSON.parse(process.env.PR_LABELS || "[]");
} catch {
  labels = [];
}
const approved = Array.isArray(labels) && labels.includes(OVERRIDE_LABEL);

const files = git("diff", "--name-only", "--no-renames", `${base}...${head}`)
  .split("\n")
  .filter(Boolean);
const touched = files.flatMap((file) =>
  PROTECTED.filter(([re]) => re.test(file)).map(([, why]) => ({ file, why })),
);

const added = git(
  "diff",
  "-U0",
  "--no-renames",
  `${base}...${head}`,
  "--",
  ".",
  ":(exclude)bun.lock",
)
  .split("\n")
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
const leaks = added.flatMap((line) =>
  SECRETS.filter(([re]) => re.test(line)).map(([, why]) => why),
);

const lines = [];
if (leaks.length > 0) {
  lines.push(
    "### Possible secret added",
    "",
    ...[...new Set(leaks)].map((why) => `- ${why}`),
    "",
    "Remove it and rotate it if it was ever real. This check cannot be overridden.",
    "",
  );
}
if (touched.length > 0) {
  lines.push(
    approved ? "### Protected files changed (approved by label)" : "### Protected files changed",
    "",
    ...touched.map(({ file, why }) => `- \`${file}\`: ${why}`),
    "",
    approved
      ? `The \`${OVERRIDE_LABEL}\` label is set, so this is allowed.`
      : `Revert these files, or ask the owner to review and add the \`${OVERRIDE_LABEL}\` label.`,
    "",
  );
}
const message = lines.join("\n");
if (message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}
if (leaks.length > 0 || (touched.length > 0 && !approved)) process.exit(1);
console.log(`Guard passed: ${files.length} file(s) changed, none blocked.`);
