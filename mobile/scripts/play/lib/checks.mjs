// Offline validation shared by `play:validate` and the publisher.
//
// The publisher runs these before opening an edit: a listing rejected by Play
// mid-push leaves a partially applied edit behind, and every one of these
// failures is knowable without the network.

import { existsSync } from "node:fs";
import { dirname } from "node:path";

import { TEXT_FIELDS, listScreenshots, readListingText, screenshotSlugs } from "./metadata.mjs";
import {
  FEATURE_GRAPHIC,
  STRINGS_FILE,
  composedDir,
  featureGraphicPath,
  layoutKeys,
  readGraphicsStrings,
} from "./graphics.mjs";
import { MAX_RATIO, MAX_SIDE, MIN_SIDE, padTarget } from "./images.mjs";
import { pngSize } from "./pngSize.mjs";

const MIN_SCREENSHOTS = 2;
const MAX_SCREENSHOTS = 8;

const captureHint = (config) =>
  "run `npm run screenshots:mobile` from the repo root" + (config.layout ? ", then `npm run play:graphics` in mobile/" : "");

export function checkListings(config, locales, { requireScreenshots = false, screenshots = true } = {}) {
  const errors = [];
  const warnings = [];
  const notes = [];

  const source = config.layout ? "graphics/layout.json" : "config.json";
  const slugs = screenshotSlugs(config);
  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (duplicates.length > 0) {
    errors.push(`${source}: duplicate screenshot slug(s): ${[...new Set(duplicates)].join(", ")}`);
  }
  if (slugs.length > MAX_SCREENSHOTS) {
    errors.push(`${source}: ${slugs.length} phone screenshots configured; Play accepts at most ${MAX_SCREENSHOTS}.`);
  }
  if (slugs.length < MIN_SCREENSHOTS) {
    errors.push(`${source}: Play requires at least ${MIN_SCREENSHOTS} phone screenshots.`);
  }
  if (config.layout) checkLayout(config.layout, errors);

  // mobile/screenshots is gitignored, so on a fresh clone (and in CI) there are
  // no captures at all. Say that once instead of once per locale.
  const noCaptures = screenshots && !existsSync(config.screenshotRoot);
  if (noCaptures) {
    const message = `No local screenshots in ${config.screenshotRoot} (${captureHint(config)})`;
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
      // Play's content policy: dashes in listing text must be em dashes. Flagged
      // in the Play Console as "may not be promoted" rather than rejected on push.
      if (/--|–/.test(value)) {
        errors.push(`${locale.play}${source}: ${field.label} uses a double hyphen or en dash; use an em dash (—).`);
      }
      if (field.key === "title" && value.includes("\n")) {
        errors.push(`${locale.play}${source}: Title must be a single line.`);
      }
    }

    if (config.layout && !locale.aliasOf) checkGraphicsStrings(config, locale, errors, warnings);

    if (screenshots && !noCaptures) {
      checkScreenshots({ config, locale, requireScreenshots, errors, warnings, notes });
      if (config.layout) checkFeatureGraphic({ config, locale, errors, warnings });
    }
  }

  return { errors, warnings, notes };
}

/** Rendered slides go straight to Play, so their declared sizes must already be in spec. */
function checkLayout(layout, errors) {
  for (const slide of layout.slides) {
    const { width, height } = slide.size;
    if (slide.kind === "feature") {
      if (width !== FEATURE_GRAPHIC.width || height !== FEATURE_GRAPHIC.height) {
        errors.push(
          `graphics/layout.json: feature graphic "${slide.id}" is ${width}x${height}; Play requires ` +
            `${FEATURE_GRAPHIC.width}x${FEATURE_GRAPHIC.height}.`
        );
      }
      continue;
    }
    if (Math.min(width, height) < MIN_SIDE || Math.max(width, height) > MAX_SIDE || padTarget(slide.size)) {
      errors.push(
        `graphics/layout.json: "${slide.id}" is ${width}x${height}; each side must be ${MIN_SIDE}-${MAX_SIDE}px ` +
          `and the long side at most ${MAX_RATIO}x the short side.`
      );
    }
  }
}

/**
 * The default language has to cover every key (it is the fallback); other
 * locales only warn, since the renderer falls back to the default's copy.
 */
function checkGraphicsStrings(config, locale, errors, warnings) {
  const strings = readGraphicsStrings(locale);
  const isDefault = locale.play === config.defaultLanguage;
  const report = isDefault ? errors : warnings;

  if (!strings) {
    report.push(`${locale.play}: missing ${STRINGS_FILE} (graphics copy)`);
    return;
  }
  const missing = layoutKeys(config.layout).filter((key) => typeof strings[key] !== "string" || !strings[key].trim());
  if (missing.length > 0) {
    report.push(
      `${locale.play}: ${STRINGS_FILE} is missing ${missing.join(", ")}` +
        (isDefault ? "" : ` (renders in ${config.defaultLanguage})`)
    );
  }
}

function checkFeatureGraphic({ config, locale, errors, warnings }) {
  const feature = featureGraphicPath(config, locale, config.layout);
  if (!feature) return;
  if (!feature.exists) {
    // Optional on upload: Play keeps whatever feature graphic it already has.
    warnings.push(`${locale.play}: no ${feature.slug}.png in ${composedDir(config, locale)} (${captureHint(config)})`);
    return;
  }
  const { width, height } = pngSize(feature.path);
  if (width !== FEATURE_GRAPHIC.width || height !== FEATURE_GRAPHIC.height) {
    errors.push(
      `${locale.play}: ${feature.slug}.png is ${width}x${height}; Play requires ${FEATURE_GRAPHIC.width}x${FEATURE_GRAPHIC.height}.`
    );
  }
}

function checkScreenshots({ config, locale, requireScreenshots, errors, warnings, notes }) {
  const shots = listScreenshots(config, locale);
  const absent = shots.filter((shot) => !shot.exists);

  if (absent.length > 0) {
    const message =
      `${locale.play}: ${absent.length}/${shots.length} phone screenshots not found in ${dirname(shots[0].path)} ` +
      `(${captureHint(config)})`;
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
