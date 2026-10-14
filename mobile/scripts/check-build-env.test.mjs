import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveEnvironment } from "./check-build-env.mjs";

test("resolveEnvironment", async (t) => {
  await t.test("explicit environment on the profile wins over any defaulting", () => {
    const easJson = {
      build: {
        production: { distribution: "store", environment: "staging" },
      },
    };
    assert.equal(resolveEnvironment("production", easJson), "staging");
  });

  await t.test("extends chain merges with the nearer profile winning", () => {
    // base sets environment; child does not override it, so base's value is kept.
    const easJson = {
      build: {
        base: { environment: "development", distribution: "internal" },
        child: { extends: "base", developmentClient: true },
      },
    };
    assert.equal(resolveEnvironment("child", easJson), "development");
  });

  await t.test("extends chain: nearer profile's own field overrides the base's", () => {
    const easJson = {
      build: {
        base: { environment: "development" },
        child: { extends: "base", environment: "preview" },
      },
    };
    assert.equal(resolveEnvironment("child", easJson), "preview");
  });

  await t.test("circular extends throws", () => {
    const easJson = {
      build: {
        a: { extends: "b" },
        b: { extends: "a" },
      },
    };
    assert.throws(() => resolveEnvironment("a", easJson), /Circular "extends"/);
  });

  await t.test("unknown profile name throws", () => {
    const easJson = { build: { production: {} } };
    assert.throws(() => resolveEnvironment("missing", easJson), /No build profile "missing"/);
  });

  await t.test("default distribution (unset) defaults to store, which resolves to production", () => {
    const easJson = { build: { production: {} } };
    assert.equal(resolveEnvironment("production", easJson), "production");
  });

  await t.test('explicit distribution "store" resolves to production', () => {
    const easJson = { build: { production: { distribution: "store" } } };
    assert.equal(resolveEnvironment("production", easJson), "production");
  });

  await t.test("non-store distribution + developmentClient true resolves to development", () => {
    const easJson = {
      build: { development: { distribution: "internal", developmentClient: true } },
    };
    assert.equal(resolveEnvironment("development", easJson), "development");
  });

  await t.test("non-store distribution + developmentClient false resolves to preview", () => {
    const easJson = {
      build: { preview: { distribution: "internal", developmentClient: false } },
    };
    assert.equal(resolveEnvironment("preview", easJson), "preview");
  });

  await t.test("non-store distribution + developmentClient unset resolves to preview", () => {
    const easJson = { build: { preview: { distribution: "internal" } } };
    assert.equal(resolveEnvironment("preview", easJson), "preview");
  });
});
