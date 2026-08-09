/**
 * Generates the mobile app's brand image assets from the web logo SVG.
 *
 * Usage (from repo root or mobile/): node mobile/scripts/generate-brand-assets.mjs
 *
 * Depends on `sharp` from the repo-root node_modules (resolved via Node's
 * walk-up resolution) — do not add sharp to mobile/package.json.
 *
 * Outputs overwrite the existing files referenced by app.json:
 *   icon.png                    1024x1024  white bg, logo ~70%
 *   splash-icon.png             1024x1024  transparent bg, logo ~44% (splash plugin supplies
 *                                          bg color; Android 12+'s System SplashScreen API
 *                                          circular-masks the icon, so it needs the same
 *                                          safe zone as the adaptive icon layers below)
 *   android-icon-foreground.png  512x512   transparent bg, logo ~44% adaptive safe zone
 *   android-icon-background.png  512x512   solid white
 *   android-icon-monochrome.png  432x432   white alpha silhouette, ~44% safe zone
 *   favicon.png                    48x48   white bg, logo ~80%
 *
 * The ~44% figures are tighter than Android's documented 66% adaptive-icon
 * minimum — that headroom is deliberate, tuned by eye against the emulator's
 * circular mask rather than derived from the spec.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const logoPath = path.join(repoRoot, "web", "public", "images", "logo.svg");
const outDir = path.join(scriptDir, "..", "assets", "images");

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Alpha-weighted centroid of an RGBA raster — i.e. where the glyph's visible
 * mass actually sits, which is what the eye reads as its center.
 */
const inkCentroid = (data, { width, height, channels }) => {
  let sumX = 0;
  let sumY = 0;
  let mass = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3];
      sumX += x * alpha;
      sumY += y * alpha;
      mass += alpha;
    }
  }
  return { x: sumX / mass, y: sumY / mass };
};

const renderLogo = async (svgText, boxSize) => {
  // Rasterize the full 100x100 viewBox at high density, then trim the
  // transparent margin (the viewBox is not tightly cropped to the glyph) and
  // scale the result to fit boxSize. Returns the tight glyph plus its ink
  // centroid so the caller can place it optically rather than by bounding box.
  const density = Math.ceil((boxSize / 100) * 72) + 72;
  const rasterized = await sharp(Buffer.from(svgText), { density }).png().toBuffer();
  const trimmed = await sharp(rasterized).trim().toBuffer();
  const fitted = await sharp(trimmed)
    .resize(boxSize, boxSize, { fit: "inside", background: TRANSPARENT })
    .png()
    .toBuffer();
  const { data, info } = await sharp(fitted)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    buffer: fitted,
    width: info.width,
    height: info.height,
    centroid: inkCentroid(data, info),
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const composeOnCanvas = async (logo, canvasSize, background, fileName) => {
  // Optical centering: line the glyph's ink centroid up with the canvas
  // center. The logo's bounding box is *not* a usable proxy — the tall left
  // bar and the two right-hand ellipses put its visual mass ~4.6% of the
  // glyph width left of the box center, so bounding-box centering (the old
  // gravity:"center") left every output looking shifted left. Clamped so a
  // wide glyph can never be pushed off the canvas.
  const left = clamp(Math.round(canvasSize / 2 - logo.centroid.x), 0, canvasSize - logo.width);
  const top = clamp(Math.round(canvasSize / 2 - logo.centroid.y), 0, canvasSize - logo.height);
  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background },
  })
    .composite([{ input: logo.buffer, left, top }])
    .png()
    .toFile(path.join(outDir, fileName));
  console.log(`wrote ${fileName} (${canvasSize}x${canvasSize})`);
};

const main = async () => {
  const svgText = await readFile(logoPath, "utf8");
  // Single-color silhouette for the Android monochrome (themed) icon;
  // Android tints via the alpha channel, so the fill color just needs alpha.
  const monoSvgText = svgText.replaceAll("#00aaf9", "#ffffff").replaceAll("#0965f7", "#ffffff");

  await composeOnCanvas(await renderLogo(svgText, 716), 1024, WHITE, "icon.png");
  await composeOnCanvas(await renderLogo(svgText, 453), 1024, TRANSPARENT, "splash-icon.png");
  await composeOnCanvas(
    await renderLogo(svgText, 226),
    512,
    TRANSPARENT,
    "android-icon-foreground.png"
  );
  await composeOnCanvas(
    await renderLogo(monoSvgText, 191),
    432,
    TRANSPARENT,
    "android-icon-monochrome.png"
  );
  await composeOnCanvas(await renderLogo(svgText, 38), 48, WHITE, "favicon.png");

  await sharp({ create: { width: 512, height: 512, channels: 4, background: WHITE } })
    .png()
    .toFile(path.join(outDir, "android-icon-background.png"));
  console.log("wrote android-icon-background.png (512x512)");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
