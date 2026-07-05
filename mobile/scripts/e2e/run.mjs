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
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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

// 2. Seed.
const seedOutput = run(process.execPath, [path.join(mobileDir, "scripts/e2e/seed.mjs"), scenario]);
const user = JSON.parse(seedOutput);
console.log(`Seeded ${user.scenario} user ${user.email}`);

// 3. Maestro.
const result = spawnSync(
  "maestro",
  ["test", ...maestroArgs, "-e", `E2E_EMAIL=${user.email}`, "-e", `E2E_PASSWORD=${user.password}`],
  { cwd: mobileDir, stdio: "inherit" }
);
if (result.error) {
  console.error("maestro not found — install it: https://maestro.mobile.dev");
  process.exit(1);
}
process.exit(result.status ?? 1);
