#!/usr/bin/env node
// Renders the Play Store graphics (phone screenshots + feature graphic) from
// mobile/store/play/graphics/layout.json, the per-locale copy in
// listings/<play-locale>/graphics.json, and the raw app captures in
// mobile/screenshots/<app-locale>/ (from `npm run screenshots:mobile`).
//
// The slides are plain HTML/CSS (graphics/template.html + render.js), served
// from a throwaway local HTTP server so the page can fetch its JSON and images
// from one origin. Headless Chromium captures each slide at its exact pixel
// size; sharp flattens the result, because Play rejects PNGs with alpha.
//
// playwright and sharp come from the repo-root node_modules via Node's walk-up
// resolution (as with scripts/generate-brand-assets.mjs) — do not add them to
// mobile/package.json.
//
// Usage:
//   node scripts/play/render-graphics.mjs [options]
//     --serve              preview in a normal browser instead of capturing
//     --port <n>           port for --serve (default: 4610)
//     --locales a,b        only these Play locales (default: all configured)
//     --slides a,b         only these slide ids (default: all)

import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

import { parseArgs } from "./lib/args.mjs";
import { run } from "./lib/cli.mjs";
import { GRAPHICS_DIR, STRINGS_FILE, composedDir, layoutScreenshotSlugs, loadLayout } from "./lib/graphics.mjs";
import { loadConfig, resolveLocales } from "./lib/metadata.mjs";
import { pngSize } from "./lib/pngSize.mjs";

const REPO_ROOT = resolve(GRAPHICS_DIR, "..", "..", "..", "..");
const DEFAULT_PORT = 4610;
const RENDER_TIMEOUT_MS = 60_000;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

run(async () => {
  const options = parseArgs(process.argv.slice(2), { flags: ["serve"], values: ["port", "slides"] });

  const config = loadConfig();
  // Read once here for validation; the server re-reads it per request so
  // --serve picks up edits on reload.
  const layout = loadLayout();
  const locales = resolveLocales(config, options.locales);
  const slideIds = selectSlides(layout, options.slides);

  const server = await startServer(config, options.serve ? Number(options.port ?? DEFAULT_PORT) : 0);
  const origin = `http://localhost:${server.address().port}`;

  if (options.serve) {
    console.log("Previewing Play graphics (Ctrl-C to stop):");
    for (const locale of locales.filter((l) => !l.aliasOf)) {
      console.log(`  ${origin}/?locale=${encodeURIComponent(locale.play)}`);
    }
    return;
  }

  try {
    // Aliases (es-ES) upload their source locale's images, so render each source once.
    const targets = locales.filter((locale) => !locale.aliasOf);
    checkSources(config, layout, targets);
    await capture({ config, layout, locales: targets, slideIds, origin, fullRun: !options.slides });
  } finally {
    server.close();
  }
});

function selectSlides(layout, only) {
  const all = layout.slides.map((slide) => slide.id);
  if (!only) return all;
  const ids = only.split(",").map((s) => s.trim()).filter(Boolean);
  const unknown = ids.filter((id) => !all.includes(id));
  if (unknown.length > 0) throw new Error(`Unknown slide(s): ${unknown.join(", ")}. Layout has: ${all.join(", ")}`);
  return ids;
}

/** Fails before launching a browser if any locale lacks a capture the layout places. */
function checkSources(config, layout, locales) {
  const problems = [];
  for (const locale of locales) {
    const dir = join(config.screenshotRoot, locale.app);
    const missing = layoutScreenshotSlugs(layout).filter((slug) => !existsSync(join(dir, `${slug}.png`)));
    if (missing.length > 0) problems.push(`${locale.play}: missing ${missing.join(", ")} in ${dir}`);
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    throw new Error("Raw screenshots are missing (run `npm run screenshots:mobile` from the repo root).");
  }
}

