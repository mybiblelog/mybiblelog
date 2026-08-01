#!/usr/bin/env node
// Build-time gate for the env vars the app cannot start without.
//
// The failure this exists to prevent: EXPO_PUBLIC_* values live in EAS
// environments (or a local .env), never in git. A build whose environment is
// missing one still compiles perfectly — the value is just inlined as
// `undefined` — and then `src/config.ts` throws at module scope on launch, so
// the app dies before the first frame with no JS error surfaced (logcat only
// shows "WINDOW DIED" / "Channel is unrecoverably broken"). The artifact is
// useless and the cause is invisible. This script moves that failure to before
// anything expensive runs.
//
// Modes:
//   --profile <name>  Resolve the EAS environment the given eas.json build
//                     profile will use, then re-run this script inside it via
//                     `eas env:exec`. Runs on the dev machine in seconds,
//                     before `eas build` uploads anything.
//   --assert          Validate whatever is already in process.env. Used by the
//                     `eas-build-pre-install` hook, which the EAS builder runs
//                     before installing dependencies — the earliest server-side
//                     point at which the job env exists.
//
// Dependency-free on purpose: --assert runs before `npm install` on the builder.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(scriptPath));

const requiredEnvVars = Object.values(
  JSON.parse(readFileSync(join(projectRoot, "env-requirements.json"), "utf8")).required
);

/**
 * Mirrors the environment eas-cli resolves for a build profile when the profile
 * has no explicit `environment` field: store distribution -> production, a dev
 * client -> development, anything else -> preview. Declaring `environment` in
 * eas.json makes this moot, which is why we do — this is the fallback so the
 * check can't silently disagree with the build.
 */
function resolveEnvironment(profileName, easJson) {
  const seen = new Set();
  let profile = {};
  let name = profileName;

  while (name) {
    if (seen.has(name)) throw new Error(`Circular "extends" in eas.json build profile "${name}".`);
    seen.add(name);
    const current = easJson.build?.[name];
    if (!current) throw new Error(`No build profile "${name}" in eas.json.`);
    profile = { ...current, ...profile };
    name = current.extends;
  }

  if (profile.environment) return profile.environment;
  if ((profile.distribution ?? "store") === "store") return "production";
  return profile.developmentClient ? "development" : "preview";
}

function assertEnv() {
  const missing = requiredEnvVars.filter((name) => !process.env[name]?.trim());
  if (missing.length === 0) {
    console.log(`✓ Build env OK: ${requiredEnvVars.join(", ")}`);
    return;
  }

  console.error(
    [
      "",
      `✗ Missing required build env: ${missing.join(", ")}`,
      "",
      "  A build without these compiles fine and then crashes on launch, so it is",
      "  failing here instead. Set them where this build reads its env:",
      "",
      `    eas env:create --environment <development|preview|production> --name ${missing[0]} --value <value> --visibility plaintext`,
      "",
      "  For a local build, set them in mobile/.env (see .env.example).",
      "",
    ].join("\n")
  );
  process.exit(1);
}

function checkProfile(profileName) {
  const easJson = JSON.parse(readFileSync(join(projectRoot, "eas.json"), "utf8"));
  const environment = resolveEnvironment(profileName, easJson);

  console.log(`Checking build env for profile "${profileName}" (EAS environment: ${environment})…`);

  // `eas env:exec` injects that environment's variables, so this validates the
  // values the build will actually get — not the local .env, which is exactly
  // the gap that lets a broken build through.
  const result = spawnSync(
    "eas",
    ["env:exec", environment, `node ${JSON.stringify(scriptPath)} --assert`, "--non-interactive"],
    { cwd: projectRoot, stdio: "inherit" }
  );

  if (result.error?.code === "ENOENT") {
    console.error("✗ eas-cli not found on PATH. Install it: npm i -g eas-cli");
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

const args = process.argv.slice(2);
if (args.includes("--assert")) {
  assertEnv();
} else {
  const profile = args[args.indexOf("--profile") + 1];
  if (!args.includes("--profile") || !profile) {
    console.error("Usage: node scripts/check-build-env.mjs --profile <name> | --assert");
    process.exit(1);
  }
  checkProfile(profile);
}
