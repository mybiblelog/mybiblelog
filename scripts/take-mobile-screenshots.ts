/**
 * Play Store screenshot generator (mobile / Android).
 *
 * The mobile counterpart of `take-web-screenshots.ts`. Seeds the same demo dataset
 * (shared `./lib/screenshot-seed`), then drives a dev-client Android app through
 * the Maestro flow `.maestro/screenshots/capture.yaml` once per locale, saving
 * PNGs (Play Store requires PNG/JPEG) to `mobile/screenshots/<locale>/`.
 *
 * Prerequisites:
 *  1. Android emulator running with a dev-client build installed:
 *       cd mobile && npx expo run:android --device
 *  2. Metro running (started by the command above, or `npx expo start`
 *     separately) and `npm run dev` running at the repo root (API on :8080,
 *     web on :3000). The mobile app's own EXPO_PUBLIC_API_BASE_URL
 *     (mobile/.env) points at :3000 — the web dev server's /api proxy, not
 *     the API port directly — so both need to be up. `adb reverse` bridges
 *     the emulator's localhost:8080/:3000/:8081 (API/web/Metro) to the host.
 *  3. `maestro` CLI installed (https://maestro.mobile.dev).
 *  4. SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD in .env (or the demo defaults).
 *
 * The floating dev-menu "Tools" button and its Performance Monitor overlay
 * (FPS/dropped frames/stutters) would otherwise appear in every screenshot;
 * see `hideDevOverlays` below for how both are suppressed — the Tools button
 * via its own SharedPreferences pref, the performance monitor by revoking the
 * "draw over other apps" permission its overlay requires.
 *
 * Usage:
 *   npm run screenshots:mobile
 */

/* eslint-disable no-console */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  LOCALES,
  SCREENSHOT_EMAIL,
  SCREENSHOT_PASSWORD,
  resetLocaleData,
  seedLocaleContent,
  setupUser,
  teardownUser,
} from './lib/screenshot-seed';

const mobileDir = path.resolve(__dirname, '../mobile');
const captureFlow = '.maestro/screenshots/capture.yaml';
const API_URL = 'http://localhost:8080';
// The mobile app's own EXPO_PUBLIC_API_BASE_URL (mobile/.env) points here —
// the web dev server's /api proxy — not at API_URL directly.
const WEB_URL = 'http://localhost:3000';
const ANDROID_PACKAGE = 'com.mybiblelog.app';
const DEV_MENU_PREFS_FILE = 'shared_prefs/expo.modules.devmenu.sharedpreferences.xml';
// Android's `PreferenceManager.getDefaultSharedPreferences()` file — this is
// where React Native's own legacy dev settings (including the FPS/perf
// overlay) live, distinct from expo-dev-menu's own prefs file above.
const DEFAULT_PREFS_FILE = `shared_prefs/${ANDROID_PACKAGE}_preferences.xml`;

const ANIMATION_SCALES = [
  'window_animation_scale',
  'transition_animation_scale',
  'animator_duration_scale',
];

function adb(args: string[], opts: { allowFail?: boolean; input?: string } = {}): string {
  try {
    return execFileSync('adb', args, { encoding: 'utf8', input: opts.input });
  }
  catch (error) {
    if (opts.allowFail) return '';
    throw error;
  }
}

/** Fire a SystemUI demo-mode command (clean status bar for the screenshots). */
function demo(command: string, extras: string[] = []): void {
  adb(
    ['shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', command, ...extras],
    { allowFail: true },
  );
}

/** Write a single-boolean Android SharedPreferences XML file via `run-as`. */
function writeBooleanPref(relativeFile: string, key: string, value: boolean): void {
  const prefsXml =
    '<?xml version=\'1.0\' encoding=\'utf-8\' standalone=\'yes\' ?>\n' +
    '<map>\n' +
    `    <boolean name="${key}" value="${value}" />\n` +
    '</map>\n';
  // `adb shell` rejoins its argv with plain spaces before handing the result
  // to the device's shell (it doesn't preserve argv boundaries the way
  // execFileSync does locally) — so a multi-word `sh -c` script passed as its
  // own array element loses its quoting in transit and gets split back into
  // separate words (`sh -c mkdir` with `-p shared_prefs && cat > ...` as
  // trailing, ignored argv). Wrapping the script in its own single quotes
  // inside one combined string survives that rejoin.
  adb(
    ['shell', `run-as ${ANDROID_PACKAGE} sh -c 'mkdir -p shared_prefs && cat > ${relativeFile}'`],
    { allowFail: true, input: prefsXml },
  );
}

