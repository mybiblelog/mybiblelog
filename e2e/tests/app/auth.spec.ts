import { test as base, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, login, generateTestEmail, generateRandomString, type TestUser } from '../../helpers/api-client';
import { env } from '../../helpers/env';

/**
 * True UI auth flows (registration, login, logout, password reset request).
 *
 * The auth endpoints are rate limited per IP (e.g. 5 login attempts/minute)
 * unless the request carries the test bypass header, so this file:
 *  - runs serially, and
 *  - injects `x-test-bypass-secret` into all browser requests so repeated
 *    local runs don't trip the limiter. The endpoints behave identically
 *    otherwise (the UI flow under test is unchanged).
 *
 * The full register -> auto-login -> /start flow requires the app to run
 * with REQUIRE_EMAIL_VERIFICATION=false (the Playwright webServer sets this).
 */
const test = base.extend({
  context: async ({ context }, use) => {
    await context.addCookies([
      { name: 'i18n_redirected', value: 'en', url: env.siteUrl },
    ]);
    await context.setExtraHTTPHeaders({ 'x-test-bypass-secret': env.bypassSecret });
    await use(context);
  },
});

test.describe.configure({ mode: 'serial' });

test.describe('Registration', () => {
  test('user can register, skip onboarding, and land on Today', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateRandomString(10);

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // With email verification disabled the app logs the user in and
    // sends them to the onboarding wizard.
    await page.getByRole('button', { name: 'Skip Personalization' }).click();
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

    // Cleanup: delete the account via API
    const { token } = await login(email, password);
    await deleteTestUser({ token });
  });

  test('registration validates missing fields', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByText('A email is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'Email' }).fill(generateTestEmail());
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByText('Must be 8 or more characters')).toBeVisible();
  });
});

test.describe('Login', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser) { await deleteTestUser(testUser); }
  });

  test('user can log in via the UI and log out again', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // New users land on the onboarding wizard
    await page.getByRole('button', { name: 'Skip Personalization' }).click();
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    // The entry list is client-only, so its presence proves hydration finished
    // (clicking the account menu before hydration does nothing)
    await expect(page.getByTestId('log-entries')).toBeVisible();

    // Log out via the account menu
    const accountButton = page.getByRole('button', { name: 'Account' });
    await accountButton.click();
    await expect(accountButton).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('menuitem', { name: 'Log Out' }).click();
    await expect(page.getByRole('link', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('login shows validation and bad-credential errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('A email is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('A password is required')).toBeVisible();

    await page.getByRole('textbox', { name: 'Password' }).fill('not-the-password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email or password is incorrect')).toBeVisible();
  });

  test('password reset request shows confirmation (up to email send)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
    await page.getByRole('button', { name: 'Forgot your password? Reset it via email.' }).click();
    await expect(page.getByText('A password reset link has been sent to your email address.')).toBeVisible();
  });
});

test.describe('Auth middleware', () => {
  test('anonymous user is redirected from app pages to login', async ({ page }) => {
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
