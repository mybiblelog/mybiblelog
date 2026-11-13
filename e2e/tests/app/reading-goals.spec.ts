import { test, expect } from '../../fixtures';
import { seedLogEntries, seedReadingGoal, setSettings } from '../../helpers/seed';
import { BOOK, bookRange, chapterRange, chapterVerseCount, verseId } from '../../helpers/passages';
import { daysAgo, daysFromNow, today } from '../../helpers/dates';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Reading goals', () => {
  test('user creates a custom goal, completes it, and sees it on Today and the goal page', async ({ page, api }) => {
    await setSettings(api, { dailyVerseCountGoal: 10 });

    await page.goto('/goals');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goals-empty')).toBeVisible();
    await page.getByTestId('reading-goal-new').click();
    await page.getByTestId('reading-goal-template-custom').click();

    // Name, books and dates are all on one page.
    await page.getByTestId('reading-goal-title').fill('Jude this week');
    await page.locator('[data-testid="reading-goal-book"][data-book="65"]').check();
    await expect(page.getByTestId('reading-goal-selected-verses')).toContainText('25 verses');

    // Default end date: ceil(25 / 10) = 3 reading days, counting today.
    await expect(page.getByTestId('reading-goal-start-date')).toHaveValue(today());
    await expect(page.getByTestId('reading-goal-end-date')).toHaveValue(daysFromNow(2));
    await expect(page.getByTestId('reading-goal-required-pace')).toHaveText('9 verses a day');
    await page.getByTestId('reading-goal-save').click();

    // Saving lands on the new goal.
    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Jude this week');
    await expect(page.getByTestId('reading-goal-detail-headline')).toHaveText('9 verses to read today');

    // The goal shows on Today; log the whole book to complete it.
    await page.goto('/today');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goals-section').getByRole('heading')).toHaveText('Goals');
    const card = page.getByTestId('reading-goal-card');
    await expect(card.getByTestId('reading-goal-card-title')).toHaveText('Jude this week');
    await expect(card.getByTestId('reading-goal-card-today')).toContainText('0 / 9 verses');
    const nextUp = card.getByTestId('reading-goal-card-next-up');
    await expect(nextUp.getByTestId('reading-goal-next-up-passage')).toHaveText('Jude');

    // Jude is one chapter, so logging the next-up suggestion completes the goal.
    await nextUp.getByTestId('reading-goal-next-up-log').click();
    await page.getByTestId('log-entry-editor-submit').click();

    await expect(page.getByTestId('achievements-modal')).toContainText('Goal Complete!');
    await expect(page.getByTestId('achievements-modal')).toContainText('Jude this week');
    await page.getByTestId('achievements-ok').click();
    await expect(card.getByTestId('reading-goal-status')).toHaveText('Complete');
    await expect(nextUp).toHaveCount(0);

    await card.getByTestId('reading-goal-card-title').click();
    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Jude this week');
    await expect(page.getByTestId('reading-goal-chart')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-complete')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-average')).toHaveText('25');

    // Finished goals move to their own group on the goals page.
    await page.getByRole('link', { name: 'Goals' }).first().click();
    await expect(page.getByTestId('reading-goals-completed').getByTestId('reading-goal-row-title')).toHaveText('Jude this week');
  });

  test('a template prefills the whole form, and Back returns to the plans', async ({ page }) => {
    await page.goto('/goals/new');
    await waitForHydration(page);
    await page.locator('[data-testid="reading-goal-template"][data-template-id="gospels"]').click();

    await expect(page.getByTestId('reading-goal-title')).toHaveValue('Gospels');
    await expect(page.getByTestId('reading-goal-books-summary')).toHaveText('Matthew, Mark, Luke, John');
    await expect(page.getByTestId('reading-goal-book')).toHaveCount(0);

    await page.goBack();
    await expect(page.getByTestId('reading-goal-plans')).toBeVisible();
    await page.goForward();

    // A length preset sets the goal date.
    await page.locator('[data-testid="reading-goal-preset"][data-preset="1_month"]').click();
    await expect(page.locator('[data-testid="reading-goal-preset"][data-preset="1_month"]')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('reading-goal-save').click();

    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Gospels');
    await page.goto('/goals');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goals-current').getByTestId('reading-goal-card-title')).toHaveText('Gospels');
  });

  test('the form explains what is missing, and editing changes a date in one step', async ({ page, api }) => {
    const goal = await seedReadingGoal(api, {
      title: 'Jude',
      passages: [bookRange(BOOK.JUDE)],
      startDate: today(),
      endDate: today(),
    });

    await page.goto(`/goals/${goal.id}`);
    await waitForHydration(page);
    await page.getByTestId('reading-goal-detail-edit').click();

    await page.getByTestId('reading-goal-title').fill('');
    await page.getByTestId('reading-goal-end-date').fill(daysAgo(1));
    await page.getByTestId('reading-goal-save').click();
    await expect(page.getByTestId('reading-goal-editor')).toContainText('Give your goal a name.');
    await expect(page.getByTestId('reading-goal-date-error')).toHaveText("The goal date can't be before the start date.");

    await page.getByTestId('reading-goal-title').fill('Jude again');
    await page.getByTestId('reading-goal-end-date').fill(daysFromNow(4));
    await page.getByTestId('reading-goal-save').click();

    // Saving returns to the goal, with the new plan length.
    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Jude again');
    await expect(page.getByTestId('reading-goal-detail-plan-days')).toHaveText('Day 1 of 5');
  });

  test('goal page shows status, pace and projected finish from seeded reading', async ({ page, api }) => {
    const goal = await seedReadingGoal(api, {
      title: 'Short letters',
      passages: [bookRange(BOOK.JUDE), bookRange(BOOK.PHILEMON)],
      startDate: daysAgo(1),
      endDate: daysFromNow(3),
    });
    // 10 verses over 2 elapsed days → 5/day → 50 verses take 10 days, 5 past the 5-day plan.
    await seedLogEntries(api, [
      { date: daysAgo(1), startVerseId: verseId(BOOK.JUDE, 1, 1), endVerseId: verseId(BOOK.JUDE, 1, 10) },
    ]);

    await page.goto(`/goals/${goal.id}`);

    await waitForHydration(page);
    // Yesterday's 10 verses met the plan's 10 a day, so today's share is the same again.
    await expect(page.getByTestId('reading-goal-status')).toHaveText('On track');
    await expect(page.getByTestId('reading-goal-detail-headline')).toHaveText('10 verses to read today');
    await expect(page.getByTestId('reading-goal-detail-average')).toHaveText('5');
    await expect(page.getByTestId('reading-goal-detail-projected-finish')).not.toBeEmpty();
    await expect(page.getByTestId('reading-goal-detail-finish-days')).toHaveText('5 days late');
    await expect(page.getByTestId('reading-goal-detail-plan-days')).toHaveText('Day 2 of 5');
    await expect(page.getByTestId('reading-goal-chart-line')).toBeVisible();
    await expect(page.getByTestId('reading-goal-chart-projection')).toBeVisible();
    await expect(page.getByTestId('reading-goal-detail-next-up')).toContainText('Jude 1:11-25');
  });

  test('a goal that has fallen behind says by how much', async ({ page, api }) => {
    await seedReadingGoal(api, {
      title: 'Jude',
      passages: [bookRange(BOOK.JUDE)],
      startDate: daysAgo(3),
      endDate: daysFromNow(1),
    });

    await page.goto('/goals');

    await waitForHydration(page);
    // Five verses a day for three full days, none read.
    await expect(page.getByTestId('reading-goal-status')).toHaveText('3 days behind');
    await expect(page.getByTestId('reading-goal-card-today')).toContainText('0 / 13 verses');
  });

  test('archived goals leave Today and can be restored; deleting requires confirmation', async ({ page, api }) => {
    await seedReadingGoal(api, {
      title: 'Jude',
      passages: [bookRange(BOOK.JUDE)],
      startDate: today(),
      endDate: today(),
    });
    const menuItem = (name: string) => page.getByTestId('action-menu-item').filter({ hasText: name });

    await page.goto('/goals');

    await waitForHydration(page);
    await page.getByTestId('reading-goal-card').getByTestId('action-menu-toggle').click();
    await menuItem('Archive').click();
    await expect(page.getByTestId('reading-goal-card')).toHaveCount(0);
    const archived = page.getByTestId('reading-goals-archived');
    await archived.locator('summary').click();
    await expect(archived.getByTestId('reading-goal-row')).toHaveCount(1);

    await page.goto('/today');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goals')).toHaveCount(0);

    await page.goto('/goals');

    await waitForHydration(page);
    await archived.locator('summary').click();
    await archived.getByTestId('action-menu-toggle').click();
    await menuItem('Restore').click();
    await expect(page.getByTestId('reading-goal-card')).toHaveCount(1);

    await page.getByTestId('reading-goal-card').getByTestId('action-menu-toggle').click();
    await menuItem('Delete').click();
    await page.getByTestId('dialog-cancel').click();
    await expect(page.getByTestId('reading-goal-card')).toHaveCount(1);

    await page.getByTestId('reading-goal-card').getByTestId('action-menu-toggle').click();
    await menuItem('Delete').click();
    await page.getByTestId('dialog-confirm').click();
    await expect(page.getByTestId('reading-goals-empty')).toBeVisible();
  });
});

