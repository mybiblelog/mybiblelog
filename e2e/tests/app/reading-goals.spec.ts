import { test, expect } from '../../fixtures';
import { seedLogEntries, seedReadingGoal, setSettings } from '../../helpers/seed';
import { BOOK, bookRange, chapterRange, chapterVerseCount, verseId } from '../../helpers/passages';
import { daysAgo, today } from '../../helpers/dates';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Reading goals', () => {
  test('user creates a custom goal, completes it, and sees it on Today and the detail page', async ({ page, api }) => {
    await setSettings(api, { dailyVerseCountGoal: 10 });

    await page.goto('/settings/goals');

    await waitForHydration(page);
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
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goals-section').getByRole('heading')).toHaveText('Goals');
    const card = page.getByTestId('reading-goal-card');
    await expect(card.getByTestId('reading-goal-card-title')).toHaveText('Jude this week');
    const nextUp = card.getByTestId('reading-goal-card-next-up');
    await expect(nextUp.getByTestId('log-entry-passage')).toHaveText('Jude');

    // Jude is one chapter, so logging the next-up suggestion completes the goal.
    await nextUp.getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Log Reading' }).click();
    await page.getByTestId('log-entry-editor-submit').click();

    await expect(page.getByTestId('achievements-modal')).toContainText('Goal Complete!');
    await expect(page.getByTestId('achievements-modal')).toContainText('Jude this week');
    await page.getByTestId('achievements-ok').click();
    await expect(card.getByTestId('reading-goal-card-complete')).toBeVisible();

    await expect(nextUp).toHaveCount(0);

    await card.getByTestId('reading-goal-card-title').click();
    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Jude this week');
    await expect(page.getByTestId('reading-goal-chart')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-complete')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-average')).toHaveText('25');
  });

  test('a template skips naming and book selection', async ({ page }) => {
    await page.goto('/settings/goals?new');
    await waitForHydration(page);
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

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-detail-average')).toHaveText('5');
    await expect(page.getByTestId('reading-goal-detail-projected-finish')).not.toBeEmpty();
    await expect(page.getByTestId('reading-goal-detail-finish-days')).toHaveText('10 days');
    await expect(page.getByTestId('reading-goal-detail-plan-days')).toHaveText('Day 2 / 2');
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

    await waitForHydration(page);
    await page.getByTestId('reading-goal-active-toggle').uncheck();
    await expect(page.getByTestId('reading-goals-empty')).toBeVisible();
    await page.getByTestId('reading-goals-tab-inactive').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(1);

    await page.goto('/today');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goals')).toHaveCount(0);

    await page.goto('/settings/goals');

    await waitForHydration(page);
    await page.getByTestId('reading-goals-tab-inactive').click();
    await page.getByTestId('reading-goal-delete').click();
    await page.getByTestId('dialog-cancel').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(1);

    await page.getByTestId('reading-goal-delete').click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(0);
  });
});

