import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  precheck,
  connect,
  openEdit,
  push,
  printTextDiff,
  printLineDiff,
} from "./push.mjs";

// push.mjs's `connect(ctx)` only calls createPlayClient(...) (which needs a
// real service-account key) when ctx.play is not already set — pre-seeding
// ctx.play with a fake client below exercises the orchestration without
// touching the network or mocking the module graph.

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fakePng(path, width, height) {
  const header = Buffer.alloc(24);
  SIGNATURE.copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  writeFileSync(path, header);
}

function fakePlayClient(overrides = {}) {
  return {
    insertEdit: mock.fn(async () => ({ id: "edit-1" })),
    listListings: mock.fn(async () => ({ listings: [] })),
    updateListing: mock.fn(async () => {}),
    deletePhoneScreenshots: mock.fn(async () => {}),
    uploadPhoneScreenshot: mock.fn(async () => {}),
    validateEdit: mock.fn(async () => {}),
    commitEdit: mock.fn(async () => {}),
    deleteEdit: mock.fn(async () => {}),
    ...overrides,
  };
}

test("precheck", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "push-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const config = { screenshots: { phone: ["home", "log"] }, screenshotRoot: join(root, "screenshots") };

  await t.test("throws and logs when the listing has errors", () => {
    const locale = { play: "en-missing", aliasOf: null, dir: join(root, "missing-listing"), screenshotDir: join(root, "no-shots") };
    mkdirSync(locale.dir, { recursive: true });
    const logSpy = mock.method(console, "error", () => {});
    t.after(() => logSpy.mock.restore());

    assert.throws(
      () => precheck({ config, locales: [locale], options: { dryRun: false }, pushImages: false }),
      /Listing metadata is not publishable/
    );
  });

  await t.test("does not throw when only warnings/notes are produced", () => {
    const dir = join(root, "ok-listing");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "title.txt"), "Title");
    writeFileSync(join(dir, "short-description.txt"), "Short");
    writeFileSync(join(dir, "full-description.txt"), "Full");
    const locale = { play: "en-ok", aliasOf: null, dir, screenshotDir: join(root, "missing-shots-dir") };

    const warnSpy = mock.method(console, "warn", () => {});
    t.after(() => warnSpy.mock.restore());

    // screenshotRoot doesn't exist -> a warning, not an error, since dryRun is true.
    assert.doesNotThrow(() =>
      precheck({ config, locales: [locale], options: { dryRun: true }, pushImages: true })
    );
  });
});

test("connect", () => {
  const fake = fakePlayClient();
  const ctx = { play: fake, config: { packageName: "com.example.app" }, options: {} };
  assert.equal(connect(ctx), fake);
});

test("openEdit", async () => {
  const fake = fakePlayClient();
  const ctx = { play: fake, config: { packageName: "com.example.app" }, options: {} };
  const logSpy = mock.method(console, "log", () => {});

  const id = await openEdit(ctx);

  assert.equal(id, "edit-1");
  assert.equal(ctx.editId, "edit-1");
  assert.equal(fake.insertEdit.mock.calls.length, 1);
  logSpy.mock.restore();
});

