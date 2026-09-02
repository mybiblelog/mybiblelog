#!/usr/bin/env node
// Pushes the local Play listing metadata (mobile/store/play/) and the local
// screenshots (mobile/screenshots/, gitignored) to Google Play via the
// Developer API v3.
//
// Order matters: everything is checked offline first, because a failure halfway
// through leaves a partially applied edit behind; then one edit carries every
// locale, so the listing updates atomically when it commits.
//
// Usage:
//   node scripts/play/push.mjs [options]
//     --dry-run            print what would change; change nothing
//     --locales a,b        only these Play locales (default: all configured)
//     --text-only          skip screenshots
//     --screenshots-only   skip listing text
//     --no-commit          apply + validate the edit, but leave it uncommitted
//     --key <path>         service-account JSON key (default: $GOOGLE_PLAY_SERVICE_ACCOUNT_KEY)

import { join } from "node:path";
import { parseArgs } from "./lib/args.mjs";
import { checkListings } from "./lib/checks.mjs";
import { prepareScreenshot } from "./lib/images.mjs";
import { listScreenshots, loadConfig, readListingText, resolveLocales, TEXT_FIELDS } from "./lib/metadata.mjs";
import { createPlayClient } from "./lib/playApi.mjs";
import { pngSize } from "./lib/pngSize.mjs";
import { run } from "./lib/cli.mjs";

run(async () => {
  const options = parseArgs(process.argv.slice(2), {
    flags: ["dry-run", "text-only", "screenshots-only", "no-commit"],
  });
  if (options.textOnly && options.screenshotsOnly) {
    throw new Error("--text-only and --screenshots-only are mutually exclusive.");
  }

  const config = loadConfig();
  const ctx = {
    options,
    config,
    locales: resolveLocales(config, options.locales),
    pushText: !options.screenshotsOnly,
    pushImages: !options.textOnly,
    play: null,
    editId: null,
  };

  precheck(ctx);

  try {
    if (options.dryRun) await dryRun(ctx);
    else await push(ctx);
  } catch (error) {
    // Leaving an edit open would block the next run with a 409.
    if (ctx.editId) await ctx.play.deleteEdit(ctx.editId).catch(() => {});
    throw error;
  }
});

/**
 * Everything knowable without the network. A real push needs the images on
 * disk; a dry run only reports what it would have uploaded, so a missing
 * capture is a warning there rather than a failure.
 */
function precheck({ config, locales, options, pushImages }) {
  const { errors, warnings, notes } = checkListings(config, locales, {
    screenshots: pushImages,
    requireScreenshots: pushImages && !options.dryRun,
  });

  for (const note of notes) console.log(`  ${note}`);
  for (const warning of warnings) console.warn(`! ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`✗ ${error}`);
    throw new Error("Listing metadata is not publishable (see `npm run play:validate`).");
  }
}

/** The API is only touched when something actually has to be read or written. */
function connect(ctx) {
  ctx.play ??= createPlayClient({ packageName: ctx.config.packageName, keyPath: ctx.options.key });
  return ctx.play;
}

async function openEdit(ctx) {
  const edit = await connect(ctx).insertEdit();
  ctx.editId = edit.id;
  console.log(`Edit ${edit.id} opened for ${ctx.config.packageName}`);
  return edit.id;
}

async function dryRun(ctx) {
  const { config, locales, pushText, pushImages } = ctx;

  // Only the text diff needs the live listing; a screenshots-only preview stays
  // entirely offline, so it runs without Play credentials.
  const remote = new Map();
  if (pushText) {
    const live = await connect(ctx).listListings(await openEdit(ctx));
    for (const listing of live.listings ?? []) remote.set(listing.language, listing);
  }

  for (const locale of locales) {
    console.log(`\n${locale.play}`);
    if (pushText) printTextDiff(remote.get(locale.play), readListingText(locale).text);
    if (pushImages) await printScreenshotPlan(ctx, locale);
  }

  const unmanaged = [...remote.keys()].filter((code) => !config.locales.some((l) => l.play === code));
  if (unmanaged.length > 0) {
    console.warn(`\n! Live listings not managed from this repo: ${unmanaged.join(", ")}`);
  }

  if (ctx.editId) {
    await ctx.play.deleteEdit(ctx.editId);
    ctx.editId = null;
  }
  console.log("\nDry run — nothing changed.");
}

async function push(ctx) {
  const { config, locales, options, pushText, pushImages } = ctx;
  const play = connect(ctx);
  const editId = await openEdit(ctx);

  for (const locale of locales) {
    console.log(`\n${locale.play}`);

    if (pushText) {
      await play.updateListing(editId, locale.play, readListingText(locale).text);
      console.log("  ✓ listing text");
    }

    if (pushImages) {
      // Play appends uploads, so the existing set has to go first — otherwise a
      // re-run stacks duplicates and blows the 8-screenshot cap.
      await play.deletePhoneScreenshots(editId, locale.play);
      for (const shot of listScreenshots(config, locale)) {
        await play.uploadPhoneScreenshot(editId, locale.play, await preparedPath(ctx, locale, shot));
        console.log(`  ✓ ${shot.slug}`);
      }
    }
  }

  await play.validateEdit(editId);

  if (options.noCommit) {
    console.log(`\n✓ Edit ${editId} validated and left uncommitted (--no-commit).`);
    return;
  }

  ctx.editId = null;
  await play.commitEdit(editId);
  console.log("\n✓ Committed. Play reviews listing changes before they go live.");
}

/** Pads an out-of-spec capture into mobile/screenshots/.play-upload/<locale>/. */
async function preparedPath({ config }, locale, shot) {
  const { path } = await prepareScreenshot({
    path: shot.path,
    size: pngSize(shot.path),
    background: config.screenshots.background ?? "#ffffff",
    outDir: join(config.screenshotRoot, ".play-upload", locale.play),
  });
  return path;
}

function printTextDiff(liveListing, local) {
  for (const field of TEXT_FIELDS) {
    const before = (liveListing?.[field.key] ?? "").replace(/\r\n/g, "\n").trimEnd();
    const after = local[field.key];
    if (before === after) {
      console.log(`  = ${field.label} unchanged`);
      continue;
    }
    console.log(`  ~ ${field.label} (${before.length} → ${after.length} chars)`);
    printLineDiff(before, after);
  }
}

/** A plain line-level diff — enough to eyeball a copy change before committing. */
function printLineDiff(before, after, maxLines = 12) {
  const oldLines = before ? before.split("\n") : [];
  const newLines = after.split("\n");
  const changed = [];

  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i += 1) {
    if (oldLines[i] === newLines[i]) continue;
    if (oldLines[i] !== undefined) changed.push(`    - ${oldLines[i]}`);
    if (newLines[i] !== undefined) changed.push(`    + ${newLines[i]}`);
  }

  for (const line of changed.slice(0, maxLines)) console.log(line);
  if (changed.length > maxLines) console.log(`    … ${changed.length - maxLines} more changed line(s)`);
}

async function printScreenshotPlan(ctx, locale) {
  const shots = listScreenshots(ctx.config, locale);
  const present = shots.filter((shot) => shot.exists);

  console.log(`  → would replace phone screenshots with ${present.length} image(s), in order:`);
  for (const shot of present) {
    const file = await preparedPath(ctx, locale, shot);
    const { width, height } = pngSize(file);
    console.log(`    ${shot.slug} ${width}x${height}${file === shot.path ? "" : " (padded)"}`);
  }
  for (const shot of shots.filter((s) => !s.exists)) console.log(`    ${shot.slug} — MISSING`);
}
