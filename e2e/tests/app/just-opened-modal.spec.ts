import { test, expect } from '../../fixtures';
import { seedLogEntries } from '../../helpers/seed';
import { verseId, BOOK } from '../../helpers/passages';
import { today } from '../../helpers/dates';

// "Open Bible" opens the reading site in a new tab and shows the "Just Opened"
// prompt back on the original page (see useOpenInBible.ts / just-opened.ts
// store). The new tab isn't under test here, so it's closed as soon as it
// appears to keep the run clean.
async function openBibleFromActionMenu(page: import('@playwright/test').Page) {
  const entry = page.getByTestId('log-entries').getByTestId('log-entry').first();
  await entry.getByTestId('action-menu-toggle').click();
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('action-menu-item').filter({ hasText: 'Open Bible' }).click(),
  ]);
  await popup.close();
}

test.describe('Just Opened prompt', () => {
  test.beforeEach(async ({ api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
    ]);
  });

  test('Log Reading opens the log entry editor pre-filled with today and the passage', async ({ page }) => {
    await page.goto('/today');
    await openBibleFromActionMenu(page);

    await expect(page.getByTestId('just-opened-message')).toContainText('Genesis 1:1-10');

    await page.getByTestId('just-opened-log').click();
    await expect(page.getByTestId('just-opened-message')).not.toBeVisible();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('log-entry-editor-date')).toHaveValue(today());
    await expect(page.getByTestId('log-entry-editor-preview')).toHaveText(/Genesis 1:1-10/);
  });

  test('Take Note opens the passage note editor pre-filled with the passage', async ({ page }) => {
    await page.goto('/today');
    await openBibleFromActionMenu(page);

    await page.getByTestId('just-opened-note').click();
    await expect(page.getByTestId('just-opened-message')).not.toBeVisible();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.mbl-modal__title')).toHaveText('New Note');
    await expect(dialog.getByTestId('note-editor')).toContainText('Genesis 1:1-10');
  });

  test('Dismiss closes the modal without opening an editor', async ({ page }) => {
    await page.goto('/today');
    await openBibleFromActionMenu(page);

    await expect(page.getByTestId('just-opened-message')).toBeVisible();
    await page.getByTestId('just-opened-dismiss').click();

    await expect(page.getByTestId('just-opened-message')).not.toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
