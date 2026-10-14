import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadConfig, resolveLocales } from "./metadata.mjs";

function writeConfig(dir, data) {
  const path = join(dir, "config.json");
  writeFileSync(path, JSON.stringify(data));
  return path;
}

function baseConfig(overrides = {}) {
  return {
    packageName: "com.mybiblelog.app",
    locales: [{ play: "en-US", app: "en" }],
    screenshots: { phone: ["home", "log"] },
    ...overrides,
  };
}

test("loadConfig", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "metadata-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  await t.test("loads a valid config and annotates configPath/screenshotRoot", () => {
    const path = writeConfig(dir, baseConfig());
    const config = loadConfig(path);
    assert.equal(config.packageName, "com.mybiblelog.app");
    assert.equal(config.configPath, path);
    assert.equal(config.screenshotRoot, join(dir, "screenshots"));
  });

  await t.test("honors a custom screenshots.sourceDir", () => {
    const path = writeConfig(dir, baseConfig({ screenshots: { phone: ["home"], sourceDir: "captures" } }));
    const config = loadConfig(path);
    assert.equal(config.screenshotRoot, join(dir, "captures"));
  });

  await t.test("throws with the path when the file cannot be read", () => {
    const path = join(dir, "does-not-exist.json");
    assert.throws(() => loadConfig(path), new RegExp(`Could not read ${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  });

  await t.test("throws on invalid JSON", () => {
    const path = join(dir, "bad.json");
    writeFileSync(path, "{ not json");
    assert.throws(() => loadConfig(path), /Could not read/);
  });

  await t.test('throws when "packageName" is missing', () => {
    const path = writeConfig(dir, { ...baseConfig(), packageName: undefined });
    assert.throws(() => loadConfig(path), /"packageName" is required/);
  });

  await t.test('throws when "locales" is missing or empty', () => {
    const path = writeConfig(dir, baseConfig({ locales: [] }));
    assert.throws(() => loadConfig(path), /"locales" must be a non-empty array/);
  });

  await t.test('throws when "screenshots.phone" is not an array', () => {
    const path = writeConfig(dir, baseConfig({ screenshots: {} }));
    assert.throws(() => loadConfig(path), /"screenshots.phone" must be an array/);
  });
});

function localesConfig(locales) {
  // resolveLocales joins against config.screenshotRoot, which loadConfig
  // normally sets; tests that build the config by hand must supply it too.
  return { locales, screenshotRoot: "/fake/screenshots" };
}

test("resolveLocales", async (t) => {
  await t.test("resolves plain locales without aliasing", () => {
    const config = localesConfig([{ play: "en-US", app: "en" }]);
    const [resolved] = resolveLocales(config);
    assert.equal(resolved.play, "en-US");
    assert.equal(resolved.app, "en");
    assert.equal(resolved.aliasOf, null);
  });

  await t.test("aliasOf borrows the source locale's app/screenshotDir", () => {
    const config = localesConfig([
      { play: "es-ES", app: "es" },
      { play: "es-419", aliasOf: "es-ES" },
    ]);
    const resolved = resolveLocales(config);
    const alias = resolved.find((l) => l.play === "es-419");
    assert.equal(alias.app, "es");
    assert.equal(alias.aliasOf, "es-ES");
  });

  await t.test("aliasing an unknown locale throws", () => {
    const config = localesConfig([{ play: "es-419", aliasOf: "es-ES" }]);
    assert.throws(() => resolveLocales(config), /aliases unknown locale "es-ES"/);
  });

  await t.test("aliasing an alias (chained alias) throws", () => {
    const config = localesConfig([
      { play: "es-ES", app: "es" },
      { play: "es-419", aliasOf: "es-ES" },
      { play: "es-MX", aliasOf: "es-419" },
    ]);
    // es-419 itself has aliasOf set, so chaining through it must throw.
    assert.throws(() => resolveLocales(config), /which is itself an alias/);
  });

  await t.test('an entry missing "play" throws', () => {
    const config = localesConfig([{ app: "en" }]);
    assert.throws(() => resolveLocales(config), /needs a "play" code/);
  });

  await t.test("a duplicate play code throws", () => {
    const config = localesConfig([
      { play: "en-US", app: "en" },
      { play: "en-US", app: "en" },
    ]);
    assert.throws(() => resolveLocales(config), /Duplicate Play locale "en-US"/);
  });

  await t.test('an entry missing "app" (and no alias) throws', () => {
    const config = localesConfig([{ play: "en-US" }]);
    assert.throws(() => resolveLocales(config), /needs an "app" locale/);
  });

  await t.test('"only" filters to the requested locales', () => {
    const config = localesConfig([
      { play: "en-US", app: "en" },
      { play: "es-ES", app: "es" },
    ]);
    const resolved = resolveLocales(config, ["es-ES"]);
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].play, "es-ES");
  });

  await t.test('"only" with an unknown code throws', () => {
    const config = localesConfig([{ play: "en-US", app: "en" }]);
    assert.throws(() => resolveLocales(config, ["fr-FR"]), /Unknown locale\(s\): fr-FR/);
  });
});
