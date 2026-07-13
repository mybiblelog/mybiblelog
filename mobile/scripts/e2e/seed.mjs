#!/usr/bin/env node
/**
 * Seeds a throwaway test user (and optional data) for Maestro e2e flows.
 *
 * Re-implements the HTTP contract documented in `e2e/helpers/api-client.ts`
 * and `e2e/helpers/seed.ts` (those are Playwright-coupled):
 *   - POST   /api/auth/register     { email, password, locale }   x-test-bypass-secret
 *   - POST   /api/auth/login        { email, password }           x-test-bypass-secret
 *   - PATCH  /api/settings          { settings: {...} }           Bearer token
 *   - POST   /api/log-entries       { date, startVerseId, endVerseId }
 *   - POST   /api/passage-note-tags { label, color, description? }
 *   - POST   /api/passage-notes     { content, passages, tags? }
 *
 * Usage: node scripts/e2e/seed.mjs [empty|standard]
 * Prints { email, password, token, scenario } as JSON on stdout.
 *
 * Reads TEST_API_URL and TEST_BYPASS_SECRET from the repo-root .env
 * (process env takes precedence). Requires Node >= 18 (global fetch).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { Bible } = require("@mybiblelog/shared");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function loadRootEnv() {
  const envPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(envPath)) return {};
  const parsed = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    parsed[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return parsed;
}

const rootEnv = loadRootEnv();
const API_URL = process.env.TEST_API_URL ?? rootEnv.TEST_API_URL ?? "http://localhost:8080";
const BYPASS_SECRET = process.env.TEST_BYPASS_SECRET ?? rootEnv.TEST_BYPASS_SECRET;

if (!BYPASS_SECRET) {
  console.error("TEST_BYPASS_SECRET is not set (repo-root .env or environment).");
  process.exit(1);
}

async function api(method, apiPath, { token, body } = {}) {
  const response = await fetch(new URL(apiPath, API_URL), {
    method,
    headers: {
      "content-type": "application/json",
      "x-test-bypass-secret": BYPASS_SECRET,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} ${apiPath} failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).data;
}

const ymdDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function createUser() {
  const email = `test_user_${crypto.randomBytes(10).toString("hex")}@example.com`;
  const password = crypto.randomBytes(10).toString("hex");
  await api("POST", "/api/auth/register", { body: { email, password, locale: "en" } });
  const { token } = await api("POST", "/api/auth/login", { body: { email, password } });
  return { email, password, token };
}

/**
 * `standard`: look-back window + one Genesis 1 entry yesterday (feeds a
 * "continue" reading suggestion and non-zero Bible progress), one tag, one
 * note. Works for every flow. `empty`: fresh user, no data.
 */
async function seedScenario(scenario, token) {
  if (scenario === "empty") return;

  await api("PATCH", "/api/settings", {
    token,
    body: { settings: { lookBackDate: ymdDaysAgo(30), dailyVerseCountGoal: 86 } },
  });
  await api("POST", "/api/log-entries", {
    token,
    body: {
      date: ymdDaysAgo(1),
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 31),
    },
  });
  const tag = await api("POST", "/api/passage-note-tags", {
    token,
    body: { label: "Prayer", color: "#00aaf9", description: "Seeded tag" },
  });
  await api("POST", "/api/passage-notes", {
    token,
    body: {
      content: "Seeded note on creation",
      passages: [
        { startVerseId: Bible.makeVerseId(1, 1, 1), endVerseId: Bible.makeVerseId(1, 1, 5) },
      ],
      tags: [tag.id],
    },
  });
}

const scenario = process.argv[2] ?? "standard";
if (!["empty", "standard"].includes(scenario)) {
  console.error(`Unknown scenario "${scenario}" (expected: empty | standard)`);
  process.exit(1);
}

const user = await createUser();
await seedScenario(scenario, user.token);
console.log(JSON.stringify({ ...user, scenario }, null, 2));
