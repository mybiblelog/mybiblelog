import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { pngSize } from "./pngSize.mjs";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Builds the 24-byte header pngSize actually reads (signature + IHDR + dims). */
function fakePngHeader(width, height) {
  const header = Buffer.alloc(24);
  SIGNATURE.copy(header, 0);
  header.writeUInt32BE(13, 8); // IHDR chunk length (unused by pngSize, but realistic)
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return header;
}

test("pngSize", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "pngsize-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  await t.test("reads width/height from a valid PNG header", () => {
    const path = join(dir, "valid.png");
    writeFileSync(path, fakePngHeader(1080, 1920));
    assert.deepEqual(pngSize(path), { width: 1080, height: 1920 });
  });

  await t.test("throws on a non-PNG file", () => {
    const path = join(dir, "not-a-png.txt");
    writeFileSync(path, "this is definitely not a png\n".repeat(3));
    assert.throws(() => pngSize(path), /is not a PNG file/);
  });

  await t.test("throws on a truncated file (fewer than 24 bytes)", () => {
    const path = join(dir, "truncated.png");
    writeFileSync(path, SIGNATURE); // only 8 bytes
    assert.throws(() => pngSize(path), /is not a PNG file/);
  });
});
