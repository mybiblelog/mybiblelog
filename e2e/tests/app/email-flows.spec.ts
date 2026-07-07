import { test as base, expect, type BrowserContext } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  login,
  getCurrentUser,
  generateTestEmail,
  generateRandomString,
  type TestUser,
} from '../../helpers/api-client';
import { waitForEmail, extractCode } from '../../helpers/emails';
import { waitForHydration } from '../../helpers/hydration';
import { env } from '../../helpers/env';

/**
 * End-to-end coverage of the email-based flows: verify-email, reset-password and
 * change-email. The one-time codes are normally delivered only by email, so each
 * test recovers the code from the test-only email seam (`GET /api/test/emails`,
 * see e2e/helpers/emails.ts) and then drives the redemption in the browser.
 *
 * The auth endpoints are rate limited per IP unless the request carries the test
 * bypass header, so — like auth.spec — this file runs serially and injects
 * `x-test-bypass-secret` into every browser request. The API only honors it in
 * non-production.
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

const authenticateBrowser = async (context: BrowserContext, user: TestUser) => {
  // Mirror the auth_token cookie the app sets on login (HttpOnly, Lax) so
  // auth-guarded pages treat the browser as logged in as `user`.
  await context.addCookies([
    { name: 'auth_token', value: user.token, url: env.siteUrl, httpOnly: true, sameSite: 'Lax' },
  ]);
};

test.describe('Email verification', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    // Registration enqueues a verification email regardless of
    // REQUIRE_EMAIL_VERIFICATION, so a fresh user always has a code to redeem.
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('user can confirm their email via the emailed code', async ({ page, context }) => {
    await authenticateBrowser(context, user);

    const email = await waitForEmail({ to: user.email, subject: 'Email Verification' });
    const code = extractCode(email);

    await page.goto(`/verify-email?code=${code}`);

    // On success the page verifies the code, logs the user in, and routes to the
    // onboarding wizard at /start. A bad/expired code would keep us on
    // /verify-email and render an error instead.
    await expect(page).toHaveURL(/\/start/);
  });
});

test.describe('Password reset', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('user can reset their password via the emailed link', async ({ page }) => {
    const requestedAt = new Date();

    // Request the reset from the login page UI. Interacting before hydration
    // silently loses the fill (the reactive model stays empty and the API
    // reports success for unknown emails), so gate on hydration first and
    // assert the request actually carried the address.
    await page.goto('/login');
    await waitForHydration(page);
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    const resetRequestPromise = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().includes('/api/auth/password/reset'),
    );
    await page.getByRole('button', { name: 'Forgot your password? Reset it via email.' }).click();
    expect((await resetRequestPromise).postDataJSON()).toMatchObject({ email: user.email });
    await expect(page.getByText('A password reset link has been sent to your email address.')).toBeVisible();

    // Recover the code from the emailed link and set a new password.
    const email = await waitForEmail({ to: user.email, subject: 'Reset Password', since: requestedAt });
    const code = extractCode(email);
    const newPassword = generateRandomString(10);

    await page.goto(`/reset-password?code=${code}`);
    await waitForHydration(page);
    await page.locator('input[name="newPassword"]').fill(newPassword);
    await page.locator('input[name="confirmNewPassword"]').fill(newPassword);
    await page.getByRole('button', { name: 'Submit' }).click();

    // On success the user is auto-logged-in and routed to the onboarding wizard.
    await expect(page).toHaveURL(/\/start/);

    // The new password actually works (and the old one no longer does).
    const { token } = await login(user.email, newPassword);
    expect(token).toBeTruthy();
    await expect(login(user.email, user.password)).rejects.toThrow();
  });
});

test.describe('Email change', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('user can change their email via the emailed code', async ({ page, context }) => {
    await authenticateBrowser(context, user);
    const newEmail = generateTestEmail();

    // Request the change from the email settings page.
    await page.goto('/settings/email');
    await waitForHydration(page);
    const newEmailInput = page.locator('input[name="newEmail"]');
    await expect(newEmailInput).toBeVisible();
    await newEmailInput.fill(newEmail);
    await page.locator('input[name="password"]').fill(user.password);
    await page.getByRole('button', { name: 'Change Email' }).click();
    await expect(
      page.getByText('A confirmation link has been sent to your new email address. Click the link to finish changing your email.'),
    ).toBeVisible();

    // The confirmation email goes to the NEW address; redeem its code.
    const email = await waitForEmail({ to: newEmail, subject: 'Confirm New Email Address' });
    const code = extractCode(email);

    await page.goto(`/change-email?code=${code}`);

    // The account's primary email is now the new address (the JWT still resolves
    // to the same user id, so the original token reflects the updated email).
    await expect.poll(async () => (await getCurrentUser(user.token))?.email, { timeout: 10000 }).toBe(newEmail);

    // Keep `user.email` accurate so afterAll cleanup targets the right account.
    user.email = newEmail;
  });
});
