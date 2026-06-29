import { test, expect } from '../../fixtures';
import { seedNote, seedTag } from '../../helpers/seed';
import { verseId, BOOK } from '../../helpers/passages';

test.describe('Notes page', () => {
  test('user can create a note via the editor modal', async ({ page }) => {
    await page.goto('/notes');
    await page.getByRole('button', { name: 'New' }).click();

    const editor = page.getByTestId('note-editor');
    await expect(editor).toBeVisible();
    await expect(page.getByTestId('note-editor-submit')).toBeDisabled();

    await page.getByTestId('note-editor-content').fill('My first note from the e2e suite');
    await expect(page.getByTestId('note-editor-submit')).toBeEnabled();
    await page.getByTestId('note-editor-submit').click();

    await expect(page.getByTestId('passage-note').first()).toContainText('My first note from the e2e suite');
  });

  test('seeded note shows its passage and tag', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'Creation', color: '#22aa66' });
    await seedNote(api, {
      content: 'In the beginning',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 5) }],
      tags: [tag.id],
    });

    await page.goto('/notes');
    const note = page.getByTestId('passage-note').first();
    await expect(note.getByTestId('passage-note-content')).toContainText('In the beginning');
    await expect(note.getByTestId('passage-note-passages')).toContainText('Genesis 1:1-5');
    await expect(note.getByTestId('passage-note-tags')).toContainText('Creation');
  });

  test('user can edit a note', async ({ page, api }) => {
    await seedNote(api, { content: 'Original content', passages: [] });

    await page.goto('/notes');
    const note = page.getByTestId('passage-note').first();
    await note.getByRole('button', { name: 'Edit' }).click();

    await page.getByTestId('note-editor-content').fill('Updated content');
    await page.getByTestId('note-editor-submit').click();

    await expect(page.getByTestId('passage-note').first()).toContainText('Updated content');
  });

  test('search text filter narrows results', async ({ page, api }) => {
    await seedNote(api, { content: 'Alpha note about creation', passages: [] });
    await seedNote(api, { content: 'Beta note about exodus', passages: [] });

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-search').fill('exodus');
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Beta note about exodus');
  });

  test('tag filter narrows results', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'Favorites', color: '#dd3344' });
    await seedNote(api, { content: 'Tagged note', passages: [], tags: [tag.id] });
    await seedNote(api, { content: 'Untagged note', passages: [] });

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-choose-tags').click();
    await page.getByRole('dialog').getByText('Favorites').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Tagged note');
  });

  test('results paginate past the page size', async ({ page, api }) => {
    for (let i = 1; i <= 12; i++) {
      await seedNote(api, { content: `Bulk note ${i}`, passages: [] });
    }

    await page.goto('/notes');
    // Default page size is 10
    await expect(page.getByTestId('passage-note')).toHaveCount(10);

    await page.getByRole('button', { name: 'Next' }).first().click();
    await expect(page.getByTestId('passage-note')).toHaveCount(2);
  });

  test('user can delete a note with confirmation', async ({ page, api }) => {
    await seedNote(api, { content: 'Doomed note', passages: [] });

    await page.goto('/notes');
    const note = page.getByTestId('passage-note').first();
    await note.getByRole('button', { name: 'Delete' }).click();
    await page.getByTestId('dialog-confirm').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(0);
  });

  test('tag matching "all" requires every selected tag', async ({ page, api }) => {
    const alpha = await seedTag(api, { label: 'Alpha', color: '#22aa66' });
    const beta = await seedTag(api, { label: 'Beta', color: '#dd3344' });
    await seedNote(api, { content: 'Has both tags', passages: [], tags: [alpha.id, beta.id] });
    await seedNote(api, { content: 'Has only alpha', passages: [], tags: [alpha.id] });

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-choose-tags').click();
    await page.getByRole('dialog').getByText('Alpha').click();
    await page.getByRole('dialog').getByText('Beta').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
    await sidebar.getByTestId('notes-query-tag-match-all').check();
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Has both tags');
  });

  test('tag matching "exact" matches the precise tag set', async ({ page, api }) => {
    const alpha = await seedTag(api, { label: 'Alpha', color: '#22aa66' });
    const beta = await seedTag(api, { label: 'Beta', color: '#dd3344' });
    await seedNote(api, { content: 'Has both tags', passages: [], tags: [alpha.id, beta.id] });
    await seedNote(api, { content: 'Has only alpha', passages: [], tags: [alpha.id] });

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-choose-tags').click();
    await page.getByRole('dialog').getByText('Alpha', { exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
    await sidebar.getByTestId('notes-query-tag-match-exact').check();
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Has only alpha');
  });

  test('"only untagged notes" filter narrows to untagged notes', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'Favorites', color: '#dd3344' });
    await seedNote(api, { content: 'Tagged note', passages: [], tags: [tag.id] });
    await seedNote(api, { content: 'Untagged note', passages: [] });

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-only-untagged').check();
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Untagged note');
  });

  test('passage filter narrows to notes in the range', async ({ page, api }) => {
    await seedNote(api, {
      content: 'Genesis note',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 5) }],
    });
    await seedNote(api, {
      content: 'John note',
      passages: [{ startVerseId: verseId(BOOK.JOHN, 3, 16), endVerseId: verseId(BOOK.JOHN, 3, 16) }],
    });

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    const sidebar = page.locator('.notes-page__sidebar');
    const passageInput = sidebar.getByTestId('notes-query-passage');
    await passageInput.fill('Genesis 1:1-31');
    await passageInput.blur();
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Genesis note');
  });

  test('passage matching exclusive only matches contained notes', async ({ page, api }) => {
    await seedNote(api, {
      content: 'Within chapter one',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 5) }],
    });
    await seedNote(api, {
      content: 'Crosses into chapter two',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 2, 5) }],
    });

    await page.goto('/notes');
    const sidebar = page.locator('.notes-page__sidebar');
    const passageInput = sidebar.getByTestId('notes-query-passage');
    await passageInput.fill('Genesis 1:1-31');
    await passageInput.blur();

    // Inclusive (default) matches any overlap → both notes.
    await sidebar.getByTestId('notes-query-apply').click();
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    // Exclusive matches only notes fully contained in the filter range.
    await sidebar.getByTestId('notes-query-passage-match-exclusive').check();
    await sidebar.getByTestId('notes-query-apply').click();
    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Within chapter one');
  });

  test('sort order can be reversed to oldest first', async ({ page, api }) => {
    await seedNote(api, { content: 'First seeded note', passages: [] });
    await seedNote(api, { content: 'Second seeded note', passages: [] });

    await page.goto('/notes');
    // Newest first (default): the second note appears on top.
    await expect(page.getByTestId('passage-note').first()).toContainText('Second seeded note');

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-sort-oldest').check();
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note').first()).toContainText('First seeded note');
  });

  test('page size can be increased to show more notes', async ({ page, api }) => {
    for (let i = 1; i <= 12; i++) {
      await seedNote(api, { content: `Bulk note ${i}`, passages: [] });
    }

    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(10);

    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-page-size').selectOption('20');
    await sidebar.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(12);
  });

  test('reset clears applied view options', async ({ page, api }) => {
    await seedNote(api, { content: 'Alpha note about creation', passages: [] });
    await seedNote(api, { content: 'Beta note about exodus', passages: [] });

    await page.goto('/notes');
    const sidebar = page.locator('.notes-page__sidebar');
    await sidebar.getByTestId('notes-query-search').fill('exodus');
    await sidebar.getByTestId('notes-query-apply').click();
    await expect(page.getByTestId('passage-note')).toHaveCount(1);

    await page.getByTestId('notes-query-reset-sidebar').click();
    await expect(page.getByTestId('passage-note')).toHaveCount(2);
  });

  test('mobile users can filter via the view options modal', async ({ page, api }) => {
    await seedNote(api, { content: 'Alpha note about creation', passages: [] });
    await seedNote(api, { content: 'Beta note about exodus', passages: [] });

    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/notes');
    await expect(page.getByTestId('passage-note')).toHaveCount(2);

    await page.getByTestId('notes-mobile-query-open').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByTestId('notes-query-search').fill('exodus');
    await dialog.getByTestId('notes-query-apply').click();

    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('Beta note about exodus');
  });
});
