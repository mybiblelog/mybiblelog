import { test, expect } from '../../fixtures';
import { env } from '../../helpers/env';

test.describe('/feedback page', () => {
  test('form is visible for anonymous visitors', async ({ browser }) => {
    const anonContext = await browser.newContext();
    await anonContext.addCookies([{ name: 'i18n_redirected', value: 'en', url: env.siteUrl }]);
    const anonPage = await anonContext.newPage();

    await anonPage.goto(env.siteUrl + '/feedback');
    await expect(anonPage.getByTestId('feedback-form')).toBeVisible();
    await expect(anonPage.getByTestId('feedback-email')).toBeEnabled();
    await expect(anonPage.getByTestId('feedback-kind')).toBeVisible();
    await expect(anonPage.getByTestId('feedback-message')).toBeVisible();
    await expect(anonPage.getByTestId('feedback-submit')).toBeVisible();

    await anonContext.close();
  });

  test('form is visible for logged-in users with email pre-filled and locked', async ({ page }) => {
    await page.goto('/feedback');

    await expect(page.getByTestId('feedback-form')).toBeVisible();
    await expect(page.getByTestId('feedback-email')).toBeDisabled();
    await expect(page.getByTestId('feedback-kind')).toBeVisible();
    await expect(page.getByTestId('feedback-message')).toBeVisible();
    await expect(page.getByTestId('feedback-submit')).toBeVisible();
  });
});

test.describe('Floating feedback button', () => {
  test('is hidden for anonymous visitors', async ({ browser }) => {
    const anonContext = await browser.newContext();
    await anonContext.addCookies([{ name: 'i18n_redirected', value: 'en', url: env.siteUrl }]);
    const anonPage = await anonContext.newPage();

    await anonPage.goto(env.siteUrl + '/');
    await expect(anonPage.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(anonPage.getByTestId('floating-feedback-button')).toHaveCount(0);

    await anonContext.close();
  });

  test('is visible for logged-in users and submits feedback', async ({ page }) => {
    await page.goto('/today');

    const fab = page.getByTestId('floating-feedback-button');
    await expect(fab).toBeVisible();
    await fab.click();

    const form = page.getByTestId('feedback-form');
    await expect(form).toBeVisible();

    // Email is pre-filled and locked for logged-in users
    await expect(page.getByTestId('feedback-email')).toBeDisabled();

    await page.getByTestId('feedback-kind').selectOption('feature');
    await page.getByTestId('feedback-message').fill('e2e test feedback message');

    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/feedback') && response.request().method() === 'POST');
    await page.getByTestId('feedback-submit').click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);

    await expect(page.getByText('Feedback submitted successfully. Thank you!')).toBeVisible();
    await page.getByTestId('dialog-ok').click();
  });

  test('closing a dirty feedback form asks for confirmation', async ({ page }) => {
    await page.goto('/today');
    await page.getByTestId('floating-feedback-button').click();
    await page.getByTestId('feedback-message').fill('unsaved draft');

    await page.getByTestId('modal-close').click();
    await expect(page.getByTestId('dialog-confirm')).toBeVisible();

    // Cancel keeps the modal and the draft
    await page.getByTestId('dialog-cancel').click();
    await expect(page.getByTestId('feedback-message')).toHaveValue('unsaved draft');

    // Confirm closes the modal
    await page.getByTestId('modal-close').click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('feedback-form')).not.toBeVisible();
  });
});
