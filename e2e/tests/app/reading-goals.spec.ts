import { test, expect } from '../../fixtures';
import { seedLogEntries, seedReadingGoal, setSettings } from '../../helpers/seed';
import { BOOK, bookRange, verseId } from '../../helpers/passages';
import { daysAgo, today } from '../../helpers/dates';

test.describe('Reading goals', () => {
  test('user creates a custom goal, completes it, and sees it on Today and the detail page', async ({ page, api }) => {
    await setSettings(api, { dailyVerseCountGoal: 10 });

    await page.goto('/settings/goals');
    await page.getByTestId('reading-goal-new').click();
    await page.getByTestId('reading-goal-template-custom').click();

    await page.getByTestId('reading-goal-title').fill('Jude this week');
    await page.getByTestId('reading-goal-next').click();
    await page.locator('[data-testid="reading-goal-book"][data-book="65"]').check();
    await expect(page.getByTestId('reading-goal-selected-verses')).toHaveText('25 verses');
    await page.getByTestId('reading-goal-next').click();
    await expect(page.getByTestId('reading-goal-order')).toContainText('Jude');
    await page.getByTestId('reading-goal-next').click();

    // Default end date: ceil(25 / 10) = 3 reading days, counting today.
    await expect(page.getByTestId('reading-goal-start-date')).toHaveValue(today());
    await expect(page.getByTestId('reading-goal-required-pace')).toContainText('Read 9 verses per day');
    await page.getByTestId('reading-goal-save').click();

    const row = page.getByTestId('reading-goal-row');
    await expect(row).toHaveCount(1);
    await expect(row.getByTestId('reading-goal-row-title')).toHaveText('Jude this week');

    // The goal shows on Today; log the whole book to complete it.
    await page.goto('/today');
    const card = page.getByTestId('reading-goal-card');
    await expect(card.getByTestId('reading-goal-card-title')).toHaveText('Jude this week');
    await expect(card.getByTestId('reading-goal-card-next-up')).toContainText('Jude 1:1-25');

    await page.getByRole('button', { name: 'Add Entry' }).click();
    await page.getByRole('dialog').getByLabel('Book').selectOption('Jude');
    await page.getByTestId('log-entry-editor-submit').click();

    await expect(page.getByTestId('achievements-modal')).toContainText('Goal Complete!');
    await expect(page.getByTestId('achievements-modal')).toContainText('Jude this week');
    await page.getByTestId('achievements-ok').click();
    await expect(card.getByTestId('reading-goal-card-complete')).toBeVisible();

    await card.click();
    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Jude this week');
    await expect(page.getByTestId('reading-goal-chart')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-complete')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-average')).toHaveText('25');
  });

  test('a template skips naming and book selection', async ({ page }) => {
    await page.goto('/settings/goals?new');
    await page.locator('[data-testid="reading-goal-template"][data-template-id="gospels"]').click();

    await expect(page.getByTestId('reading-goal-title')).toHaveValue('Gospels');
    await expect(page.getByTestId('reading-goal-template-books')).toHaveText('Matthew, Mark, Luke, John');
    await expect(page.getByTestId('reading-goal-book')).toHaveCount(0);
    await page.getByTestId('reading-goal-save').click();

    await expect(page.getByTestId('reading-goal-row-title')).toHaveText('Gospels');
  });

  test('detail page shows projected finish and average from seeded reading', async ({ page, api }) => {
    const goal = await seedReadingGoal(api, {
      title: 'Short letters',
      passages: [bookRange(BOOK.JUDE), bookRange(BOOK.PHILEMON)],
      startDate: daysAgo(1),
      endDate: today(),
    });
    // 10 verses over 2 elapsed days → 5/day → 50 verses take 10 days.
    await seedLogEntries(api, [
      { date: daysAgo(1), startVerseId: verseId(BOOK.JUDE, 1, 1), endVerseId: verseId(BOOK.JUDE, 1, 10) },
    ]);

    await page.goto(`/goals/${goal.id}`);
    await expect(page.getByTestId('reading-goal-detail-average')).toHaveText('5');
    await expect(page.getByTestId('reading-goal-detail-projected-finish')).not.toBeEmpty();
    await expect(page.getByTestId('reading-goal-chart-bar')).toHaveCount(2);
    await expect(page.getByTestId('reading-goal-chart-projection')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-next-up')).toContainText('Jude 1:11-25');
  });

  test('inactive goals move tabs and leave Today; deleting requires confirmation', async ({ page, api }) => {
    await seedReadingGoal(api, {
      title: 'Jude',
      passages: [bookRange(BOOK.JUDE)],
      startDate: today(),
      endDate: today(),
    });

    await page.goto('/settings/goals');
    await page.getByTestId('reading-goal-active-toggle').uncheck();
    await expect(page.getByTestId('reading-goals-empty')).toBeVisible();
    await page.getByTestId('reading-goals-tab-inactive').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(1);

    await page.goto('/today');
    await expect(page.getByTestId('reading-goals')).toHaveCount(0);

    await page.goto('/settings/goals');
    await page.getByTestId('reading-goals-tab-inactive').click();
    await page.getByTestId('reading-goal-delete').click();
    await page.getByTestId('dialog-cancel').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(1);

    await page.getByTestId('reading-goal-delete').click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(0);
  });
});
