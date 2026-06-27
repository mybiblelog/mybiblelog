/**
 * Minimal semantic-version helpers used by the mobile-app support endpoint.
 *
 * Only the `major.minor.patch` core is supported — enough for the app version
 * checks — so the project carries no extra dependency. Prerelease/build
 * suffixes are intentionally rejected (the mobile client always reports a plain
 * `X.Y.Z`).
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a `major.minor.patch` version string. Returns the parsed parts, or
 * `null` when the value is not a strict three-segment numeric version (the
 * caller treats an unparseable version as a validation error).
 */
export function parseSemver(version: string): ParsedSemver | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) {
    return null;
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

/**
 * True when `a` is a strictly lower version than `b`, comparing major, then
 * minor, then patch. Invalid inputs are treated as "not less than" (the caller
 * validates the version separately, so this avoids throwing on malformed
 * config).
 */
export function isSemverLessThan(a: string, b: string): boolean {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    return false;
  }
  if (pa.major !== pb.major) {
    return pa.major < pb.major;
  }
  if (pa.minor !== pb.minor) {
    return pa.minor < pb.minor;
  }
  return pa.patch < pb.patch;
}
