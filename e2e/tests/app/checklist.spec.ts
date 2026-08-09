import { test, expect } from '../../fixtures';
import { seedLogEntries, getLogEntries } from '../../helpers/seed';
import { chapterRange, chapterVerseCount, verseId, BOOK } from '../../helpers/passages';
import { today, daysAgo } from '../../helpers/dates';

test.describe('Chapter Checklist', () => {
  test('a fully read chapter shows as complete with book fraction', async ({ page, api }) => {
    await seedLogEntries(api, [{ date: today(), ...chapterRange(BOOK.GENESIS, 1) }]);

    await page.goto('/checklist');
    const genesisCard = page.getByTestId('book-card').first();
    await expect(genesisCard).toHaveAttribute('data-book-index', '1');
    await expect(genesisCard.getByTestId('book-card-fraction')).toHaveText(/1 \/ 50/);

    // Expand the book and check the chapter state
    await genesisCard.getByTestId('book-card-toggle').click();
    const chapter1 = genesisCard.getByTestId('chapter-card').first();
    await expect(chapter1).toHaveAttribute('data-chapter', '1');
    await expect(chapter1).toHaveAttribute('data-complete', 'true');
    await expect(genesisCard.getByTestId('chapter-card').nth(1)).not.toHaveAttribute('data-complete', 'true');
  });

  test('toggling a chapter creates and removes a log entry', async ({ page, api }) => {
    await page.goto('/checklist');

    const genesisCard = page.getByTestId('book-card').first();
    await expect(genesisCard).toBeVisible();
    await genesisCard.getByTestId('book-card-toggle').click();

    const chapter2 = genesisCard.getByTestId('chapter-card').nth(1);
    await expect(chapter2).toHaveAttribute('data-chapter', '2');

    // Toggle on: chapter becomes complete and a log entry exists for today
    await chapter2.click();
    await expect(chapter2).toHaveAttribute('data-complete', 'true');
    await expect(genesisCard.getByTestId('book-card-fraction')).toHaveText(/1 \/ 50/);

    const expectedRange = chapterRange(BOOK.GENESIS, 2);
    let entries = await getLogEntries(api);
    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        date: today(),
        startVerseId: expectedRange.startVerseId,
        endVerseId: expectedRange.endVerseId,
      }),
    ]));

    // Toggle off: chapter is incomplete again and the entry is gone
    await chapter2.click();
    await expect(chapter2).not.toHaveAttribute('data-complete', 'true');
    await expect(genesisCard.getByTestId('book-card-fraction')).toHaveText(/0 \/ 50/);

    entries = await getLogEntries(api);
    expect(entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        startVerseId: expectedRange.startVerseId,
        endVerseId: expectedRange.endVerseId,
      }),
    ]));
  });

  test('a small book can be completed entirely', async ({ page, api }) => {
    // Jude has a single chapter
    await seedLogEntries(api, [{ date: today(), ...chapterRange(BOOK.JUDE, 1) }]);

    await page.goto('/checklist');
    const judeCard = page.getByTestId('book-card').nth(BOOK.JUDE - 1);
    await expect(judeCard).toHaveAttribute('data-book-index', String(BOOK.JUDE));
    await expect(judeCard).toHaveAttribute('data-complete', 'true');
    await expect(judeCard.getByTestId('book-card-fraction')).toHaveText(/1 \/ 1/);
  });

  test('a chapter covered by a longer entry logged today explains it cannot be unchecked', async ({ page, api }) => {
    // Genesis 1:1 - 3:24 as a single entry: chapter 2 reads complete, but has no
    // entry of its own to delete.
    await seedLogEntries(api, [{
      date: today(),
      startVerseId: verseId(BOOK.GENESIS, 1, 1),
      endVerseId: verseId(BOOK.GENESIS, 3, chapterVerseCount(BOOK.GENESIS, 3)),
    }]);

    await page.goto('/checklist');
    const genesisCard = page.getByTestId('book-card').first();
    await genesisCard.getByTestId('book-card-toggle').click();

    const chapter2 = genesisCard.getByTestId('chapter-card').nth(1);
    await expect(chapter2).toHaveAttribute('data-complete', 'true');
    await chapter2.click();

    await expect(page.getByTestId('toast')).toHaveText(/logged as part of a longer passage/i);
    await expect(chapter2).toHaveAttribute('data-complete', 'true');
  });

  test('a chapter logged on a previous date explains it was logged before today', async ({ page, api }) => {
    await seedLogEntries(api, [{ date: daysAgo(1), ...chapterRange(BOOK.GENESIS, 1) }]);

    await page.goto('/checklist');
    const genesisCard = page.getByTestId('book-card').first();
    await genesisCard.getByTestId('book-card-toggle').click();

    const chapter1 = genesisCard.getByTestId('chapter-card').first();
    await expect(chapter1).toHaveAttribute('data-complete', 'true');
    await chapter1.click();

    await expect(page.getByTestId('toast')).toHaveText(/logged before today/i);
    await expect(chapter1).toHaveAttribute('data-complete', 'true');
  });

  test('testament toggle filters the book list without losing expansion state', async ({ page }) => {
    await page.goto('/checklist');
    const books = page.getByTestId('book-card');

    // Default view lists the whole Bible
    await expect(books).toHaveCount(66);

    // Expand Genesis first: the filter is a view concern, so an open book must
    // still be open when it comes back into view.
    const genesisCard = books.first();
    await genesisCard.getByTestId('book-card-toggle').click();
    await expect(genesisCard.getByTestId('chapter-card').first()).toBeVisible();

    // New Testament: 27 books starting with Matthew
    await page.getByTestId('testament-toggle-new').click();
    await expect(books).toHaveCount(27);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.MATTHEW));
    await expect(books.last()).toHaveAttribute('data-book-index', String(BOOK.REVELATION));

    // Old Testament: 39 books, Genesis through Malachi
    await page.getByTestId('testament-toggle-old').click();
    await expect(books).toHaveCount(39);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.GENESIS));
    await expect(books.last()).toHaveAttribute('data-book-index', '39');
    await expect(books.first().getByTestId('chapter-card').first()).toBeVisible();

    // Back to the whole Bible
    await page.getByTestId('testament-toggle-all').click();
    await expect(books).toHaveCount(66);
  });
});
