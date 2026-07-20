#!/usr/bin/env node
/**
 * Runs the Maestro e2e flows against a local Android emulator.
 *
 * Steps:
 *   1. Verifies an adb device is connected and bridges port 8080 so the app
 *      (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080) reaches the local API.
 *   2. Seeds a throwaway user via scripts/e2e/seed.mjs.
 *   3. Runs `maestro test` with the credentials passed as flow env vars.
 *
 * Usage:
 *   node scripts/e2e/run.mjs                        # all flows
 *   node scripts/e2e/run.mjs .maestro/flows/01-login.yaml
 *   node scripts/e2e/run.mjs --include-tags smoke
 *   node scripts/e2e/run.mjs --scenario empty .maestro/flows/02-add-entry.yaml
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(mobileDir, "..");

// The email-code flows (07–09) recover one-time codes from the API test seam via
// a Maestro runScript, so they need the API URL + bypass secret. Load them from
// the repo-root .env (process env wins) and pass them through to Maestro.
function loadRootEnv() {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) return {};
  const parsed = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) parsed[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return parsed;
}
const rootEnv = loadRootEnv();
const apiUrl = process.env.TEST_API_URL ?? rootEnv.TEST_API_URL ?? "http://localhost:8080";
const bypassSecret = process.env.TEST_BYPASS_SECRET ?? rootEnv.TEST_BYPASS_SECRET ?? "";

const args = process.argv.slice(2);
let scenario = "standard";
const maestroArgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--scenario") {
    scenario = args[++i];
  } else if (args[i] === "--include-tags") {
    maestroArgs.push("--include-tags", args[++i]);
  } else {
    maestroArgs.push(args[i]);
  }
}
const hasFlowPath = maestroArgs.some((a) => !a.startsWith("-") && a.includes(".maestro"));
if (!hasFlowPath) maestroArgs.push(".maestro");

function run(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: "utf8", ...opts });
}

// 1. Device + port bridge.
let devices;
try {
  devices = run("adb", ["devices"]);
} catch {
  console.error("adb not found — install Android platform-tools and start an emulator.");
  process.exit(1);
}
if (!devices.split("\n").some((line) => /\tdevice$/.test(line.trim().replace(/\s+/, "\t")))) {
  console.error("No adb device connected. Start an Android emulator with the dev build installed.");
  process.exit(1);
}
run("adb", ["reverse", "tcp:8080", "tcp:8080"]);
// Dev-client flows load the JS bundle from localhost:8081 via deep link.
run("adb", ["reverse", "tcp:8081", "tcp:8081"]);

// Kill emulator animations: every screen transition returns instantly and
// `waitForAnimationToEnd` becomes a no-op. Cheap, universal speedup.
for (const scale of [
  "window_animation_scale",
  "transition_animation_scale",
  "animator_duration_scale",
]) {
  run("adb", ["shell", "settings", "put", "global", scale, "0"]);
}

// 2. Seed.
const seedOutput = run(process.execPath, [path.join(mobileDir, "scripts/e2e/seed.mjs"), scenario]);
const user = JSON.parse(seedOutput);
console.log(`Seeded ${user.scenario} user ${user.email}`);

// 3. Maestro.
const result = spawnSync(
  "maestro",
  [
    "test",
    ...maestroArgs,
    "-e",
    `E2E_EMAIL=${user.email}`,
    "-e",
    `E2E_PASSWORD=${user.password}`,
    "-e",
    `E2E_API_URL=${apiUrl}`,
    "-e",
    `E2E_BYPASS_SECRET=${bypassSecret}`,
  ],
  { cwd: mobileDir, stdio: "inherit" }
);
if (result.error) {
  console.error("maestro not found — install it: https://maestro.mobile.dev");
  process.exit(1);
}
process.exit(result.status ?? 1);