async function capture({ config, layout, locales, slideIds, origin, fullRun }) {
  const chromium = await importRootDependency("playwright", "chromium");
  const sharp = await importRootDependency("sharp", "default");

  const browser = await chromium.launch();
  let failures = 0;
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });

    for (const locale of locales) {
      console.log(`\n${locale.play} (screenshots: ${locale.app})`);
      const outDir = composedDir(config, locale);
      // A full run replaces the set, so a removed or renamed slide can't linger
      // and get uploaded.
      if (fullRun) rmSync(outDir, { recursive: true, force: true });
      mkdirSync(outDir, { recursive: true });

      for (const id of slideIds) {
        const slide = layout.slides.find((s) => s.id === id);
        const { width, height } = slide.size;
        await page.setViewportSize({ width, height });
        await page.goto(`${origin}/?locale=${encodeURIComponent(locale.play)}&slide=${encodeURIComponent(id)}`);
        await page.waitForSelector("body[data-ready]", { state: "attached", timeout: RENDER_TIMEOUT_MS });

        const { warnings, errors } = await page.evaluate(() => window.__graphics);
        for (const warning of warnings) console.warn(`  ! ${warning}`);
        if (errors.length > 0) {
          for (const error of errors) console.error(`  ✗ ${error}`);
          failures += 1;
          continue;
        }

        const raw = await page.screenshot({ clip: { x: 0, y: 0, width, height } });
        const outPath = join(outDir, `${id}.png`);
        await sharp(raw)
          .flatten({ background: slide.background?.color ?? "#ffffff" })
          .png()
          .toFile(outPath);

        const size = pngSize(outPath);
        if (size.width !== width || size.height !== height) {
          console.error(`  ✗ ${id}: rendered ${size.width}x${size.height}, expected ${width}x${height}`);
          failures += 1;
          continue;
        }
        console.log(`  ✓ ${id} ${width}x${height}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (failures > 0) throw new Error(`${failures} slide(s) failed to render.`);
  console.log(`\n✓ Rendered to ${join(config.screenshotRoot, "play")}`);
}

async function importRootDependency(name, exportName) {
  try {
    const module = await import(name);
    return module[exportName];
  } catch {
    throw new Error(`${name} is not installed. Run \`npm install\` at the repo root.`);
  }
}

function startServer(config, port) {
  const server = createServer((req, res) => {
    try {
      const file = route(config, decodeURIComponent(new URL(req.url, "http://x").pathname));
      if (!file) return send(res, 404, "Not found");
      if (typeof file === "object") return send(res, 200, JSON.stringify(file), ".json");
      res.writeHead(200, { "Content-Type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      createReadStream(file).pipe(res);
    } catch (error) {
      send(res, 500, error.message);
    }
  });
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolvePromise(server));
  });
}

function send(res, status, body, ext = ".txt") {
  res.writeHead(status, { "Content-Type": CONTENT_TYPES[ext] ?? "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

/** Maps a request path to a file on disk, or to a JSON value to send. */
function route(config, path) {
  if (path === "/") return join(GRAPHICS_DIR, "template.html");
  if (path === "/render.js") return join(GRAPHICS_DIR, "render.js");
  if (path === "/layout.json") return join(GRAPHICS_DIR, "layout.json");

  if (path === "/locales.json") {
    // Re-resolved per request so locale config edits show up in --serve too.
    const fresh = loadConfig();
    return {
      defaultLanguage: fresh.defaultLanguage,
      locales: resolveLocales(fresh)
        .filter((locale) => !locale.aliasOf)
        .map(({ play, app }) => ({ play, app })),
    };
  }

  let match = path.match(/^\/strings\/([\w-]+)\.json$/);
  if (match) {
    const locale = resolveLocales(config).find((l) => l.play === match[1]);
    const file = locale && join(locale.dir, STRINGS_FILE);
    return file && existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  }

  match = path.match(/^\/shots\/([\w-]+)\/([\w-]+)\.png$/);
  if (match) return existingFile(join(config.screenshotRoot, match[1], `${match[2]}.png`));

  // Layout `asset` images: any image file in the repo, by repo-relative path.
  match = path.match(/^\/repo\/(.+)$/);
  if (match) {
    const file = resolve(REPO_ROOT, match[1]);
    if (!file.startsWith(REPO_ROOT + sep) || !ASSET_EXTENSIONS.has(extname(file).toLowerCase())) return null;
    return existingFile(file);
  }

  return null;
}

function existingFile(path) {
  return existsSync(path) && statSync(path).isFile() ? path : null;
}
