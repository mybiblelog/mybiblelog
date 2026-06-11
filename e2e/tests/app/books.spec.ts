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

  test('testament toggle filters books and recalculates progress', async ({ page, api }) => {
    // John 1-3 registers ~1% of the New Testament but 0% of the whole Bible,
    // so the headline percentage proves the total tracks the selected testament.
    await seedLogEntries(api, [
      { date: today(), ...chapterRange(BOOK.JOHN, 1) },
      { date: today(), ...chapterRange(BOOK.JOHN, 2) },
      { date: today(), ...chapterRange(BOOK.JOHN, 3) },
    ]);
    const versesRead = [1, 2, 3].reduce((sum, chapter) => sum + chapterVerseCount(BOOK.JOHN, chapter), 0);
    const totalVerses = (firstBook: number, lastBook: number) => {
      let total = 0;
      for (let book = firstBook; book <= lastBook; book++) { total += bookVerseCount(book); }
      return total;
    };

    await page.goto('/books');
    const books = page.getByTestId('bible-report-book');
    const progress = page.getByTestId('bible-report-progress');

    // Default view covers the whole Bible
    await expect(books).toHaveCount(66);
    const biblePercentage = Math.floor((versesRead * 100) / totalVerses(1, 66));
    await expect(progress).toHaveAttribute('data-percentage', String(biblePercentage));

    // New Testament: 27 books starting with Matthew; total only counts NT verses
    await page.getByTestId('testament-toggle-new').click();
    await expect(books).toHaveCount(27);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.MATTHEW));
    const ntPercentage = Math.floor((versesRead * 100) / totalVerses(BOOK.MATTHEW, BOOK.REVELATION));
    expect(ntPercentage).toBeGreaterThan(biblePercentage);
    await expect(progress).toHaveAttribute('data-percentage', String(ntPercentage));

    // Old Testament: 39 books starting with Genesis; the John reading doesn't count
    await page.getByTestId('testament-toggle-old').click();
    await expect(books).toHaveCount(39);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.GENESIS));
    await expect(books.last()).toHaveAttribute('data-book-index', '39');
    await expect(progress).toHaveAttribute('data-percentage', '0');

    // Back to the whole Bible
    await page.getByTestId('testament-toggle-all').click();
    await expect(books).toHaveCount(66);
    await expect(progress).toHaveAttribute('data-percentage', String(biblePercentage));
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
