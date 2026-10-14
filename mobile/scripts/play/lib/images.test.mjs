import { test } from "node:test";
import assert from "node:assert/strict";

import { padTarget, MAX_RATIO } from "./images.mjs";

test("padTarget", async (t) => {
  await t.test("already at the 2:1 limit returns null (compliant)", () => {
    assert.equal(padTarget({ width: 1080, height: 2160 }), null);
  });

  await t.test("well within the ratio returns null (compliant)", () => {
    assert.equal(padTarget({ width: 1080, height: 1920 }), null);
  });

  await t.test("too wide (width is the long side) grows height, keeps width", () => {
    const target = padTarget({ width: 2400, height: 1080 });
    assert.deepEqual(target, { width: 2400, height: Math.ceil(2400 / MAX_RATIO) });
  });

  await t.test("too tall (height is the long side) grows width, keeps height", () => {
    const target = padTarget({ width: 1080, height: 2400 });
    assert.deepEqual(target, { width: Math.ceil(2400 / MAX_RATIO), height: 2400 });
  });
});
