import { test, expect } from '../../fixtures';
import { seedLogEntries, setSettings } from '../../helpers/seed';
import { verseId, bookChapterCount, chapterVerseCount } from '../../helpers/passages';
import { daysAgo, today } from '../../helpers/dates';
import type { APIRequestContext } from '@playwright/test';

const BIBLE_BOOK_COUNT = 66;

// New users have lookBackDate defaulting to today in the DB schema, which would filter out
// any entries from before today. Open a tracker window to a past date before seeding so
// that currentLogEntries includes the seeded data and isBibleComplete can be true.
async function setupCompleteReadingHistory(api: APIRequestContext) {
  await setSettings(api, { lookBackDate: daysAgo(7) });
  const entries = [];
  for (let book = 1; book <= BIBLE_BOOK_COUNT; book++) {
    const lastChapter = bookChapterCount(book);
    entries.push({
      date: daysAgo(1),
      startVerseId: verseId(book, 1, 1),
      endVerseId: verseId(book, lastChapter, chapterVerseCount(book, lastChapter)),
    });
  }
  await seedLogEntries(api, entries);
}

test.describe('ReadingTrackerResetCard', () => {
  test('card appears on Today when Bible is complete with no entry today', async ({ page, api }) => {
    await setupCompleteReadingHistory(api);

    await page.goto('/today');
    await expect(page.getByTestId('reading-tracker-reset-card')).toBeVisible();
    await expect(page.getByTestId('reading-tracker-reset-card')).toContainText("You've read the whole Bible!");
  });

  test('card appears on Calendar when Bible is complete with no entry today', async ({ page, api }) => {
    await setupCompleteReadingHistory(api);

    await page.goto('/calendar');
    await expect(page.getByTestId('reading-tracker-reset-card')).toBeVisible();
  });

  test('Start Fresh sets lookBackDate to today and hides the card', async ({ page, api }) => {
    await setupCompleteReadingHistory(api);

    await page.goto('/today');
    await expect(page.getByTestId('reading-tracker-reset-card')).toBeVisible();

    await page.getByRole('button', { name: 'Start Fresh' }).click();

    await expect(page.getByTestId('reading-tracker-reset-card')).not.toBeVisible();

    await expect(async () => {
      const response = await api.get('/api/settings');
      const { data } = await response.json();
      expect(data.lookBackDate).toBe(today());
    }).toPass();
  });

  test('Dismiss hides the card for the session without changing settings', async ({ page, api }) => {
    await setupCompleteReadingHistory(api);

    await page.goto('/today');
    await expect(page.getByTestId('reading-tracker-reset-card')).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByTestId('reading-tracker-reset-card')).not.toBeVisible();

    // lookBackDate is unchanged (still the value we set in setupCompleteReadingHistory)
    const response = await api.get('/api/settings');
    const { data } = await response.json();
    expect(data.lookBackDate).toBe(daysAgo(7));

    // Card stays hidden when navigating within the same session
    await page.goto('/calendar');
    await expect(page.getByTestId('reading-tracker-reset-card')).not.toBeVisible();
  });

  test('card does not appear when there is already an entry today', async ({ page, api }) => {
    await setupCompleteReadingHistory(api);
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(1, 1, 1), endVerseId: verseId(1, 1, 1) },
    ]);

    await page.goto('/today');
    await expect(page.getByTestId('reading-tracker-reset-card')).not.toBeVisible();
  });

  test('card does not appear when trackerStartDate is after all entries', async ({ page, api }) => {
    // Default lookBackDate for new users is today, so entries from yesterday are excluded.
    // This test confirms isBibleComplete is false when the tracker window is empty.
    const entries = [];
    for (let book = 1; book <= BIBLE_BOOK_COUNT; book++) {
      const lastChapter = bookChapterCount(book);
      entries.push({
        date: daysAgo(1),
        startVerseId: verseId(book, 1, 1),
        endVerseId: verseId(book, lastChapter, chapterVerseCount(book, lastChapter)),
      });
    }
    await seedLogEntries(api, entries);
    // Leave lookBackDate at the DB default (today) — all entries are before it

    await page.goto('/today');
    await expect(page.getByTestId('reading-tracker-reset-card')).not.toBeVisible();
  });
});
