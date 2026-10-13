#!/usr/bin/env node
// Bumps the app version everywhere it's recorded: app.json `expo.version` (what
// the stores show), package.json `version`, and the lockfile's own two entries.
//
// Usage:
//   npm run version:bump -- patch|minor|major
//   npm run version:bump -- 1.2.3
//
// Edits are textual rather than JSON.stringify round-trips so app.json's
// hand-formatted plugin arrays survive. Each file is re-parsed afterwards to
// confirm only the intended fields changed.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const files = [
  { name: "app.json", read: (json) => [json.expo.version], occurrences: 1 },
  { name: "package.json", read: (json) => [json.version], occurrences: 1 },
  {
    name: "package-lock.json",
    read: (json) => [json.version, json.packages[""].version],
    // The root `version` precedes `packages`, and `packages[""]` is the first
    // package entry, so the first two matches are always the app's own.
    occurrences: 2,
  },
];

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function nextVersion(current, arg) {
  if (SEMVER.test(arg)) return arg;
  const [, major, minor, patch] = current.match(SEMVER).map(Number);
  switch (arg) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Expected patch, minor, major, or x.y.z — got "${arg ?? ""}".`);
  }
}

function main() {
  const loaded = files.map((file) => {
    const path = join(projectRoot, file.name);
    const text = readFileSync(path, "utf8");
    return { ...file, path, text, versions: file.read(JSON.parse(text)) };
  });

  const current = loaded[0].versions[0];
  const mismatched = loaded.filter((file) => file.versions.some((v) => v !== current));
  if (mismatched.length) {
    const detail = loaded.map((f) => `  ${f.name}: ${f.versions.join(", ")}`).join("\n");
    throw new Error(`Versions are out of sync; fix them by hand first:\n${detail}`);
  }
  if (!SEMVER.test(current)) throw new Error(`Current version "${current}" is not x.y.z.`);

  const next = nextVersion(current, process.argv[2]);
  if (next === current) throw new Error(`Version is already ${current}.`);

  for (const file of loaded) {
    let remaining = file.occurrences;
    const updated = file.text.replace(
      /("version":\s*")([^"]+)(")/g,
      (match, open, value, close) => {
        if (remaining === 0) return match;
        remaining -= 1;
        return `${open}${next}${close}`;
      }
    );
    const versions = file.read(JSON.parse(updated));
    if (remaining !== 0 || versions.some((v) => v !== next)) {
      throw new Error(`Unexpected layout in ${file.name}; no files were written.`);
    }
    file.updated = updated;
  }

  for (const file of loaded) writeFileSync(file.path, file.updated);
  console.log(`Bumped mobile version ${current} -> ${next}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
