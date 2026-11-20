#!/usr/bin/env node

// Gives this git worktree its own ports and MongoDB database so its dev
// servers can run alongside the main checkout's (and other worktrees') without
// colliding. Slot N shifts every port by N*100 (Metro by N) and points the API
// at `<db>_wt<N>`.
//
//   npm run worktree:env -- 2    # assign slot 2 to this worktree
//   npm run worktree:env -- 0    # remove the overrides (back to defaults)
//   npm run worktree:env         # show this worktree's current slot
//
// It appends a marked block to this worktree's own `.env` and `mobile/.env`
// (copies made via `.worktreeinclude`). dotenv lets a later duplicate key
// override an earlier one, so the block wins over the copied values without
// touching them, and slot 0 removes only the block.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BEGIN = '# >>> worktree-env (managed by scripts/worktree-env.mjs; do not edit) >>>';
const END = '# <<< worktree-env <<<';
const BLOCK_RE = new RegExp(`\\n*${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}\\n?`, 'g');

const DEFAULT_API_PORT = 8080;
const DEFAULT_WEB_PORT = 3000;
const DEFAULT_METRO_PORT = 8081;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function fail(message) {
  console.error(`worktree-env: ${message}`);
  process.exit(1);
}

function readEnvFile(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

function stripBlock(text) {
  return text.replace(BLOCK_RE, '\n').replace(/\n+$/, '\n');
}

// Last-wins lookup, matching dotenv's handling of duplicate keys.
function getVar(text, key) {
  let value;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=\\s*(.*)$`));
    if (m) {
      value = m[1].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return value;
}

function currentSlot(text) {
  const m = text?.match(new RegExp(`${escapeRe(BEGIN)}\\n# slot (\\d+)`));
  return m ? Number(m[1]) : 0;
}

// Points the connection string at `<base>_wt<slot>`. Pins `authSource` to
// whatever the original URI authenticated against, because adding a database
// path would otherwise change it (the docker-compose root user lives in
// `admin`, the implicit authSource of a path-less URI). `+srv` URIs are left
// alone: their authSource comes from the DNS TXT record, not the path.
function worktreeMongoUri(uri, slot) {
  const m = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/);
  if (!m) {
    fail(`can't parse MONGODB_URI; set it by hand in this worktree's .env`);
  }
  const [, scheme, authority, dbPath, query] = m;
  const baseDb = dbPath || 'test'; // the driver's default when the URI names none
  const params = new URLSearchParams(query || '');
  if (scheme === 'mongodb://' && authority.includes('@') && !params.has('authSource')) {
    params.set('authSource', dbPath || 'admin');
  }
  const qs = params.toString();
  return `${scheme}${authority}/${baseDb}_wt${slot}${qs ? `?${qs}` : ''}`;
}

function withPort(url, port) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
      return null; // not a local dev URL; leave it alone
    }
    u.port = String(port);
    return u.toString().replace(/\/$/, url.endsWith('/') ? '/' : '');
  }
  catch {
    return null;
  }
}

function writeBlock(file, original, lines) {
  const base = stripBlock(original);
  const next = lines ? `${base.replace(/\n*$/, '\n')}\n${BEGIN}\n${lines.join('\n')}\n${END}\n` : base;
  if (next !== original) {
    writeFileSync(file, next);
  }
}

// --- main -----------------------------------------------------------------

const root = git('rev-parse', '--show-toplevel');
const isLinkedWorktree = path.resolve(root, git('rev-parse', '--git-dir'))
  !== path.resolve(root, git('rev-parse', '--git-common-dir'));

const rootEnvFile = path.join(root, '.env');
const mobileEnvFile = path.join(root, 'mobile', '.env');
const rootEnv = readEnvFile(rootEnvFile);
const mobileEnv = readEnvFile(mobileEnvFile);

const arg = process.argv[2];
if (arg === undefined) {
  const slot = currentSlot(rootEnv);
  console.log(slot
    ? `Slot ${slot}: web http://localhost:${DEFAULT_WEB_PORT + slot * 100}, `
      + `API http://localhost:${DEFAULT_API_PORT + slot * 100}, Metro ${DEFAULT_METRO_PORT + slot}`
    : 'No worktree slot assigned (default ports). Usage: npm run worktree:env -- <slot 1-9 | 0 to reset>');
  process.exit(0);
}

const slot = Number(arg);
if (!Number.isInteger(slot) || slot < 0 || slot > 9) {
  fail('slot must be an integer from 0 (reset) to 9');
}
if (slot > 0 && !isLinkedWorktree) {
  fail('this is the main checkout, which keeps the default ports. Run this inside a linked worktree.');
}
if (rootEnv === null) {
  fail(`no .env at ${rootEnvFile}. Copy it from the main checkout (Claude Code does this via .worktreeinclude).`);
}

if (slot === 0) {
  writeBlock(rootEnvFile, rootEnv, null);
  if (mobileEnv !== null) {
    writeBlock(mobileEnvFile, mobileEnv, null);
  }
  console.log('Removed worktree overrides; this worktree is back on the default ports and database.');
  process.exit(0);
}

const baseEnv = stripBlock(rootEnv);
const apiPort = DEFAULT_API_PORT + slot * 100;
const webPort = DEFAULT_WEB_PORT + slot * 100;
const metroPort = DEFAULT_METRO_PORT + slot;
const apiUrl = `http://localhost:${apiPort}`;
const siteUrl = `http://localhost:${webPort}`;

const baseMongoUri = getVar(baseEnv, 'MONGODB_URI');
if (!baseMongoUri) {
  fail('MONGODB_URI is not set in .env');
}
const mongoUri = worktreeMongoUri(baseMongoUri, slot);

const rootLines = [
  `# slot ${slot}`,
  `API_PORT=${apiPort}`,
  `API_BASE_URL=${apiUrl}`,
  `NUXT_PORT=${webPort}`,
  `SITE_URL=${siteUrl}`,
  `MONGODB_URI=${mongoUri}`,
  // Without these, Playwright's reuseExistingServer would silently test the
  // main checkout's servers on the default ports.
  `TEST_SITE_URL=${siteUrl}`,
  `TEST_API_URL=${apiUrl}`,
];
const baseRedirect = getVar(baseEnv, 'GOOGLE_REDIRECT');
const redirect = baseRedirect && withPort(baseRedirect, webPort);
if (redirect) {
  rootLines.push(`GOOGLE_REDIRECT=${redirect}`);
}
writeBlock(rootEnvFile, rootEnv, rootLines);

if (mobileEnv !== null) {
  writeBlock(mobileEnvFile, mobileEnv, [
    `# slot ${slot}`,
    `EXPO_PUBLIC_API_BASE_URL=${apiUrl}`,
  ]);
}

const db = mongoUri.match(/\/([^/?]+)(?:\?|$)/)[1];
const notes = [
  `Worktree slot ${slot}:`,
  `  web    ${siteUrl}  (npm run dev:web)`,
  `  API    ${apiUrl}  (npm run dev:api)`,
  `  Metro  port ${metroPort}  (cd mobile && npx expo start --port ${metroPort})`,
  `  Mongo  database "${db}": starts empty, so run \`npm run script:migrate\` (and \`npm run script:seed\` for sample data)`,
];
if (mobileEnv === null) {
  notes.push('  No mobile/.env in this worktree, so the mobile API URL was not set.');
}
if (redirect) {
  notes.push(`  Google sign-in needs ${redirect} registered as a redirect URI in the Google console.`);
}
console.log(notes.join('\n'));
