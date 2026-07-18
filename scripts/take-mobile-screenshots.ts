/**
 * Play Store screenshot generator (mobile / Android).
 *
 * The mobile counterpart of `take-screenshots.ts`. Seeds the same demo dataset
 * (shared `./lib/screenshot-seed`), then drives the release-build Android app
 * through the Maestro flow `.maestro/screenshots/capture.yaml` once per locale,
 * saving PNGs (Play Store requires PNG/JPEG) to `mobile/screenshots/<locale>/`.
 *
 * Prerequisites:
 *  1. Android emulator running with a RELEASE build installed:
 *       cd mobile
 *       EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 \
 *         npx expo run:android --variant release
 *     A dev-client build would put the floating dev-menu button in every
 *     screenshot and needs Metro running — use the release variant.
 *  2. `npm run dev` running at the repo root (API on :8080). `adb reverse`
 *     bridges the emulator's localhost:8080 to the host so the app reaches it.
 *  3. `maestro` CLI installed (https://maestro.mobile.dev).
 *  4. SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD in .env (or the demo defaults).
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

const ANIMATION_SCALES = [
  'window_animation_scale',
  'transition_animation_scale',
  'animator_duration_scale',
];

function adb(args: string[], opts: { allowFail?: boolean } = {}): string {
  try {
    return execFileSync('adb', args, { encoding: 'utf8' });
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
      'No adb device connected. Start an Android emulator with the RELEASE build installed:\n' +
        '  cd mobile && EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 npx expo run:android --variant release',
    );
  }

  // 2. Maestro must be installed.
  try {
    execFileSync('maestro', ['--version'], { encoding: 'utf8', stdio: 'pipe' });
  }
  catch {
    throw new Error('maestro not found — install it: https://maestro.mobile.dev');
  }

  // 3. The API must be reachable on :8080 (any HTTP response counts; only a
  // connection failure means it's down).
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    await fetch(API_URL, { signal: controller.signal }).catch((err) => {
      // A response with any status resolves; abort/refused rejects.
      if (err?.name === 'AbortError') return;
      throw err;
    });
    clearTimeout(timer);
  }
  catch {
    throw new Error(`API not reachable at ${API_URL} — start it with \`npm run dev\`.`);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting mobile screenshot generation');
  console.log(`   Account:  ${SCREENSHOT_EMAIL}`);
  console.log(`   Locales:  ${LOCALES.join(', ')}`);

  await preflight();

  // Bridge the API port so the emulator's localhost:8080 reaches the host.
  adb(['reverse', 'tcp:8080', 'tcp:8080']);

  // Kill emulator animations (matches scripts/e2e/run.mjs); Reanimated ignores
  // this, which is why the capture flow still waits out the achievement stamp.
  for (const scale of ANIMATION_SCALES) {
    adb(['shell', 'settings', 'put', 'global', scale, '0']);
  }

  // Clean status bar via SystemUI demo mode: fixed 09:00 clock, full battery
  // (unplugged), full wifi, no mobile signal, no notification icons.
  adb(['shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1']);
  demo('enter');
  demo('clock', ['-e', 'hhmm', '0900']);
  demo('battery', ['-e', 'level', '100', '-e', 'plugged', 'false']);
  demo('network', ['-e', 'wifi', 'show', '-e', 'level', '4']);
  demo('network', ['-e', 'mobile', 'hide']);
  demo('notifications', ['-e', 'visible', 'false']);

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
    // Restore the status bar and animations regardless of outcome.
    demo('exit');
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
