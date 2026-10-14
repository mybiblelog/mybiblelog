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
    await dialog.getByLabel('End Verse').selectOption('20');
    await page.getByTestId('log-entry-editor-submit').click();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 1:1-20' })).toBeVisible();

    // Delete
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Delete' }).click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('log-entry-passage')).toHaveCount(0);
  });

  test('pagination keeps same-date entries together across page boundaries', async ({ page, api }) => {
    // Page size defaults to 10. Seed 9 single-entry days, then a 10th day
    // (daysAgo(10)) with 3 entries -- that day's group pushes the running
    // count from 9 to 12, past the limit. The day-group-aware pager must
    // keep all 3 of those entries on page 1 rather than splitting the day
    // across the page boundary. Two more single-entry days land on page 2.
    const entries = [];
    for (let i = 1; i <= 9; i++) {
      entries.push({ date: daysAgo(i), startVerseId: verseId(BOOK.GENESIS, i, 1), endVerseId: verseId(BOOK.GENESIS, i, 5) });
    }
    entries.push({ date: daysAgo(10), startVerseId: verseId(BOOK.GENESIS, 10, 1), endVerseId: verseId(BOOK.GENESIS, 10, 5) });
    entries.push({ date: daysAgo(10), startVerseId: verseId(BOOK.GENESIS, 11, 1), endVerseId: verseId(BOOK.GENESIS, 11, 5) });
    entries.push({ date: daysAgo(10), startVerseId: verseId(BOOK.GENESIS, 12, 1), endVerseId: verseId(BOOK.GENESIS, 12, 5) });
    entries.push({ date: daysAgo(11), startVerseId: verseId(BOOK.GENESIS, 13, 1), endVerseId: verseId(BOOK.GENESIS, 13, 5) });
    entries.push({ date: daysAgo(12), startVerseId: verseId(BOOK.GENESIS, 14, 1), endVerseId: verseId(BOOK.GENESIS, 14, 5) });
    await seedLogEntries(api, entries);

    await page.goto('/log');

    const pageSelect = page.getByRole('combobox', { name: 'Page' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const prevButton = page.getByRole('button', { name: 'Prev' });

    // Two pages total.
    await expect(pageSelect.locator('option')).toHaveCount(2);

    // Page 1: the 9 single-entry days plus the full 3-entry day (12 entries,
    // 10 date groups) -- the straddling day is NOT split.
    await expect(page.getByTestId('log-date-heading')).toHaveCount(10);
    await expect(page.getByTestId('log-entry')).toHaveCount(12);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 10:1-5' })).toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 11:1-5' })).toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 12:1-5' })).toBeVisible();
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();

    // Next page: the remaining 2 single-entry days (2 entries, 2 date
    // groups) -- none of the straddling day's 3 entries leaked over.
    await nextButton.click();
    await expect(pageSelect).toHaveValue('2');
    await expect(page.getByTestId('log-date-heading')).toHaveCount(2);
    await expect(page.getByTestId('log-entry')).toHaveCount(2);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 10:1-5' })).toHaveCount(0);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 11:1-5' })).toHaveCount(0);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 12:1-5' })).toHaveCount(0);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 13:1-5' })).toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 14:1-5' })).toBeVisible();
    await expect(nextButton).toBeDisabled();
    await expect(prevButton).toBeEnabled();

    // Prev page: back to page 1 with the straddling day intact again.
    await prevButton.click();
    await expect(pageSelect).toHaveValue('1');
    await expect(page.getByTestId('log-date-heading')).toHaveCount(10);
    await expect(page.getByTestId('log-entry')).toHaveCount(12);
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 10:1-5' })).toBeVisible();
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
    await dialog.getByLabel('End Verse').selectOption('20');
    await page.getByTestId('log-entry-editor-submit').click();

    // Alert should appear because the entry date is before lookBackDate
    await expect(page.getByTestId('dialog-ok')).toBeVisible();
    await page.getByTestId('dialog-ok').click();

    // Alert is dismissed; the updated passage should be visible
    await expect(page.getByTestId('dialog-ok')).not.toBeVisible();
    await expect(page.getByTestId('log-entry-passage').filter({ hasText: 'Genesis 1:1-20' })).toBeVisible();
  });
});
