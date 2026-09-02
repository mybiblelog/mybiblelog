#!/usr/bin/env node
// Offline check of the Play listing metadata under mobile/store/play/.
//
// Runs in CI: no network, no credentials, and no dependencies beyond Node, so a
// listing Play would reject (an over-long title, a missing locale file, an
// unusable screenshot) fails on the pull request instead of mid-push.
//
// Usage: node scripts/play/validate.mjs [--locales en-US,de-DE] [--require-screenshots]

import { parseArgs } from "./lib/args.mjs";
import { checkListings } from "./lib/checks.mjs";
import { loadConfig, resolveLocales } from "./lib/metadata.mjs";
import { run } from "./lib/cli.mjs";

run(async () => {
  const { locales: only, requireScreenshots } = parseArgs(process.argv.slice(2), {
    flags: ["require-screenshots"],
  });

  const config = loadConfig();
  const locales = resolveLocales(config, only);
  const { errors, warnings, notes } = checkListings(config, locales, { requireScreenshots });

  for (const note of notes) console.log(`  ${note}`);
  for (const warning of warnings) console.warn(`! ${warning}`);

  if (errors.length > 0) {
    console.error("");
    for (const error of errors) console.error(`✗ ${error}`);
    throw new Error(`${errors.length} problem(s) in mobile/store/play/.`);
  }

  console.log(`✓ Play listing metadata OK (${locales.map((l) => l.play).join(", ")})`);
});
