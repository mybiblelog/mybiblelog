/**
 * Locale-specific marketing screenshot generator (web).
 *
 * Creates a fresh screenshot user, seeds locale-specific notes and tags for
 * each locale, captures screenshots, then deletes the user. The seed dataset
 * lives in `./lib/screenshot-seed` and is shared with the mobile screenshot
 * script (`take-mobile-screenshots.ts`).
 *
 * Prerequisites:
 *  1. `npm run dev` is running (Nuxt at SITE_URL, API at API_BASE_URL)
 *  2. SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD set in .env (or uses defaults)
 *
 * Usage:
 *   npm run screenshots
 */

/* eslint-disable no-console */
import { chromium, type BrowserContext, type Page } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  LOCALES,
  type Locale,
  SCREENSHOT_EMAIL,
  SCREENSHOT_PASSWORD,
  deleteTodayEntries,
  resetLocaleData,
  seedLocaleContent,
  seedTodayGoalEntries,
  setupUser,
  teardownUser,
} from './lib/screenshot-seed';

// The lib loads .env at its module top (imported above), so process.env is
// populated before this reads SITE_URL.
const BASE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

// Mobile viewport matching existing screenshots (750×1334 logical → physical)
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const MOBILE_SCALE = 2;

// Desktop viewport for sc8-install-anywhere
const DESKTOP_VIEWPORT = { width: 1069, height: 690 };

type Screen = {
  slug: string;
  path: string;
  /** Use desktop viewport instead of mobile for this screen. */
  desktop?: boolean;
  /** Called after navigation + initial wait, before CSS injection. */
  prepare?: (page: Page) => Promise<void>;
  /** Called after the screenshot is saved. */
  cleanup?: () => Promise<void>;
};

// CSS injected into every page to hide chrome that shouldn't appear in screenshots
const HIDE_UI_CSS = `
  /* Hide the feedback button */
  .floating-action-button { display: none !important; }
`;

// --- Per-screen prepare / cleanup functions ---

async function prepareReadingSuggestions(page: Page): Promise<void> {
  // Reading suggestions load async — wait until at least one action button is visible
  await page.waitForSelector(
    '[data-testid="reading-suggestions"] .action-menu-button',
    { timeout: 10000 },
  );
  const firstButton = page
    .locator('[data-testid="reading-suggestions"] .action-menu-button')
    .first();
  await firstButton.click();
  await page.waitForSelector('.action-menu', { timeout: 2000 });
  await page.waitForTimeout(200);
}

async function prepareAchievements(page: Page): Promise<void> {
  // Wait for all 66 book cards to finish rendering (computed async with setImmediate yields)
  await page.waitForFunction(
    () => document.querySelectorAll('.book-card').length >= 66,
    { timeout: 30000 },
  );
  // Jude is book 65 — 0-indexed position 64 in the book list
  const judeCard = page.locator('.book-card').nth(64);
  await judeCard.scrollIntoViewIfNeeded();
  await judeCard.locator('.book-card--chapter-toggle').click();
  await page.waitForSelector('.book-card:nth-child(65) .chapter-card', { timeout: 3000 });
  await judeCard.locator('.chapter-card').first().click();
  // Wait for the achievement modal to appear and the star animation to begin
  await page.waitForSelector('.popup-modal', { timeout: 5000 });
  await page.waitForTimeout(500);
}

async function prepareDailyGoal(page: Page): Promise<void> {
  await seedTodayGoalEntries();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-screenshot="daily-goal"]', { timeout: 5000 });
  await page.waitForTimeout(800);
}

async function prepareChecklist(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('.book-card').length >= 66,
    { timeout: 30000 },
  );
  // Exodus is book 2 — 0-indexed position 1
  const exodusCard = page.locator('.book-card').nth(1);
  await exodusCard.scrollIntoViewIfNeeded();
  await exodusCard.locator('.book-card--chapter-toggle').click();
  await page.waitForSelector('.book-card:nth-child(2) .chapter-card', { timeout: 3000 });
  await page.waitForTimeout(400);
}

// --- Screen list ---

const SCREENS: Screen[] = [
  // Today page — reading suggestions heading + list, with first suggestion's action menu open
  { slug: 'sc1-reading-suggestions', path: '/today', prepare: prepareReadingSuggestions },
  // Checklist page — Jude clicked to trigger achievement modal
  { slug: 'sc2-achievements', path: '/checklist', prepare: prepareAchievements },
  // Today page — daily goal progress bar at 100%
  { slug: 'sc4-daily-goal', path: '/today', prepare: prepareDailyGoal, cleanup: deleteTodayEntries },
  // Individual book (Genesis) — chapter-by-chapter progress grid
  { slug: 'sc6-book-chapter-progress', path: '/books/1' },
  // Bible Books page — segmented progress bar plaque (shows whole-Bible progress)
  { slug: 'sc7-bible-progress', path: '/books' },
  // Today page at desktop viewport — shows app running in a browser window
  { slug: 'sc8-install-anywhere', path: '/today', desktop: true },
  // Calendar page — full page
  { slug: 'sc9-calendar', path: '/calendar' },
  // Notes page — full page
  { slug: 'sc10-notes', path: '/notes' },
  // Tags page — tag list with sidebar
  { slug: 'sc11-note-tags', path: '/tags' },
  // Checklist page — Exodus accordion expanded to show chapter checkboxes
  { slug: 'sc12-checklist', path: '/checklist', prepare: prepareChecklist },
  // Reading progress stats page — full page
  { slug: 'sc13-progress', path: '/progress' },
];