test.describe('Reading goals with the deuterocanonical setting', () => {
  const outsideCanonNotices = [
    'reading-goal-card-outside-canon',
    'reading-goal-row-outside-canon',
    'reading-goal-detail-outside-canon',
  ];

  test('goal made with deuterocanonical books on, then the setting is turned off and back on', async ({ page, api }) => {
    await setSettings(api, { includeDeuterocanonical: true });

    // Templates include the deuterocanonical books in canonical order.
    await page.goto('/settings/goals?new');
    await waitForHydration(page);
    await page.locator('[data-testid="reading-goal-template"][data-template-id="old_testament"]').click();
    await expect(page.getByTestId('reading-goal-template-books')).toContainText('Nehemiah, Tobit, Judith');
    await page.getByTestId('reading-goal-cancel').click();

    const goal = await seedReadingGoal(api, {
      title: 'Tobit',
      passages: [bookRange(BOOK.TOBIT)],
      startDate: daysAgo(1),
      endDate: today(),
    });
    // Everything but the last chapter is already read.
    await seedLogEntries(api, Array.from({ length: 13 }, (_, i) => ({ date: daysAgo(1), ...chapterRange(BOOK.TOBIT, i + 1) })));

    await setSettings(api, { includeDeuterocanonical: false });

    // The goal keeps its book and progress, and every view explains why Tobit can't be logged.
    await page.goto('/today');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toContainText('Tobit');
    await page.getByRole('button', { name: 'Add Entry' }).click();
    await expect(page.getByRole('dialog').getByLabel('Book').locator('option', { hasText: 'Tobit' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.goto('/settings/goals');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-row-outside-canon')).toContainText('Tobit');

    await page.goto(`/goals/${goal.id}`);

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-detail-books')).toContainText('Tobit');
    await expect(page.getByTestId('reading-goal-detail-next-up')).toContainText('Tobit 14');
    await expect(page.getByTestId('reading-goal-detail-outside-canon')).toContainText('Tobit');
    await page.getByTestId('reading-goal-detail-reading-settings').click();
    await expect(page).toHaveURL(/\/settings\/reading$/);

    // Turning the setting back on clears the notice, and logging the rest completes the goal.
    await setSettings(api, { includeDeuterocanonical: true });
    await page.goto('/today');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card')).toBeVisible();
    for (const testId of outsideCanonNotices) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }

    await page.getByRole('button', { name: 'Add Entry' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Book').selectOption('Tobit');
    await dialog.getByLabel('Start Chapter').selectOption('14');
    await dialog.getByLabel('Start Verse').selectOption('1');
    await dialog.getByLabel('End Chapter').selectOption('14');
    await dialog.getByLabel('End Verse').selectOption(String(chapterVerseCount(BOOK.TOBIT, 14)));
    await page.getByTestId('log-entry-editor-submit').click();

    await expect(page.getByTestId('achievements-modal')).toContainText('Goal Complete!');
  });

  test('deuterocanonical books already read count, and no notice shows, after the setting is turned off', async ({ page, api }) => {
    const goal = await seedReadingGoal(api, {
      title: 'Tobit and Jude',
      passages: [bookRange(BOOK.TOBIT), bookRange(BOOK.JUDE)],
      startDate: daysAgo(1),
      endDate: today(),
    });
    await seedLogEntries(api, [{ date: daysAgo(1), ...bookRange(BOOK.TOBIT) }]);
    await setSettings(api, { includeDeuterocanonical: false });

    await page.goto(`/goals/${goal.id}`);

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-detail-next-up').getByTestId('log-entry-passage')).toHaveText('Jude');
    await expect(page.getByTestId('reading-goal-detail-outside-canon')).toHaveCount(0);
    await page.goto('/today');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card')).toBeVisible();
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toHaveCount(0);
  });

  test('goal made with the setting off can add deuterocanonical books once it is turned on', async ({ page, api }) => {
    await setSettings(api, { includeDeuterocanonical: false });
    await page.goto('/settings/goals?new');
    await waitForHydration(page);
    await expect(page.locator('[data-testid="reading-goal-template"][data-template-id="deuterocanonical"]')).toHaveCount(0);
    await page.getByTestId('reading-goal-template-custom').click();
    await page.getByTestId('reading-goal-title').fill('Jude');
    await page.getByTestId('reading-goal-next').click();
    await expect(page.getByTestId('reading-goal-book')).toHaveCount(66);
    await expect(page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.TOBIT}"]`)).toHaveCount(0);
    await page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.JUDE}"]`).check();
    await page.getByTestId('reading-goal-next').click();
    await page.getByTestId('reading-goal-next').click();
    await page.getByTestId('reading-goal-save').click();
    await expect(page.getByTestId('reading-goal-row')).toHaveCount(1);

    await setSettings(api, { includeDeuterocanonical: true });
    await page.goto('/settings/goals');
    await waitForHydration(page);
    // Existing goals are unchanged by the setting.
    await expect(page.getByTestId('reading-goal-row-outside-canon')).toHaveCount(0);
    await page.getByTestId('reading-goal-edit').click();
    await page.getByTestId('reading-goal-next').click();
    await expect(page.getByTestId('reading-goal-book')).toHaveCount(77);
    const tobit = page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.TOBIT}"]`);
    await expect(tobit).not.toBeChecked();
    await tobit.check();
    await page.getByTestId('reading-goal-next').click();
    await expect(page.getByTestId('reading-goal-order')).toContainText('Tobit');
    await page.getByTestId('reading-goal-next').click();
    await page.getByTestId('reading-goal-save').click();

    await page.getByTestId('reading-goal-row-title').click();
    await expect(page.getByTestId('reading-goal-detail-books')).toContainText('Tobit');
  });

  test('the Deuterocanonical template offers exactly the deuterocanonical books', async ({ page, api }) => {
    await setSettings(api, { includeDeuterocanonical: true });
    await page.goto('/settings/goals?new');
    await waitForHydration(page);
    await page.locator('[data-testid="reading-goal-template"][data-template-id="deuterocanonical"]').click();

    await expect(page.getByTestId('reading-goal-title')).toHaveValue('Deuterocanonical');
    const books = page.getByTestId('reading-goal-template-books');
    await expect(books).toContainText('Tobit');
    await expect(books).not.toContainText('Genesis');
  });

  test('editing with the setting off keeps deuterocanonical books re-checkable, and removing them clears the notice', async ({ page, api }) => {
    const goal = await seedReadingGoal(api, {
      title: 'Jude and Tobit',
      passages: [bookRange(BOOK.JUDE), bookRange(BOOK.TOBIT)],
      startDate: today(),
      endDate: today(),
    });
    await setSettings(api, { includeDeuterocanonical: false });

    await page.goto('/settings/goals');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-row-outside-canon')).toContainText('Tobit');
    await page.getByTestId('reading-goal-edit').click();
    await page.getByTestId('reading-goal-next').click();

    const tobit = page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.TOBIT}"]`);
    await expect(tobit).toBeChecked();
    await expect(page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.SIRACH}"]`)).toHaveCount(0);
    await tobit.uncheck();
    await expect(tobit).toBeVisible();
    await tobit.check();
    await expect(tobit).toBeChecked();
    await tobit.uncheck();

    await page.getByTestId('reading-goal-next').click();
    await expect(page.getByTestId('reading-goal-order')).not.toContainText('Tobit');
    await page.getByTestId('reading-goal-next').click();
    await page.getByTestId('reading-goal-save').click();

    await expect(page.getByTestId('reading-goal-row-outside-canon')).toHaveCount(0);
    await page.goto(`/goals/${goal.id}`);
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-detail-books')).not.toContainText('Tobit');
    await expect(page.getByTestId('reading-goal-detail-outside-canon')).toHaveCount(0);
  });
});
