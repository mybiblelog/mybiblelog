// The composed Play graphics: layout (mobile/store/play/graphics/layout.json),
// per-locale copy (listings/<play-locale>/graphics.json) and where the rendered
// PNGs land (mobile/screenshots/play/<play-locale>/).
//
// Dependency-free like metadata.mjs, so the offline validator can check the
// copy against the layout without a browser installed.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolved here rather than imported from metadata.mjs, which imports this
// module: a cycle would leave STORE_DIR uninitialized at evaluation time.
const here = dirname(fileURLToPath(import.meta.url));
export const GRAPHICS_DIR = resolve(here, "..", "..", "..", "store", "play", "graphics");
export const LAYOUT_PATH = join(GRAPHICS_DIR, "layout.json");
export const STRINGS_FILE = "graphics.json";

export const FEATURE_GRAPHIC = { width: 1024, height: 500 };

export function loadLayout(layoutPath = LAYOUT_PATH) {
  let layout;
  try {
    layout = JSON.parse(readFileSync(layoutPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${layoutPath}: ${error.message}`);
  }
  if (!Array.isArray(layout.slides) || layout.slides.length === 0) {
    throw new Error(`${layoutPath}: "slides" must be a non-empty array.`);
  }

  const ids = new Set();
  for (const slide of layout.slides) {
    if (!slide.id || !/^[\w-]+$/.test(slide.id)) throw new Error(`${layoutPath}: slide id "${slide.id}" must be [A-Za-z0-9_-].`);
    if (ids.has(slide.id)) throw new Error(`${layoutPath}: duplicate slide id "${slide.id}".`);
    ids.add(slide.id);
    if (slide.kind !== "phone" && slide.kind !== "feature") {
      throw new Error(`${layoutPath}: slide "${slide.id}" needs "kind": "phone" or "feature".`);
    }
    if (!(slide.size?.width > 0 && slide.size?.height > 0)) {
      throw new Error(`${layoutPath}: slide "${slide.id}" needs a "size" with width and height.`);
    }
  }
  if (layout.slides.filter((slide) => slide.kind === "feature").length > 1) {
    throw new Error(`${layoutPath}: only one "feature" slide is allowed.`);
  }
  return layout;
}

export const phoneSlides = (layout) => layout.slides.filter((slide) => slide.kind === "phone");
export const featureSlide = (layout) => layout.slides.find((slide) => slide.kind === "feature") ?? null;

/** Every text key the layout asks for. */
export function layoutKeys(layout) {
  return [...new Set(layout.slides.flatMap((slide) => (slide.texts ?? []).map((text) => text.key)))];
}

/** Every app screenshot slug the layout places (assets from the repo are not screenshots). */
export function layoutScreenshotSlugs(layout) {
  return [...new Set(layout.slides.flatMap((slide) => (slide.images ?? []).filter((i) => i.src).map((i) => i.src)))];
}

/** A locale's graphics copy, or null when its graphics.json does not exist. */
export function readGraphicsStrings(locale) {
  const path = join(locale.dir, STRINGS_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

/** Rendered output for a locale. Aliases share their source locale's images. */
export function composedDir(config, locale) {
  return join(config.screenshotRoot, "play", locale.listing);
}

export function featureGraphicPath(config, locale, layout) {
  const slide = featureSlide(layout);
  if (!slide) return null;
  const path = join(composedDir(config, locale), `${slide.id}.png`);
  return { slug: slide.id, path, exists: existsSync(path) };
}
