// Offline validation shared by `play:validate` and the publisher.
//
// The publisher runs these before opening an edit: a listing rejected by Play
// mid-push leaves a partially applied edit behind, and every one of these
// failures is knowable without the network.

import { existsSync } from "node:fs";

import { TEXT_FIELDS, listScreenshots, readListingText } from "./metadata.mjs";
import { MAX_SIDE, MIN_SIDE, padTarget } from "./images.mjs";
import { pngSize } from "./pngSize.mjs";

const MIN_SCREENSHOTS = 2;
const MAX_SCREENSHOTS = 8;

export function checkListings(config, locales, { requireScreenshots = false, screenshots = true } = {}) {
  const errors = [];
  const warnings = [];
  const notes = [];

  const slugs = config.screenshots.phone;
  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (duplicates.length > 0) {
    errors.push(`config.json: duplicate screenshot slug(s): ${[...new Set(duplicates)].join(", ")}`);
  }
  if (slugs.length > MAX_SCREENSHOTS) {
    errors.push(`config.json: ${slugs.length} phone screenshots configured; Play accepts at most ${MAX_SCREENSHOTS}.`);
  }
  if (slugs.length < MIN_SCREENSHOTS) {
    errors.push(`config.json: Play requires at least ${MIN_SCREENSHOTS} phone screenshots.`);
  }

  // mobile/screenshots is gitignored, so on a fresh clone (and in CI) there are
  // no captures at all. Say that once instead of once per locale.
  const noCaptures = screenshots && !existsSync(config.screenshotRoot);
  if (noCaptures) {
    const message = `No local screenshots in ${config.screenshotRoot} (run \`npm run screenshots:mobile\` from the repo root)`;
    if (requireScreenshots) errors.push(message);
    else warnings.push(message);
  }

  for (const locale of locales) {
    const source = locale.aliasOf ? ` (via ${locale.aliasOf})` : "";
    const { text, missing } = readListingText(locale);

    for (const file of missing) errors.push(`${locale.play}${source}: missing ${file}`);

    for (const field of TEXT_FIELDS) {
      const value = text[field.key];
      if (value === undefined) continue;
      if (value.length === 0) {
        errors.push(`${locale.play}${source}: ${field.label} is empty.`);
        continue;
      }
      const limit = config.limits?.[field.limitKey];
      if (limit && value.length > limit) {
        errors.push(`${locale.play}${source}: ${field.label} is ${value.length} chars (limit ${limit}).`);
      }
      if (field.key === "title" && value.includes("\n")) {
        errors.push(`${locale.play}${source}: Title must be a single line.`);
      }
    }

    if (screenshots && !noCaptures) {
      checkScreenshots({ config, locale, requireScreenshots, errors, warnings, notes });
    }
  }

  return { errors, warnings, notes };
}

function checkScreenshots({ config, locale, requireScreenshots, errors, warnings, notes }) {
  const shots = listScreenshots(config, locale);
  const absent = shots.filter((shot) => !shot.exists);

  if (absent.length > 0) {
    const message =
      `${locale.play}: ${absent.length}/${shots.length} phone screenshots not found in ${locale.screenshotDir} ` +
      "(run `npm run screenshots:mobile` from the repo root)";
    if (requireScreenshots) errors.push(message);
    else warnings.push(message);
  }

  for (const shot of shots.filter((s) => s.exists)) {
    let size;
    try {
      size = pngSize(shot.path);
    } catch (error) {
      errors.push(`${locale.play}: ${error.message}`);
      continue;
    }

    const shortest = Math.min(size.width, size.height);
    const longest = Math.max(size.width, size.height);
    if (shortest < MIN_SIDE || longest > MAX_SIDE) {
      errors.push(
        `${locale.play}: ${shot.slug}.png is ${size.width}x${size.height}; each side must be ${MIN_SIDE}-${MAX_SIDE}px.`
      );
      continue;
    }

    const target = padTarget(size);
    if (target) {
      notes.push(
        `${locale.play}: ${shot.slug}.png is ${size.width}x${size.height} (over Play's 2:1 limit) — ` +
          `will be padded to ${target.width}x${target.height} on upload.`
      );
    }
  }
}