test("push", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "push-orch-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  function makeCtx({ noCommit = false } = {}) {
    const listingDir = join(root, "listing");
    const screenshotDir = join(root, "shots");
    mkdirSync(listingDir, { recursive: true });
    mkdirSync(screenshotDir, { recursive: true });
    writeFileSync(join(listingDir, "title.txt"), "Title");
    writeFileSync(join(listingDir, "short-description.txt"), "Short");
    writeFileSync(join(listingDir, "full-description.txt"), "Full");
    fakePng(join(screenshotDir, "home.png"), 1080, 1920);
    fakePng(join(screenshotDir, "log.png"), 1080, 1920);

    const locale = { play: "en-US", aliasOf: null, dir: listingDir, screenshotDir };
    const config = {
      packageName: "com.example.app",
      screenshots: { phone: ["home", "log"] },
      screenshotRoot: root,
    };
    const play = fakePlayClient();
    return {
      ctx: {
        options: { noCommit },
        config,
        locales: [locale],
        pushText: true,
        pushImages: true,
        play,
        editId: null,
      },
      play,
    };
  }

  await t.test("pushes text and images, then commits", async () => {
    const { ctx, play } = makeCtx();
    const logSpy = mock.method(console, "log", () => {});
    t.after(() => logSpy.mock.restore());

    await push(ctx);

    assert.equal(play.insertEdit.mock.calls.length, 1);
    assert.equal(play.updateListing.mock.calls.length, 1);
    assert.deepEqual(play.updateListing.mock.calls[0].arguments[1], "en-US");
    assert.equal(play.deletePhoneScreenshots.mock.calls.length, 1);
    assert.equal(play.uploadPhoneScreenshot.mock.calls.length, 2);
    assert.equal(play.validateEdit.mock.calls.length, 1);
    assert.equal(play.commitEdit.mock.calls.length, 1);
    assert.equal(ctx.editId, null); // reset after commit
  });

  await t.test("--no-commit validates but does not commit", async () => {
    const { ctx, play } = makeCtx({ noCommit: true });
    const logSpy = mock.method(console, "log", () => {});
    t.after(() => logSpy.mock.restore());

    await push(ctx);

    assert.equal(play.validateEdit.mock.calls.length, 1);
    assert.equal(play.commitEdit.mock.calls.length, 0);
    assert.equal(ctx.editId, "edit-1"); // left open
  });

  await t.test("text-only skips screenshot calls", async () => {
    const { ctx, play } = makeCtx();
    ctx.pushImages = false;
    const logSpy = mock.method(console, "log", () => {});
    t.after(() => logSpy.mock.restore());

    await push(ctx);

    assert.equal(play.updateListing.mock.calls.length, 1);
    assert.equal(play.deletePhoneScreenshots.mock.calls.length, 0);
    assert.equal(play.uploadPhoneScreenshot.mock.calls.length, 0);
  });

  await t.test("screenshots-only skips the text update", async () => {
    const { ctx, play } = makeCtx();
    ctx.pushText = false;
    const logSpy = mock.method(console, "log", () => {});
    t.after(() => logSpy.mock.restore());

    await push(ctx);

    assert.equal(play.updateListing.mock.calls.length, 0);
    assert.equal(play.uploadPhoneScreenshot.mock.calls.length, 2);
  });
});

test("printTextDiff / printLineDiff", async (t) => {
  await t.test("unchanged field logs '= <label> unchanged' and no diff lines", () => {
    const lines = [];
    const spy = mock.method(console, "log", (msg) => lines.push(msg));
    t.after(() => spy.mock.restore());

    printTextDiff({ title: "Same", shortDescription: "Same", fullDescription: "Same" }, {
      title: "Same",
      shortDescription: "Same",
      fullDescription: "Same",
    });

    assert.ok(lines.some((l) => l.includes("= Title unchanged")));
    assert.ok(!lines.some((l) => l.startsWith("    -") || l.startsWith("    +")));
  });

  await t.test("changed field logs a ~ header and line diff", () => {
    const lines = [];
    const spy = mock.method(console, "log", (msg) => lines.push(msg));
    t.after(() => spy.mock.restore());

    printTextDiff({ title: "Old Title" }, { title: "New Title", shortDescription: "", fullDescription: "" });

    assert.ok(lines.some((l) => l.includes("~ Title (9 → 9 chars)")));
    assert.ok(lines.some((l) => l.includes("- Old Title")));
    assert.ok(lines.some((l) => l.includes("+ New Title")));
  });

  await t.test("no live listing treats before as empty", () => {
    const lines = [];
    const spy = mock.method(console, "log", (msg) => lines.push(msg));
    t.after(() => spy.mock.restore());

    printTextDiff(null, { title: "Fresh", shortDescription: "", fullDescription: "" });

    assert.ok(lines.some((l) => l.includes("~ Title (0 → 5 chars)")));
  });

  await t.test("printLineDiff caps output at maxLines and reports the remainder", () => {
    const lines = [];
    const spy = mock.method(console, "log", (msg) => lines.push(msg));
    t.after(() => spy.mock.restore());

    const before = Array.from({ length: 5 }, (_, i) => `old${i}`).join("\n");
    const after = Array.from({ length: 5 }, (_, i) => `new${i}`).join("\n");
    printLineDiff(before, after, 4);

    // 5 removed + 5 added = 10 changed lines, capped to 4 shown.
    assert.equal(lines.filter((l) => l.startsWith("    -") || l.startsWith("    +")).length, 4);
    assert.ok(lines.some((l) => l.includes("… 6 more changed line(s)")));
  });
});
