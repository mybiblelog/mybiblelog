// Screenshot spec math + the padding step that keeps captures uploadable.
//
// Play rejects a screenshot whose long side is more than twice its short side.
// The Maestro captures come off a 1080x2400 (20:9) emulator, which is 2.22x —
// so every phone shot would be rejected as-is. Rather than change the capture
// device, out-of-spec images are letterboxed onto a background colour just
// before upload; the originals under mobile/screenshots/ are never rewritten.

import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";

export const MIN_SIDE = 320;
export const MAX_SIDE = 3840;
export const MAX_RATIO = 2;

/**
 * The canvas an image must be padded onto to satisfy the 2:1 rule, or null when
 * it already complies. Only the short side grows, so the pixels never shrink.
 */
export function padTarget({ width, height }) {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  if (long <= short * MAX_RATIO) return null;

  const needed = Math.ceil(long / MAX_RATIO);
  return height > width ? { width: needed, height } : { width, height: needed };
}

/**
 * Returns a path that is safe to upload: the original when it already complies,
 * otherwise a padded copy written under `outDir`.
 *
 * sharp is resolved from the repo-root node_modules by Node's walk-up, the same
 * arrangement scripts/generate-brand-assets.mjs documents — do not add it to
 * mobile/package.json.
 */
export async function prepareScreenshot({ path, size, background, outDir }) {
  const target = padTarget(size);
  if (!target) return { path, padded: null };

  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    throw new Error(
      `${basename(path)} is ${size.width}x${size.height}, which Play rejects (long side > 2x short side), ` +
        "and sharp is not installed to pad it. Run `npm install` at the repo root."
    );
  }

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, basename(path));
  await sharp(path)
    .resize({
      width: target.width,
      height: target.height,
      fit: "contain",
      background,
    })
    .png()
    .toFile(outPath);

  return { path: outPath, padded: target };
}