test.describe('Reading goals with the deuterocanonical setting', () => {
  const outsideCanonNotices = [
    'reading-goal-card-outside-canon',
    'reading-goal-detail-outside-canon',
  ];

  test('goal made with deuterocanonical books on, then the setting is turned off and back on', async ({ page, api }) => {
    await setSettings(api, { includeDeuterocanonical: true });

    // Templates include the deuterocanonical books in canonical order.
    await page.goto('/goals/new');
    await waitForHydration(page);
    await page.locator('[data-testid="reading-goal-template"][data-template-id="old_testament"]').click();
    await expect(page.getByTestId('reading-goal-books-summary')).toContainText('Nehemiah, Tobit, Judith');

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

    await page.goto('/goals');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toContainText('Tobit');

    await page.goto(`/goals/${goal.id}`);

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-detail-books')).toContainText('Tobit');
    // The passage is shown, but it can't be logged while its book is outside the canon.
    await expect(page.getByTestId('reading-goal-detail-next-up')).toContainText('Tobit 14');
    await expect(page.getByTestId('reading-goal-next-up-log')).toHaveCount(0);
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
    await expect(page.getByTestId('reading-goal-detail-next-up').getByTestId('reading-goal-next-up-passage')).toHaveText('Jude');
    await expect(page.getByTestId('reading-goal-detail-outside-canon')).toHaveCount(0);
    await page.goto('/today');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card')).toBeVisible();
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toHaveCount(0);
  });

  test('goal made with the setting off can add deuterocanonical books once it is turned on', async ({ page, api }) => {
    await setSettings(api, { includeDeuterocanonical: false });
    await page.goto('/goals/new');
    await waitForHydration(page);
    await expect(page.locator('[data-testid="reading-goal-template"][data-template-id="deuterocanonical"]')).toHaveCount(0);
    await page.getByTestId('reading-goal-template-custom').click();
    await page.getByTestId('reading-goal-title').fill('Jude');
    await expect(page.getByTestId('reading-goal-book')).toHaveCount(66);
    await expect(page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.TOBIT}"]`)).toHaveCount(0);
    await page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.JUDE}"]`).check();
    await page.getByTestId('reading-goal-save').click();
    await expect(page.getByTestId('reading-goal-detail-title')).toHaveText('Jude');

    await setSettings(api, { includeDeuterocanonical: true });
    await page.goto('/goals');
    await waitForHydration(page);
    // Existing goals are unchanged by the setting.
    await expect(page.getByTestId('reading-goal-card')).toHaveCount(1);
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toHaveCount(0);
    await page.getByTestId('reading-goal-card').getByTestId('action-menu-toggle').click();
    await page.getByTestId('action-menu-item').filter({ hasText: 'Edit' }).click();
    await page.getByTestId('reading-goal-books-toggle').click();
    await expect(page.getByTestId('reading-goal-book')).toHaveCount(77);
    const tobit = page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.TOBIT}"]`);
    await expect(tobit).not.toBeChecked();
    await tobit.check();
    await page.getByTestId('reading-goal-order-toggle').click();
    await expect(page.getByTestId('reading-goal-order')).toContainText('Tobit');
    await page.getByTestId('reading-goal-save').click();

    await expect(page.getByTestId('reading-goal-detail-books')).toContainText('Tobit');
  });

  test('the Deuterocanonical template offers exactly the deuterocanonical books', async ({ page, api }) => {
    await setSettings(api, { includeDeuterocanonical: true });
    await page.goto('/goals/new');
    await waitForHydration(page);
    await page.locator('[data-testid="reading-goal-template"][data-template-id="deuterocanonical"]').click();

    await expect(page.getByTestId('reading-goal-title')).toHaveValue('Deuterocanonical');
    const books = page.getByTestId('reading-goal-books-summary');
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

    await page.goto('/goals');

    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toContainText('Tobit');
    await page.goto(`/goals/${goal.id}/edit`);
    await waitForHydration(page);
    await page.getByTestId('reading-goal-books-toggle').click();

    const tobit = page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.TOBIT}"]`);
    await expect(tobit).toBeChecked();
    await expect(page.locator(`[data-testid="reading-goal-book"][data-book="${BOOK.SIRACH}"]`)).toHaveCount(0);
    await tobit.uncheck();
    await expect(tobit).toBeVisible();
    await tobit.check();
    await expect(tobit).toBeChecked();
    await tobit.uncheck();

    await expect(page.getByTestId('reading-goal-selected-verses')).toContainText('1 book');
    await page.getByTestId('reading-goal-save').click();

    // Saving returns to the goal page.
    await expect(page.getByTestId('reading-goal-detail-books')).toContainText('Jude');
    await expect(page.getByTestId('reading-goal-detail-books')).not.toContainText('Tobit');
    await expect(page.getByTestId('reading-goal-detail-outside-canon')).toHaveCount(0);
    await page.goto('/goals');
    await waitForHydration(page);
    await expect(page.getByTestId('reading-goal-card')).toHaveCount(1);
    await expect(page.getByTestId('reading-goal-card-outside-canon')).toHaveCount(0);
  });
});
