import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkListings } from "./checks.mjs";

// checkListings/checkScreenshots are plain fs readers (via metadata.mjs /
// pngSize.mjs), so real temp fixtures exercise every branch without needing
// to mock the module graph.

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Builds the 24-byte header pngSize.mjs actually reads (signature + IHDR + dims). */
function fakePng(path, width, height) {
  const header = Buffer.alloc(24);
  SIGNATURE.copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  writeFileSync(path, header);
}

function writeListingText(dir, { title = "App Title", shortDescription = "Short desc", fullDescription = "Full desc" } = {}) {
  mkdirSync(dir, { recursive: true });
  if (title !== null) writeFileSync(join(dir, "title.txt"), title);
  if (shortDescription !== null) writeFileSync(join(dir, "short-description.txt"), shortDescription);
  if (fullDescription !== null) writeFileSync(join(dir, "full-description.txt"), fullDescription);
}

test("checkListings", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "checks-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  function baseConfig(overrides = {}) {
    return {
      screenshots: { phone: ["home", "log"] },
      screenshotRoot: join(root, "screenshots"),
      ...overrides,
    };
  }

  function makeLocale(play, { screenshotDir } = {}) {
    const dir = join(root, "listings", play);
    return {
      play,
      aliasOf: null,
      dir,
      screenshotDir: screenshotDir ?? join(root, "screenshots", play),
    };
  }

  await t.test("duplicate screenshot slugs are an error", () => {
    const config = baseConfig({ screenshots: { phone: ["home", "home"] } });
    const { errors } = checkListings(config, [], { screenshots: false });
    assert.ok(errors.some((e) => e.includes('duplicate screenshot slug(s): home')));
  });

  await t.test("too many screenshot slugs is an error", () => {
    const phone = Array.from({ length: 9 }, (_, i) => `shot${i}`);
    const config = baseConfig({ screenshots: { phone } });
    const { errors } = checkListings(config, [], { screenshots: false });
    assert.ok(errors.some((e) => e.includes("9 phone screenshots configured")));
  });

  await t.test("too few screenshot slugs is an error", () => {
    const config = baseConfig({ screenshots: { phone: ["home"] } });
    const { errors } = checkListings(config, [], { screenshots: false });
    assert.ok(errors.some((e) => e.includes("Play requires at least 2 phone screenshots")));
  });

  await t.test("missing screenshotRoot warns (not requireScreenshots)", () => {
    const config = baseConfig({ screenshotRoot: join(root, "does-not-exist") });
    const { warnings, errors } = checkListings(config, [], { screenshots: true, requireScreenshots: false });
    assert.ok(warnings.some((w) => w.includes("No local screenshots")));
    assert.equal(errors.length, 0);
  });

  await t.test("missing screenshotRoot errors when requireScreenshots", () => {
    const config = baseConfig({ screenshotRoot: join(root, "still-does-not-exist") });
    const { errors } = checkListings(config, [], { screenshots: true, requireScreenshots: true });
    assert.ok(errors.some((e) => e.includes("No local screenshots")));
  });

  await t.test("missing text files are reported per file", () => {
    const locale = makeLocale("en-US-missing");
    mkdirSync(locale.dir, { recursive: true }); // dir exists, no files inside
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: false });
    assert.ok(errors.some((e) => e.includes("en-US-missing: missing title.txt")));
    assert.ok(errors.some((e) => e.includes("en-US-missing: missing short-description.txt")));
    assert.ok(errors.some((e) => e.includes("en-US-missing: missing full-description.txt")));
  });

  await t.test("aliased locale annotates the source in messages", () => {
    const locale = { ...makeLocale("es-419"), aliasOf: "es-ES" };
    mkdirSync(locale.dir, { recursive: true });
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: false });
    assert.ok(errors.some((e) => e.includes("es-419 (via es-ES): missing title.txt")));
  });

  await t.test("empty text field is an error", () => {
    const locale = makeLocale("en-empty");
    writeListingText(locale.dir, { title: "" });
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: false });
    assert.ok(errors.some((e) => e.includes("en-empty: Title is empty.")));
  });

  await t.test("text over the configured limit is an error", () => {
    const locale = makeLocale("en-long");
    const title = "a very long title indeed";
    writeListingText(locale.dir, { title });
    const config = baseConfig({ limits: { title: 5 } });
    const { errors } = checkListings(config, [locale], { screenshots: false });
    assert.ok(errors.some((e) => e.includes(`en-long: Title is ${title.length} chars (limit 5).`)));
  });

  await t.test("no limit configured skips the length check", () => {
    const locale = makeLocale("en-nolimit");
    writeListingText(locale.dir, { title: "a very long title indeed, well beyond any usual cap" });
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: false });
    assert.ok(!errors.some((e) => e.includes("chars (limit")));
  });

  await t.test("a multi-line title is an error", () => {
    const locale = makeLocale("en-multiline");
    writeListingText(locale.dir, { title: "Line one\nLine two" });
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: false });
    assert.ok(errors.some((e) => e.includes("en-multiline: Title must be a single line.")));
  });

  await t.test("valid text and screenshots disabled produces no errors/warnings", () => {
    const locale = makeLocale("en-valid1");
    writeListingText(locale.dir);
    const config = baseConfig();
    const { errors, warnings } = checkListings(config, [locale], { screenshots: false });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
  });

  await t.test("missing screenshot files warn per-locale (not requireScreenshots)", () => {
    const locale = makeLocale("en-noshots");
    writeListingText(locale.dir);
    mkdirSync(locale.screenshotDir, { recursive: true }); // exists but empty
    const config = baseConfig();
    const { warnings, errors } = checkListings(config, [locale], { screenshots: true, requireScreenshots: false });
    assert.ok(warnings.some((w) => w.includes("en-noshots: 2/2 phone screenshots not found")));
    assert.equal(errors.length, 0);
  });

  await t.test("missing screenshot files error when requireScreenshots", () => {
    const locale = makeLocale("en-noshots-req");
    writeListingText(locale.dir);
    mkdirSync(locale.screenshotDir, { recursive: true });
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: true, requireScreenshots: true });
    assert.ok(errors.some((e) => e.includes("en-noshots-req: 2/2 phone screenshots not found")));
  });

  await t.test("a non-PNG screenshot file surfaces pngSize's error", () => {
    const locale = makeLocale("en-badpng");
    writeListingText(locale.dir);
    mkdirSync(locale.screenshotDir, { recursive: true });
    writeFileSync(join(locale.screenshotDir, "home.png"), "not a png");
    fakePng(join(locale.screenshotDir, "log.png"), 1080, 1920);
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: true });
    assert.ok(errors.some((e) => e.includes("en-badpng:") && e.includes("is not a PNG file")));
  });

  await t.test("an out-of-range screenshot dimension is an error", () => {
    const locale = makeLocale("en-toosmall");
    writeListingText(locale.dir);
    mkdirSync(locale.screenshotDir, { recursive: true });
    fakePng(join(locale.screenshotDir, "home.png"), 100, 200); // below MIN_SIDE (320)
    fakePng(join(locale.screenshotDir, "log.png"), 1080, 1920);
    const config = baseConfig();
    const { errors } = checkListings(config, [locale], { screenshots: true });
    assert.ok(errors.some((e) => e.includes("en-toosmall: home.png is 100x200; each side must be 320-3840px.")));
  });

  await t.test("an over-ratio screenshot produces a padding note, not an error", () => {
    const locale = makeLocale("en-widenote");
    writeListingText(locale.dir);
    mkdirSync(locale.screenshotDir, { recursive: true });
    fakePng(join(locale.screenshotDir, "home.png"), 1080, 2400); // 2400/1080 > 2:1
    fakePng(join(locale.screenshotDir, "log.png"), 1080, 1920); // compliant
    const config = baseConfig();
    const { errors, notes } = checkListings(config, [locale], { screenshots: true });
    assert.deepEqual(errors, []);
    assert.ok(notes.some((n) => n.includes("en-widenote: home.png is 1080x2400 (over Play's 2:1 limit)")));
    assert.ok(notes.some((n) => n.includes("will be padded to")));
    assert.ok(!notes.some((n) => n.includes("log.png")));
  });

  await t.test("compliant screenshots produce no notes", () => {
    const locale = makeLocale("en-compliant");
    writeListingText(locale.dir);
    mkdirSync(locale.screenshotDir, { recursive: true });
    fakePng(join(locale.screenshotDir, "home.png"), 1080, 1920);
    fakePng(join(locale.screenshotDir, "log.png"), 1080, 1920);
    const config = baseConfig();
    const { errors, warnings, notes } = checkListings(config, [locale], { screenshots: true });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
    assert.deepEqual(notes, []);
  });

  await t.test("screenshots:false skips per-locale screenshot checks entirely", () => {
    const locale = makeLocale("en-skip");
    writeListingText(locale.dir);
    // No screenshotDir created at all — would warn/error if screenshots were checked.
    const config = baseConfig();
    const { errors, warnings } = checkListings(config, [locale], { screenshots: false });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
  });
});
