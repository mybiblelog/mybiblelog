import { test, expect } from '../../fixtures';
import { seedLogEntries, setSettings } from '../../helpers/seed';
import { verseId, BOOK } from '../../helpers/passages';
import { today, daysAgo } from '../../helpers/dates';

test.describe('Log page', () => {
  test('shows seeded history grouped by date', async ({ page, api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
      { date: daysAgo(1), startVerseId: verseId(BOOK.EXODUS, 1, 1), endVerseId: verseId(BOOK.EXODUS, 1, 10) },
      { date: daysAgo(2), startVerseId: verseId(BOOK.PSALMS, 1, 1), endVerseId: verseId(BOOK.PSALMS, 1, 6) },
    ]);

    await page.goto('/log');
    await expect(page.getByTestId('log-date-heading')).toHaveCount(3);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 1:1-10' })).toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Exodus 1:1-10' })).toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Psalm' })).toBeVisible();
  });

  test('date range filter narrows the results', async ({ page, api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
      { date: daysAgo(5), startVerseId: verseId(BOOK.EXODUS, 1, 1), endVerseId: verseId(BOOK.EXODUS, 1, 10) },
    ]);

    await page.goto('/log');
    await expect(page.getByTestId('log-date-heading')).toHaveCount(2);

    // The sidebar query manager has First/Last Date inputs
    const sidebar = page.locator('.log-page__sidebar');
    const dateInputs = sidebar.locator('input[type="date"]');
    await dateInputs.first().fill(daysAgo(1));
    await dateInputs.nth(1).fill(today());
    await sidebar.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByTestId('log-date-heading')).toHaveCount(1);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 1:1-10' })).toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Exodus' })).toHaveCount(0);
  });

  test('user can edit and delete entries from the log page', async ({ page, api }) => {
    // Set lookBackDate before the entry date so editing never triggers the
    // "entry before tracker start date" alert (tested separately below).
    await setSettings(api, { lookBackDate: daysAgo(7) });
    await seedLogEntries(api, [
      { date: daysAgo(1), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
    ]);

    await page.goto('/log');
    const entry = page.getByTestId('log-entry').first();

    // Edit
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByTestId('log-entry-editor-passage').fill('Genesis 1:1-20');
    await page.getByTestId('log-entry-editor-submit').click();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 1:1-20' })).toBeVisible();

    // Delete
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Delete' }).click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('log-entry-passage')).toHaveCount(0);
  });

  test('editing an entry before the tracker start date shows a warning alert', async ({ page, api }) => {
    // Leave lookBackDate at the default (today) so the entry date (yesterday)
    // is before it — the editor should warn the user after saving.
    await seedLogEntries(api, [
      { date: daysAgo(1), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
    ]);

    await page.goto('/log');
    const entry = page.getByTestId('log-entry').first();

    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByTestId('log-entry-editor-passage').fill('Genesis 1:1-20');
    await page.getByTestId('log-entry-editor-submit').click();

    // Alert should appear because the entry date is before lookBackDate
    await expect(page.getByTestId('dialog-ok')).toBeVisible();
    await page.getByTestId('dialog-ok').click();

    // Alert is dismissed; the updated passage should be visible
    await expect(page.getByTestId('dialog-ok')).not.toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 1:1-20' })).toBeVisible();
  });
});
