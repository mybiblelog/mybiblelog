import { test, expect } from '../../fixtures';
import { seedLogEntries, seedNote } from '../../helpers/seed';
import { verseId, chapterRange, chapterVerseCount, bookVerseCount, bookChapterCount, displayVerseRange, BOOK } from '../../helpers/passages';
import { today } from '../../helpers/dates';
import { waitForHydration } from '../../helpers/hydration';

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

  test('books overview shows a note-count badge on every book once any book has notes', async ({ page, api }) => {
    await seedNote(api, {
      content: 'In the beginning',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 5) }],
    });
    await seedNote(api, {
      content: 'Another note in Genesis',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 2, 1), endVerseId: verseId(BOOK.GENESIS, 2, 3) }],
    });

    await page.goto('/books');
    const genesisCard = page.getByTestId('bible-report-book').first();
    await expect(genesisCard.locator('.progress-card-note-count-badge')).toHaveText('2 Notes');

    // Exodus has no notes of its own, but the badge still renders (as 0) once
    // any book in the list has notes, since the v-if gates on the whole set.
    const exodusCard = page.getByTestId('bible-report-book').nth(1);
    await expect(exodusCard.locator('.progress-card-note-count-badge')).toHaveText('0 Notes');
  });

  test('books overview hides the note-count badge when no books have notes', async ({ page }) => {
    await page.goto('/books');
    await expect(page.getByTestId('bible-report-book')).toHaveCount(66);
    await expect(page.locator('.progress-card-note-count-badge')).toHaveCount(0);
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

  test('book order and testament filter can be changed and persist across visits', async ({ page }) => {
    await page.goto('/books');
    const books = page.getByTestId('bible-report-book');
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.GENESIS));

    // The sort button toggles to alphabetical (English): Acts comes first
    const sortToggle = page.getByTestId('book-sort-toggle');
    await expect(sortToggle).toHaveAttribute('data-sort-order', 'numerical');
    await sortToggle.click();
    await expect(sortToggle).toHaveAttribute('data-sort-order', 'alphabetical');
    await expect(books).toHaveCount(66);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.ACTS));

    await page.getByTestId('testament-toggle-new').click();
    await expect(books).toHaveCount(27);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.ACTS));

    // Both choices are rendered server-side on the next visit, so the list never reshuffles after hydration
    const html = await (await page.request.get('/books')).text();
    const ssrOrder = [...html.matchAll(/data-book-index="(\d+)"/g)].map(m => Number(m[1]));
    expect(ssrOrder).toHaveLength(27);
    expect(ssrOrder[0]).toBe(BOOK.ACTS);

    await page.reload();
    await expect(books).toHaveCount(27);
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.ACTS));

    // Toggling again returns to traditional order
    await expect(sortToggle).toHaveAttribute('data-sort-order', 'alphabetical');
    await sortToggle.click();
    await expect(books.first()).toHaveAttribute('data-book-index', String(BOOK.MATTHEW));
  });

  test('clicking a book on the overview navigates to its report', async ({ page }) => {
    await page.goto('/books');
    await page.getByTestId('bible-report-book').first().click();
    await expect(page).toHaveURL(/\/books\/1/);
    await expect(page.getByTestId('book-report-progress')).toBeVisible();
  });

  test('invalid book index redirects to the books overview', async ({ page }) => {
    // Every in-app link builds `/books/${bookIndex}`, but a hand-typed or stale
    // URL must not reach the Bible lookups with a non-numeric or out-of-range index.
    for (const badIndex of ['genesis', '0', String(BOOK.REVELATION + 1), '1.5']) {
      await page.goto(`/books/${badIndex}`);
      await expect(page).toHaveURL(/\/books$/);
    }
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

  test('book report back button returns to the books overview', async ({ page }) => {
    await page.goto('/books/1');
    await waitForHydration(page);
    await page.getByTestId('book-report-back').click();
    await expect(page).toHaveURL(/\/books$/);
  });

  test('book report "Book Notes" button navigates to /notes filtered to the whole book', async ({ page }) => {
    await page.goto('/books/1');
    await waitForHydration(page);
    await page.getByTestId('book-report-view-notes').click();

    await expect(page).toHaveURL(/\/notes/);
    const url = new URL(page.url());
    const lastChapter = bookChapterCount(BOOK.GENESIS);
    expect(url.searchParams.get('filterPassageStartVerseId')).toBe(String(verseId(BOOK.GENESIS, 1, 1)));
    expect(url.searchParams.get('filterPassageEndVerseId'))
      .toBe(String(verseId(BOOK.GENESIS, lastChapter, chapterVerseCount(BOOK.GENESIS, lastChapter))));
  });

  test('book report "Book Reading" button navigates to /log filtered to the whole book', async ({ page }) => {
    await page.goto('/books/1');
    await waitForHydration(page);
    await page.getByTestId('book-report-view-log').click();

    await expect(page).toHaveURL(/\/log/);
    const url = new URL(page.url());
    const lastChapter = bookChapterCount(BOOK.GENESIS);
    expect(url.searchParams.get('filterPassageStartVerseId')).toBe(String(verseId(BOOK.GENESIS, 1, 1)));
    expect(url.searchParams.get('filterPassageEndVerseId'))
      .toBe(String(verseId(BOOK.GENESIS, lastChapter, chapterVerseCount(BOOK.GENESIS, lastChapter))));
  });

  test('taking a note on a chapter opens the note editor prefilled with the chapter passage', async ({ page }) => {
    await page.goto('/books/1');
    await page.getByTestId('book-report-chapter').first().click();
    await page.getByTestId('action-sheet-item').filter({ hasText: 'Take Note' }).click();

    const editor = page.getByTestId('note-editor');
    await expect(editor).toBeVisible();
    const expectedRange = displayVerseRange(verseId(BOOK.GENESIS, 1, 1), verseId(BOOK.GENESIS, 1, chapterVerseCount(BOOK.GENESIS, 1)));
    await expect(editor.locator('.passage-list')).toContainText(expectedRange);
  });

  test('viewing notes for a chapter navigates to /notes filtered to that chapter', async ({ page }) => {
    await page.goto('/books/1');
    await page.getByTestId('book-report-chapter').first().click();
    await page.getByTestId('action-sheet-item').filter({ hasText: 'View Notes' }).click();

    await expect(page).toHaveURL(/\/notes/);
    const url = new URL(page.url());
    expect(url.searchParams.get('filterPassageStartVerseId')).toBe(String(verseId(BOOK.GENESIS, 1, 1)));
    expect(url.searchParams.get('filterPassageEndVerseId')).toBe(String(verseId(BOOK.GENESIS, 1, chapterVerseCount(BOOK.GENESIS, 1))));
  });

  test('viewing the reading log for a chapter navigates to /log filtered to that chapter', async ({ page }) => {
    await page.goto('/books/1');
    await page.getByTestId('book-report-chapter').first().click();
    await page.getByTestId('action-sheet-item').filter({ hasText: 'View Reading Log' }).click();

    await expect(page).toHaveURL(/\/log/);
    const url = new URL(page.url());
    expect(url.searchParams.get('filterPassageStartVerseId')).toBe(String(verseId(BOOK.GENESIS, 1, 1)));
    expect(url.searchParams.get('filterPassageEndVerseId')).toBe(String(verseId(BOOK.GENESIS, 1, chapterVerseCount(BOOK.GENESIS, 1))));
  });
});
