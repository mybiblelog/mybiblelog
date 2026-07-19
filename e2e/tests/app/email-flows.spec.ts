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
 * change-email. Each flow now emails a short numeric code AND a magic link that
 * embeds the same code + the account email. The reset and change flows are driven
 * through the new code-entry modal (the primary path); verify-email is driven
 * through the magic-link landing page (its modal only opens when the app runs
 * with REQUIRE_EMAIL_VERIFICATION=true, which the e2e web server does not).
 *
 * The one-time codes are recovered from the test-only email seam
 * (`GET /api/test/emails`, see e2e/helpers/emails.ts). Like auth.spec, this file
 * runs serially and injects `x-test-bypass-secret` into every browser request so
 * the per-IP/email rate limits don't trip on repeated local runs (the per-code
 * attempt cap is independent of that bypass).
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

const verifyLink = (code: string, email: string) =>
  `/verify-email?code=${code}&email=${encodeURIComponent(email)}`;
const resetLink = (code: string, email: string) =>
  `/reset-password?code=${code}&email=${encodeURIComponent(email)}`;

test.describe('Email verification (magic link)', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    // Registration enqueues a verification email regardless of
    // REQUIRE_EMAIL_VERIFICATION, so a fresh user always has a code to redeem.
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('user can confirm their email via the emailed code + email link', async ({ page }) => {
    const emailMessage = await waitForEmail({ to: user.email, subject: 'Email Verification' });
    const code = extractCode(emailMessage);

    // The link now carries both the code and the account email; the landing page
    // redeems it against the email-scoped endpoint, logs in, and routes to /start.
    await page.goto(verifyLink(code, user.email));
    await expect(page).toHaveURL(/\/start/);
  });
});

test.describe('Password reset (code modal)', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('user resets their password by typing the emailed code into the modal', async ({ page }) => {
    const requestedAt = new Date();

    // Request the reset from the login page; the code-entry modal opens.
    await page.goto('/login');
    await waitForHydration(page);
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('button', { name: 'Forgot your password? Reset it via email.' }).click();
    await expect(page.getByTestId('auth-code-input')).toBeVisible();

    // A wrong code is rejected inline and clears the field (per-code attempt cap
    // territory) without advancing to the password step.
    await page.getByTestId('auth-code-input').fill('000000');
    await expect(page.getByTestId('auth-code-error')).toBeVisible();
    await expect(page.getByTestId('auth-code-input')).toHaveValue('');
    await expect(page.getByTestId('auth-code-new-password')).toHaveCount(0);

    // Recover the real code and type it — the modal auto-submits and reveals the
    // new-password step.
    const email = await waitForEmail({ to: user.email, subject: 'Reset Password', since: requestedAt });
    const code = extractCode(email);
    const newPassword = generateRandomString(10);

    await page.getByTestId('auth-code-input').fill(code);
    await expect(page.getByTestId('auth-code-new-password')).toBeVisible();
    await page.getByTestId('auth-code-new-password').fill(newPassword);
    await page.getByTestId('auth-code-confirm-password').fill(newPassword);
    await page.getByTestId('auth-code-password-submit').click();

    // On success the user is auto-logged-in and routed to the onboarding wizard.
    await expect(page).toHaveURL(/\/start/);

    // The new password actually works (and the old one no longer does).
    const { token } = await login(user.email, newPassword);
    expect(token).toBeTruthy();
    await expect(login(user.email, user.password)).rejects.toThrow();
  });
});

test.describe('Email change (code modal)', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('user changes their email by typing the emailed code into the modal', async ({ page, context }) => {
    await authenticateBrowser(context, user);
    const newEmail = generateTestEmail();

    // Request the change from the email settings page; the modal opens.
    await page.goto('/settings/email');
    await waitForHydration(page);
    const newEmailInput = page.locator('input[name="newEmail"]');
    await expect(newEmailInput).toBeVisible();
    await newEmailInput.fill(newEmail);
    await page.locator('input[name="password"]').fill(user.password);
    await page.getByRole('button', { name: 'Change Email' }).click();
    await expect(page.getByTestId('auth-code-input')).toBeVisible();

    // The confirmation email goes to the NEW address; redeem its code in the modal
    // (the modal validates against the account's CURRENT email under the hood).
    const email = await waitForEmail({ to: newEmail, subject: 'Confirm New Email Address' });
    const code = extractCode(email);
    await page.getByTestId('auth-code-input').fill(code);

    // The account's primary email is now the new address.
    await expect.poll(async () => (await getCurrentUser(user.token))?.email, { timeout: 10000 }).toBe(newEmail);

    // Keep `user.email` accurate so afterAll cleanup targets the right account.
    user.email = newEmail;
  });
});

test.describe('Cross-tab completion', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test.afterAll(async () => {
    if (user) { await deleteTestUser(user); }
  });

  test('completing the flow via the link in another tab closes the waiting modal', async ({ page, context }) => {
    const requestedAt = new Date();

    // Tab A: open the reset-password modal and leave it waiting for a code.
    await page.goto('/login');
    await waitForHydration(page);
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('button', { name: 'Forgot your password? Reset it via email.' }).click();
    await expect(page.getByTestId('auth-code-input')).toBeVisible();

    const email = await waitForEmail({ to: user.email, subject: 'Reset Password', since: requestedAt });
    const code = extractCode(email);
    const newPassword = generateRandomString(10);

    // Tab B (same browser context → shares the BroadcastChannel): complete the
    // reset via the magic-link landing page.
    const tabB = await context.newPage();
    await tabB.goto(resetLink(code, user.email));
    await waitForHydration(tabB);
    await tabB.locator('input[name="newPassword"]').fill(newPassword);
    await tabB.locator('input[name="confirmNewPassword"]').fill(newPassword);
    await tabB.getByRole('button', { name: 'Submit' }).click();
    await expect(tabB).toHaveURL(/\/start/);

    // Tab A observes the broadcast, closes the modal, and moves the user on.
    await expect(page).toHaveURL(/\/start/, { timeout: 15000 });
    await tabB.close();
  });
});