/** Read an appops mode for the package (e.g. "allow", "ignore", "deny", "default"). */
function getAppOpMode(op: string): string {
  const out = adb(['shell', 'appops', 'get', ANDROID_PACKAGE, op], { allowFail: true });
  // Output looks like "SYSTEM_ALERT_WINDOW: allow; time=...". Extract just the mode.
  return out.match(/:\s*(\w+)/)?.[1] ?? 'allow';
}

function setAppOpMode(op: string, mode: string): void {
  adb(['shell', 'appops', 'set', ANDROID_PACKAGE, op, mode], { allowFail: true });
}

let originalOverlayOpMode: string | null = null;

/**
 * Suppress every dev-client overlay that would otherwise show up in a
 * screenshot: the floating "Tools" button (expo-dev-menu's `showFab` pref)
 * and the FPS/dropped-frames/stutter performance monitor.
 *
 * The Tools button is a plain in-app view gated by expo-dev-menu's `showFab`
 * pref, so setting that pref (no reliable JS API on the pinned package
 * versions) is enough — set directly as the native SharedPreferences boolean
 * its own native toggle writes.
 *
 * The performance monitor is different: both React Native's legacy FPS
 * overlay and expo-dev-menu's "Toggle performance monitor" action render it
 * as a real Android system overlay (`WindowManager.addView` with
 * `TYPE_SYSTEM_OVERLAY`), gated by the "draw over other apps"
 * (`SYSTEM_ALERT_WINDOW`) permission — see `DebugOverlayController.kt`'s
 * `permissionCheck`. If the developer ever granted that permission while
 * toggling the monitor on for real debugging, the underlying `fps_debug` pref
 * can be left `true` on-device and toggling it back off here isn't reliable
 * (SharedPreferences written via `run-as` from outside the app process can
 * race the app's own cached read). Revoking the permission itself via
 * `appops` is a stronger guarantee: without it, `permissionCheck` fails and
 * the overlay can't be constructed at all regardless of the pref value. The
 * `fps_debug` write below is kept as a courtesy — it keeps the dev-menu UI's
 * own toggle state in sync — but the appops revoke is what actually hides it.
 *
 * Must run while the app isn't running (force-stopped first): the pref/
 * permission are read once at launch, so an already-running process wouldn't
 * see the change until relaunched anyway.
 */
function hideDevOverlays(): void {
  adb(['shell', 'am', 'force-stop', ANDROID_PACKAGE], { allowFail: true });
  writeBooleanPref(DEV_MENU_PREFS_FILE, 'showFab', false);
  writeBooleanPref(DEFAULT_PREFS_FILE, 'fps_debug', false);
  originalOverlayOpMode = getAppOpMode('SYSTEM_ALERT_WINDOW');
  setAppOpMode('SYSTEM_ALERT_WINDOW', 'ignore');
}

/** Restore whatever "draw over other apps" permission state predated the run. */
function restoreDevOverlayPermission(): void {
  if (originalOverlayOpMode) {
    setAppOpMode('SYSTEM_ALERT_WINDOW', originalOverlayOpMode);
  }
}

