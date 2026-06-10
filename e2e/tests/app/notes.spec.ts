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
});
