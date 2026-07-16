import { test, expect } from '../../fixtures';
import { seedLogEntries, seedNote, setSettings } from '../../helpers/seed';
import { verseId, BOOK } from '../../helpers/passages';
import { today } from '../../helpers/dates';

test.describe('Today page', () => {
  test('shows empty state and reading suggestions for a new user', async ({ page }) => {
    await page.goto('/today');
    await expect(page.getByText('No Entries')).toBeVisible();

    const suggestions = page.getByTestId('reading-suggestions').getByRole('listitem');
    await expect(suggestions).toHaveCount(3);
  });

  test('user can add a log entry via the editor modal', async ({ page }) => {
    await page.goto('/today');
    await page.getByRole('button', { name: 'Add Entry' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('log-entry-editor-submit')).toBeDisabled();

    // Typing a reference builds the passage, with book-name autocomplete
    const passageInput = dialog.getByTestId('log-entry-editor-passage');
    await passageInput.fill('Gen');
    await expect(dialog.getByTestId('log-entry-editor-passage-suggestions')).toContainText('Genesis');
    await passageInput.fill('Genesis 1:1-10');

    // Passage preview reflects the selection
    await expect(page.getByTestId('log-entry-editor-preview')).toHaveText(/Genesis 1:1-10/);

    await page.getByTestId('log-entry-editor-submit').click();
    await expect(dialog).not.toBeVisible();

    const entries = page.getByTestId('log-entries');
    await expect(entries.getByTestId('log-entry-passage')).toHaveText(/Genesis 1:1-10/);
    await expect(entries.getByTestId('log-entry-verse-count')).toHaveText(/10 verses/);
  });

  test('progress bar reflects seeded entries against the daily goal', async ({ page, api }) => {
    await setSettings(api, { dailyVerseCountGoal: 100 });
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 25) },
    ]);

    await page.goto('/today');
    const summary = page.getByTestId('daily-goal-summary');
    await expect(summary).toHaveAttribute('data-verses-read', '25');
    await expect(summary).toHaveAttribute('data-goal', '100');
    await expect(page.getByTestId('double-progress-bar')).toHaveAttribute('data-primary-percentage', '25');
  });

  test('user can edit an entry from the action menu', async ({ page, api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
    ]);

    await page.goto('/today');
    const entry = page.getByTestId('log-entries').getByTestId('log-entry').first();
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.mbl-modal__title')).toHaveText('Edit Entry');
    const passageInput = dialog.getByTestId('log-entry-editor-passage');
    await expect(passageInput).toHaveValue('Genesis 1:1-10');
    await passageInput.fill('Genesis 1:1-15');
    await page.getByTestId('log-entry-editor-submit').click();

    await expect(page.getByTestId('log-entries').getByTestId('log-entry-passage')).toHaveText(/Genesis 1:1-15/);
  });

  test('user can delete an entry with cancel and confirm', async ({ page, api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
    ]);

    await page.goto('/today');
    const entries = page.getByTestId('log-entries');
    const entry = entries.getByTestId('log-entry').first();

    // Cancel first
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Delete' }).click();
    await expect(page.getByText('Are you sure you want to delete this entry?')).toBeVisible();
    await page.getByTestId('dialog-cancel').click();
    await expect(entries.getByTestId('log-entry-passage')).toHaveText(/Genesis 1:1-10/);

    // Then confirm
    await entry.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Delete' }).click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByText('No Entries')).toBeVisible();
  });

  test('reading suggestion can be tracked and the list refreshes', async ({ page }) => {
    await page.goto('/today');

    const suggestions = page.getByTestId('reading-suggestions').getByRole('listitem');
    await expect(suggestions).toHaveCount(3);
    const firstSuggestionText = await suggestions.first().textContent();

    // Track the first suggestion: the editor opens pre-filled and valid
    await suggestions.first().getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Log Reading' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('log-entry-editor-submit')).toBeEnabled();
    await page.getByTestId('log-entry-editor-submit').click();
    await expect(dialog).not.toBeVisible();

    // The entry appears and the suggestions list refreshes
    await expect(page.getByTestId('log-entries').getByTestId('log-entry')).toHaveCount(1);
    await expect(suggestions).toHaveCount(3);
    await expect(suggestions.first()).not.toHaveText(firstSuggestionText!);
  });

  test('recent notes section shows seeded notes', async ({ page, api }) => {
    await seedNote(api, {
      content: 'A note about the beginning',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 5) }],
    });

    await page.goto('/today');
    await expect(page.getByTestId('recent-notes')).toContainText('A note about the beginning');
  });
});
