import { test, expect } from '../../fixtures';
import { seedLogEntries, setSettings } from '../../helpers/seed';
import { verseId, BOOK } from '../../helpers/passages';
import { today, isoDate } from '../../helpers/dates';

/** First day of the current month (local time). */
const firstOfMonth = (): string => {
  const date = new Date();
  date.setDate(1);
  return isoDate(date);
};

test.describe('Calendar page', () => {
  test('seeded days show progress and goal state', async ({ page, api }) => {
    await setSettings(api, { dailyVerseCountGoal: 30 });
    // Genesis 1 has 31 verses, exceeding the goal of 30
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 31) },
    ]);

    await page.goto('/calendar');
    const todayCell = page.locator(`[data-testid="calendar-day"][data-date="${today()}"]`);
    // The per-day verse counts are computed client-side in chunks; allow extra time
    await expect(todayCell).toHaveAttribute('data-goal-met', 'true', { timeout: 15_000 });
    await expect(todayCell).toHaveAttribute('data-secondary-percentage', /^\d+(\.\d+)?$/);

    // Today is selected by default and lists its entries
    const dayEntries = page.getByTestId('calendar-day-entries');
    await expect(dayEntries).toHaveAttribute('data-date', today());
    await expect(dayEntries.getByTestId('log-entry-passage')).toHaveText(/Genesis 1/);
    await expect(page.getByTestId('calendar-selected-verse-count')).toHaveAttribute('data-verse-count', '31');
  });

  test('selecting another day shows its entries', async ({ page, api }) => {
    test.skip(firstOfMonth() === today(), 'needs two distinct days in the current month');

    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
      { date: firstOfMonth(), startVerseId: verseId(BOOK.EXODUS, 1, 1), endVerseId: verseId(BOOK.EXODUS, 1, 5) },
    ]);

    await page.goto('/calendar');
    await page.locator(`[data-testid="calendar-day"][data-date="${firstOfMonth()}"]`).click();

    const dayEntries = page.getByTestId('calendar-day-entries');
    await expect(dayEntries).toHaveAttribute('data-date', firstOfMonth());
    await expect(dayEntries.getByTestId('log-entry-passage')).toHaveText(/Exodus 1:1-5/);
    await expect(page.getByTestId('calendar-selected-verse-count')).toHaveAttribute('data-verse-count', '5');
  });

  test('user can add an entry for a past date from the calendar', async ({ page }) => {
    test.skip(firstOfMonth() === today(), 'needs a past day in the current month');

    await page.goto('/calendar');
    await page.locator(`[data-testid="calendar-day"][data-date="${firstOfMonth()}"]`).click();
    await page.getByTestId('calendar-add-entry').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // The date is pre-filled with the selected day
    await expect(page.getByTestId('log-entry-editor-date')).toHaveValue(firstOfMonth());

    await dialog.getByTestId('log-entry-editor-passage').fill('Genesis 1:1-10');
    await page.getByTestId('log-entry-editor-submit').click();

    const dayEntries = page.getByTestId('calendar-day-entries');
    await expect(dayEntries.getByTestId('log-entry-passage')).toHaveText(/Genesis 1:1-10/);
  });

  test('user can delete an entry from the calendar', async ({ page, api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
    ]);

    await page.goto('/calendar');
    const dayEntries = page.getByTestId('calendar-day-entries');
    const entry = dayEntries.getByTestId('log-entry').first();
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Delete' }).click();
    await page.getByTestId('dialog-confirm').click();

    await expect(dayEntries.getByTestId('log-entry')).toHaveCount(0);
    await expect(page.getByTestId('calendar-selected-verse-count')).toHaveAttribute('data-verse-count', '0');
  });

  test('user can navigate between months', async ({ page }) => {
    await page.goto('/calendar');
    const days = page.getByTestId('calendar-day');
    await expect(days.first()).toBeVisible();

    // Previous month: no current-month day matches today's date anymore
    await page.locator('.calendar-date-selector .prev').click();
    await expect(page.locator(`[data-testid="calendar-day"][data-date="${today()}"][data-current-month="true"]`)).toHaveCount(0);

    // Back to the current month
    await page.locator('.calendar-date-selector .today').click();
    await expect(page.locator(`[data-testid="calendar-day"][data-date="${today()}"][data-current-month="true"]`)).toHaveCount(1);
  });
});
