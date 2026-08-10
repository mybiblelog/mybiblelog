import { test, expect } from '../../fixtures';
import { seedNote, seedTag } from '../../helpers/seed';

test.describe('Tags page', () => {
  test('user can create a tag via the editor modal', async ({ page }) => {
    await page.goto('/tags');
    await page.getByTestId('tag-new').click();

    await expect(page.getByTestId('tag-editor-submit')).toBeDisabled();
    await page.getByTestId('tag-editor-label').fill('Prophecy');
    await page.getByTestId('tag-editor-color').fill('#3355ff');
    await page.getByTestId('tag-editor-description').fill('Passages about prophecy');
    await expect(page.getByTestId('tag-editor-submit')).toBeEnabled();
    await page.getByTestId('tag-editor-submit').click();

    const tagLine = page.getByTestId('tag-line').first();
    await expect(tagLine.getByTestId('tag-label')).toHaveText('Prophecy');
    await expect(tagLine).toContainText('Passages about prophecy');
  });

  test('user can edit a tag', async ({ page, api }) => {
    await seedTag(api, { label: 'Old Label', color: '#aa0000' });

    await page.goto('/tags');
    await page.getByTestId('tag-line').first().getByTestId('tag-edit').click();
    await page.getByTestId('tag-editor-label').fill('New Label');
    await page.getByTestId('tag-editor-submit').click();

    await expect(page.getByTestId('tag-line').first().getByTestId('tag-label')).toHaveText('New Label');
  });

  test('note count navigates to notes filtered by the tag', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'Wisdom', color: '#119955' });
    await seedNote(api, { content: 'A wise note', passages: [], tags: [tag.id] });
    await seedNote(api, { content: 'An unrelated note', passages: [] });

    await page.goto('/tags');
    const countButton = page.getByTestId('tag-line').first().getByTestId('tag-notes-count');
    await expect(countButton).toHaveAttribute('data-note-count', '1');
    await countButton.click();

    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByTestId('passage-note')).toHaveCount(1);
    await expect(page.getByTestId('passage-note')).toContainText('A wise note');
  });

  test('sort order changes the tag listing', async ({ page, api }) => {
    await seedTag(api, { label: 'Alpha', color: '#111111' });
    // Creation-time sorting needs clearly distinct timestamps
    await new Promise(resolve => setTimeout(resolve, 1100));
    await seedTag(api, { label: 'Zulu', color: '#222222' });

    await page.goto('/tags');
    // Default sort is A-Z
    await expect(page.getByTestId('tag-line').first().getByTestId('tag-label')).toHaveText('Alpha');

    await page.getByTestId('tag-sort-order').selectOption('createdAt:descending');
    await expect(page.getByTestId('tag-line').first().getByTestId('tag-label')).toHaveText('Zulu');
  });

  test('search filters the tag listing on the page', async ({ page, api }) => {
    await seedTag(api, { label: 'Alpha', color: '#111111' });
    await seedTag(api, { label: 'Beta', color: '#222222' });

    await page.goto('/tags');
    await expect(page.getByTestId('tag-line')).toHaveCount(2);

    await page.getByTestId('tag-search').fill('alph');
    await expect(page.getByTestId('tag-line').getByTestId('tag-label')).toHaveText(['Alpha']);

    await page.getByTestId('tag-search').fill('zzz');
    await expect(page.getByTestId('tag-no-matches')).toBeVisible();

    await page.getByTestId('tag-search').fill('');
    await expect(page.getByTestId('tag-line')).toHaveCount(2);
  });

  test('user can delete an unused tag with confirmation', async ({ page, api }) => {
    await seedTag(api, { label: 'Ephemeral', color: '#777777' });

    await page.goto('/tags');
    await page.getByTestId('tag-line').first().getByTestId('tag-delete').click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('tag-line').getByTestId('tag-label')).toHaveCount(0);
  });

  test('a tag in use cannot be deleted', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'InUse', color: '#777777' });
    await seedNote(api, { content: 'Note holding the tag', passages: [], tags: [tag.id] });

    await page.goto('/tags');
    await page.getByTestId('tag-line').first().getByTestId('tag-delete').click();

    // The app refuses with an alert instead of offering a confirmation
    await expect(page.getByTestId('dialog-ok')).toBeVisible();
    await page.getByTestId('dialog-ok').click();
    await expect(page.getByTestId('tag-line').getByTestId('tag-label')).toHaveText('InUse');
  });

  // Regression: the tags store caches the API-computed `noteCount` behind an
  // `isLoaded` flag, and note writes used not to invalidate it. Removing a tag
  // from its last note left /tags showing a stale count and refusing the delete
  // until a full page reload. Everything here stays on a client-side navigation.
  test('note count updates after removing a tag from its only note', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'Solitary', color: '#884499' });
    await seedNote(api, { content: 'The only note with this tag', passages: [], tags: [tag.id] });

    await page.goto('/tags');
    const countButton = page.getByTestId('tag-line').first().getByTestId('tag-notes-count');
    await expect(countButton).toHaveAttribute('data-note-count', '1');

    // Follow the count through to the filtered notes view
    await countButton.click();
    await expect(page).toHaveURL(/\/notes/);
    const note = page.getByTestId('passage-note').first();
    await expect(note).toContainText('The only note with this tag');

    // Remove the tag from the note
    await note.getByRole('button', { name: 'Edit' }).click();
    await page.getByTestId('note-editor-manage-tags').click();
    await page.getByRole('checkbox').first().uncheck();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByTestId('note-editor-submit').click();
    await expect(page.getByTestId('note-editor')).toBeHidden();

    // Back to the tags page without a reload
    await page.goBack();
    await expect(page).toHaveURL(/\/tags/);
    await expect(page.getByTestId('tag-line').first().getByTestId('tag-notes-count'))
      .toHaveAttribute('data-note-count', '0');

    // The freed tag can now be deleted
    await page.getByTestId('tag-line').first().getByTestId('tag-delete').click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('tag-line').getByTestId('tag-label')).toHaveCount(0);
  });
});
