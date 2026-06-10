import { test, expect } from '../../fixtures';
import { seedLogEntries, getLogEntries } from '../../helpers/seed';
import { chapterRange, BOOK } from '../../helpers/passages';
import { today } from '../../helpers/dates';

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
});
