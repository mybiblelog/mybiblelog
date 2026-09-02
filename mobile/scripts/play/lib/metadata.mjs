// Reads the Play listing metadata under mobile/store/play/ into plain objects.
//
// Pure and dependency-free: both the offline validator and the publisher build
// on this, and the validator runs in CI before anything is installed beyond the
// mobile package itself.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const STORE_DIR = resolve(here, "..", "..", "..", "store", "play");
export const CONFIG_PATH = join(STORE_DIR, "config.json");

/** The three text fields Play exposes on a localized listing, in listing order. */
export const TEXT_FIELDS = [
  { key: "title", file: "title.txt", limitKey: "title", label: "Title" },
  {
    key: "shortDescription",
    file: "short-description.txt",
    limitKey: "shortDescription",
    label: "Short description",
  },
  {
    key: "fullDescription",
    file: "full-description.txt",
    limitKey: "fullDescription",
    label: "Full description",
  },
];

export function loadConfig(configPath = CONFIG_PATH) {
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${configPath}: ${error.message}`);
  }

  if (!config.packageName) throw new Error(`${configPath}: "packageName" is required.`);
  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error(`${configPath}: "locales" must be a non-empty array.`);
  }
  if (!Array.isArray(config.screenshots?.phone)) {
    throw new Error(`${configPath}: "screenshots.phone" must be an array of slugs.`);
  }

  config.configPath = configPath;
  config.screenshotRoot = resolve(dirname(configPath), config.screenshots.sourceDir ?? "screenshots");
  return config;
}

/**
 * Expands config.locales into descriptors the tools can act on.
 *
 * `aliasOf` lets two Play locales share one set of files (es-ES ships the
 * es-419 copy) without duplicating the text on disk.
 */
export function resolveLocales(config, only = null) {
  const byPlay = new Map(config.locales.map((entry) => [entry.play, entry]));
  const seen = new Set();

  const resolved = config.locales.map((entry) => {
    if (!entry.play) throw new Error('Each "locales" entry needs a "play" code.');
    if (seen.has(entry.play)) throw new Error(`Duplicate Play locale "${entry.play}" in config.`);
    seen.add(entry.play);

    let source = entry;
    if (entry.aliasOf) {
      source = byPlay.get(entry.aliasOf);
      if (!source) throw new Error(`"${entry.play}" aliases unknown locale "${entry.aliasOf}".`);
      if (source.aliasOf) throw new Error(`"${entry.play}" aliases "${entry.aliasOf}", which is itself an alias.`);
    }
    if (!source.app) throw new Error(`Locale "${source.play}" needs an "app" locale for screenshots.`);

    return {
      play: entry.play,
      app: source.app,
      aliasOf: entry.aliasOf ?? null,
      dir: join(STORE_DIR, "listings", source.play),
      screenshotDir: join(config.screenshotRoot, source.app),
    };
  });

  if (!only) return resolved;

  const wanted = new Set(only);
  const unknown = only.filter((code) => !byPlay.has(code));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown locale(s): ${unknown.join(", ")}. Configured: ${config.locales.map((l) => l.play).join(", ")}`
    );
  }
  return resolved.filter((locale) => wanted.has(locale.play));
}

/** Reads the three text files for a locale. Missing files are reported, not thrown. */
export function readListingText(locale) {
  const text = {};
  const missing = [];
  for (const field of TEXT_FIELDS) {
    const path = join(locale.dir, field.file);
    if (!existsSync(path)) {
      missing.push(field.file);
      continue;
    }
    // Editors add a trailing newline; Play would render it as blank space.
    text[field.key] = readFileSync(path, "utf8").replace(/\s+$/, "");
  }
  return { text, missing };
}

/** Resolves the configured phone screenshots for a locale, in upload order. */
export function listScreenshots(config, locale) {
  return config.screenshots.phone.map((slug) => {
    const path = join(locale.screenshotDir, `${slug}.png`);
    return { slug, path, exists: existsSync(path) };
  });
}
