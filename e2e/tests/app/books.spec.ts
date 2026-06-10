import { test, expect } from '../../fixtures';
import { seedLogEntries } from '../../helpers/seed';
import { verseId, chapterRange, chapterVerseCount, bookVerseCount, BOOK } from '../../helpers/passages';
import { today } from '../../helpers/dates';

test.describe('Bible Books pages', () => {
  test('books overview shows per-book progress for seeded entries', async ({ page, api }) => {
    const genesis1 = chapterRange(BOOK.GENESIS, 1);
    await seedLogEntries(api, [
      { date: today(), ...genesis1 },
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 2, 1), endVerseId: verseId(BOOK.GENESIS, 2, 10) },
    ]);

    const versesRead = chapterVerseCount(BOOK.GENESIS, 1) + 10;
    const expectedPercentage = Math.floor((versesRead * 100) / bookVerseCount(BOOK.GENESIS));

    await page.goto('/books');
    const genesisCard = page.getByTestId('bible-report-book').first();
    await expect(genesisCard).toHaveAttribute('data-book-index', '1');
    await expect(genesisCard).toHaveAttribute('data-percentage', String(expectedPercentage));

    // An unread book shows zero progress
    const exodusCard = page.getByTestId('bible-report-book').nth(1);
    await expect(exodusCard).toHaveAttribute('data-percentage', '0');
  });

  test('book report shows chapter-level progress', async ({ page, api }) => {
    const genesis1 = chapterRange(BOOK.GENESIS, 1);
    await seedLogEntries(api, [
      { date: today(), ...genesis1 },
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 2, 1), endVerseId: verseId(BOOK.GENESIS, 2, 10) },
    ]);

    await page.goto('/books/1');

    const chapter1 = page.getByTestId('book-report-chapter').first();
    await expect(chapter1).toHaveAttribute('data-chapter', '1');
    await expect(chapter1).toHaveAttribute('data-verses-read', String(chapterVerseCount(BOOK.GENESIS, 1)));
    await expect(chapter1).toHaveAttribute('data-total-verses', String(chapterVerseCount(BOOK.GENESIS, 1)));

    const chapter2 = page.getByTestId('book-report-chapter').nth(1);
    await expect(chapter2).toHaveAttribute('data-verses-read', '10');
  });

  test('clicking a book on the overview navigates to its report', async ({ page }) => {
    await page.goto('/books');
    await page.getByTestId('bible-report-book').first().click();
    await expect(page).toHaveURL(/\/books\/1/);
    await expect(page.getByTestId('book-report-progress')).toBeVisible();
  });

  test('adding an entry from a chapter updates the book report', async ({ page }) => {
    await page.goto('/books/1');

    // Chapter cards open an action sheet with a "Log Reading" action
    await page.getByTestId('book-report-chapter').first().click();
    await page.getByTestId('action-sheet-item').filter({ hasText: 'Log Reading' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Pre-filled with the full chapter; just submit
    await expect(page.getByTestId('log-entry-editor-submit')).toBeEnabled();
    await page.getByTestId('log-entry-editor-submit').click();

    const chapter1 = page.getByTestId('book-report-chapter').first();
    await expect(chapter1).toHaveAttribute('data-verses-read', String(chapterVerseCount(BOOK.GENESIS, 1)));
  });
});