// --- Screenshot helpers ---

function localeUrlPath(locale: Locale, appPath: string): string {
  return locale === 'en' ? appPath : `/${locale}${appPath}`;
}

async function login(page: Page, locale: Locale): Promise<void> {
  const loginPath = localeUrlPath(locale, '/login');
  console.log(`   Logging in at ${loginPath}`);
  await page.goto(`${BASE_URL}${loginPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.waitForSelector('form', { timeout: 2000 });
  await page.waitForSelector('main', { timeout: 2000 });

  const emailLocator = page.locator('form input[type="text"]');
  const passwordLocator = page.locator('form input[type="password"]');
  const submitButton = page.locator('form button').first();

  await emailLocator.waitFor({ state: 'visible', timeout: 2000 });
  await passwordLocator.waitFor({ state: 'visible', timeout: 2000 });
  await submitButton.waitFor({ state: 'visible', timeout: 2000 });

  if (!(await emailLocator.count())) {
    throw new Error('Login page email input was not found');
  }
  if (!(await passwordLocator.count())) {
    throw new Error('Login page password input was not found');
  }
  if (!(await submitButton.count())) {
    throw new Error('Login page submit button was not found');
  }

  console.log('   Filling login form');
  await emailLocator.fill(SCREENSHOT_EMAIL);
  await passwordLocator.fill(SCREENSHOT_PASSWORD);

  console.log('   Submitting login form');
  await submitButton.click({ force: true });
  await page.waitForTimeout(1200);

  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  }
  catch (error) {
    const failurePath = path.join('scripts', `login-failure-${locale}.png`);
    console.error(`   Login did not navigate away from /login, saving ${failurePath}`);
    await page.screenshot({ path: failurePath, fullPage: true });
    throw error;
  }
}

async function savePngAndWebp(pngPath: string): Promise<void> {
  const webpPath = pngPath.replace(/\.png$/, '.webp');
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await sharp(pngPath).webp({ quality: 85 }).toFile(webpPath);
  await fs.unlink(pngPath);
  console.log(`  ✓ ${webpPath}`);
}

async function screenshotLocale(locale: Locale, page: Page): Promise<void> {
  console.log(`\n📸 Locale: ${locale}`);

  const outDir = path.join('web/public/screenshots', locale);
  await page.context().addCookies([
    {
      name: 'i18n_redirected',
      value: locale,
      domain: 'localhost',
      path: '/',
    },
  ]);

  for (const screen of SCREENS) {
    const viewport = screen.desktop ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;
    await page.setViewportSize(viewport);

    const localizedPath = localeUrlPath(locale, screen.path);
    const targetUrl = `${BASE_URL}${localizedPath}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    console.log(`    Navigated to ${page.url()}`);

    await page.waitForSelector('body', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    if (screen.prepare) {
      await screen.prepare(page);
    }

    await page.addStyleTag({ content: HIDE_UI_CSS });
    await page.waitForTimeout(300);

    const pngPath = path.join(outDir, `${screen.slug}.png`);
    await fs.mkdir(outDir, { recursive: true });
    await page.screenshot({ path: pngPath, type: 'png' });
    await savePngAndWebp(pngPath);

    if (screen.cleanup) {
      await screen.cleanup();
    }
  }
}

async function main(): Promise<void> {
  const headlessEnv = process.env.SCREENSHOT_HEADLESS?.toLowerCase();
  const headless = headlessEnv !== null
    ? headlessEnv !== 'false' && headlessEnv !== '0'
    : process.env.CI === 'true';

  console.log('🚀 Starting locale screenshot generation');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Account:  ${SCREENSHOT_EMAIL}`);
  console.log(`   Locales:  ${LOCALES.join(', ')}`);
  console.log(`   Headless: ${headless}`);

  await setupUser();

  const browser = await chromium.launch({ headless });
  const context: BrowserContext = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: MOBILE_SCALE,
  });
  const page: Page = await context.newPage();

  await login(page, 'en');

  try {
    for (const locale of LOCALES) {
      await resetLocaleData();
      await seedLocaleContent(locale);
      await screenshotLocale(locale, page);
    }
  }
  finally {
    await context.close();
    await browser.close();
    await teardownUser();
  }

  console.log('\n✅ Done. Screenshots saved to web/public/screenshots/{locale}/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
