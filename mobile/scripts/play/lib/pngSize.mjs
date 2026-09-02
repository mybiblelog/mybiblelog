// Minimal PNG dimension probe.
//
// The validator runs in CI and must not need sharp (a repo-root dependency that
// the mobile package deliberately does not declare), and a PNG's width/height
// are the two integers right after the signature — cheaper to read than to
// install an image library for.

import { openSync, readSync, closeSync } from "node:fs";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function pngSize(path) {
  const header = Buffer.alloc(24);
  const fd = openSync(path, "r");
  let read = 0;
  try {
    read = readSync(fd, header, 0, 24, 0);
  } finally {
    closeSync(fd);
  }

  if (read < 24 || !header.subarray(0, 8).equals(SIGNATURE) || header.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${path} is not a PNG file.`);
  }

  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}