async function preflight(): Promise<void> {
  // 1. An adb device must be connected.
  let devices: string;
  try {
    devices = execFileSync('adb', ['devices'], { encoding: 'utf8' });
  }
  catch {
    throw new Error('adb not found — install Android platform-tools and start an emulator.');
  }
  const hasDevice = devices
    .split('\n')
    .slice(1)
    .some(line => /\tdevice$/.test(line.trim().replace(/\s+/, '\t')));
  if (!hasDevice) {
    throw new Error(
      'No adb device connected. Start an Android emulator with the dev-client build installed:\n' +
        '  cd mobile && npx expo run:android --device',
    );
  }

  // 2. Maestro must be installed.
  try {
    execFileSync('maestro', ['--version'], { encoding: 'utf8', stdio: 'pipe' });
  }
  catch {
    throw new Error('maestro not found — install it: https://maestro.mobile.dev');
  }

  // 3. The API and web dev server must both be reachable (any HTTP response
  // counts; only a connection failure means it's down). The mobile app talks
  // to the web server's :3000 /api proxy, not :8080 directly — both need to
  // be up, which `npm run dev` (dev:api + dev:web) does together.
  async function checkReachable(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      await fetch(url, { signal: controller.signal }).catch((err) => {
        // A response with any status resolves; abort/refused rejects.
        if (err?.name === 'AbortError') return;
        throw err;
      });
      clearTimeout(timer);
      return true;
    }
    catch {
      return false;
    }
  }

  if (!(await checkReachable(API_URL))) {
    throw new Error(`API not reachable at ${API_URL} — start it with \`npm run dev\`.`);
  }
  if (!(await checkReachable(WEB_URL))) {
    throw new Error(`Web dev server not reachable at ${WEB_URL} — start it with \`npm run dev\`.`);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting mobile screenshot generation');
  console.log(`   Account:  ${SCREENSHOT_EMAIL}`);
  console.log(`   Locales:  ${LOCALES.join(', ')}`);

  await preflight();

  // Bridge every port the app/orchestrator need so the emulator's localhost
  // reaches the host: :8080 for the orchestrator's own seeding calls below,
  // :3000 because the mobile app's own EXPO_PUBLIC_API_BASE_URL (mobile/.env)
  // points at the web dev server's /api proxy, not the API port directly, and
  // :8081 for Metro (the dev-client loads its JS bundle from it). Matches
  // mobile/CLAUDE.md's documented dev-client bridge setup.
  adb(['reverse', 'tcp:8080', 'tcp:8080']);
  adb(['reverse', 'tcp:3000', 'tcp:3000']);
  adb(['reverse', 'tcp:8081', 'tcp:8081']);

  // Kill emulator animations (matches scripts/e2e/run.mjs); Reanimated ignores
  // this, which is why the capture flow still waits out the achievement stamp.
  for (const scale of ANIMATION_SCALES) {
    adb(['shell', 'settings', 'put', 'global', scale, '0']);
  }

  // Turn off stylus handwriting (matches scripts/e2e/run.mjs): the emulator's
  // stylus-capable pointer makes Gboard open in handwriting mode, whose one-time
  // onboarding dialog covers the screen and hides the app from Maestro.
  adb(['shell', 'settings', 'put', 'secure', 'stylus_handwriting_enabled', '0']);

  // Clean status bar via SystemUI demo mode: fixed 09:00 clock, full battery
  // (unplugged), full wifi, no mobile signal, no notification icons.
  adb(['shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1']);
  demo('enter');
  demo('clock', ['-e', 'hhmm', '0900']);
  demo('battery', ['-e', 'level', '100', '-e', 'plugged', 'false']);
  demo('network', ['-e', 'wifi', 'show', '-e', 'level', '4']);
  demo('network', ['-e', 'mobile', 'hide']);
  demo('notifications', ['-e', 'visible', 'false']);

  hideDevOverlays();

  await setupUser();

  try {
    for (const locale of LOCALES) {
      console.log(`\n📸 Locale: ${locale}`);
      await resetLocaleData();
      await seedLocaleContent(locale);

      const outDir = path.resolve(mobileDir, 'screenshots', locale);
      fs.mkdirSync(outDir, { recursive: true });

      const result = spawnSync(
        'maestro',
        [
          'test',
          captureFlow,
          '-e', `LOCALE=${locale}`,
          '-e', `OUTPUT_DIR=${outDir}`,
          '-e', `E2E_EMAIL=${SCREENSHOT_EMAIL}`,
          '-e', `E2E_PASSWORD=${SCREENSHOT_PASSWORD}`,
        ],
        { cwd: mobileDir, stdio: 'inherit' },
      );
      if (result.status !== 0) {
        throw new Error(`Maestro capture failed for locale "${locale}" (exit ${result.status}).`);
      }
      console.log(`  ✓ ${outDir}`);
    }
  }
  finally {
    await teardownUser();
    // Restore the status bar, animations, and overlay permission regardless of outcome.
    demo('exit');
    restoreDevOverlayPermission();
    for (const scale of ANIMATION_SCALES) {
      adb(['shell', 'settings', 'put', 'global', scale, '1'], { allowFail: true });
    }
  }

  console.log('\n✅ Done. Screenshots saved to mobile/screenshots/{locale}/');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
