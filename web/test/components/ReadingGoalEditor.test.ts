// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import * as Vue from 'vue';
import { Bible, bookToPassage } from '@mybiblelog/shared';
import ReadingGoalEditor from '~/components/goals/ReadingGoalEditor.vue';
import { useReadingGoalsStore, type ReadingGoal } from '~/stores/reading-goals';
import { useUserSettingsStore } from '~/stores/user-settings';

const gospelVerses = [40, 41, 42, 43].reduce((sum, b) => sum + Bible.getBookVerseCount(b), 0);

const mountEditor = (goal?: ReadingGoal) => mount(ReadingGoalEditor, {
  props: { goal },
  global: { mocks: { $n: (value: number) => String(value) } },
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T12:00:00'));
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    n: (value: number) => String(value),
    locale: Vue.ref('en'),
  }));
  useUserSettingsStore().settings.dailyVerseCountGoal = 100;
});

const testId = (id: string) => `[data-testid="${id}"]`;

describe('ReadingGoalEditor', () => {
  it('a template skips straight to the dates step with the title and default end date filled in', async () => {
    const wrapper = mountEditor();
    await wrapper.find('[data-template-id="gospels"]').trigger('click');

    expect(wrapper.find(testId('reading-goal-book')).exists()).toBe(false);
    expect((wrapper.find(testId('reading-goal-title')).element as HTMLInputElement).value).toBe('template.gospels');
    expect((wrapper.find(testId('reading-goal-start-date')).element as HTMLInputElement).value).toBe('2026-01-01');
    // The start day is day 1, so N reading days end on January N.
    const days = Math.ceil(gospelVerses / 100);
    const expectedEnd = new Date(Date.UTC(2026, 0, days)).toISOString().slice(0, 10);
    expect((wrapper.find(testId('reading-goal-end-date')).element as HTMLInputElement).value).toBe(expectedEnd);
  });

  it('saves a template goal as whole-book passages in canonical order', async () => {
    const store = useReadingGoalsStore();
    const createGoal = vi.spyOn(store, 'createGoal').mockImplementation(input => Promise.resolve({ id: 'g1', ...input }));
    const wrapper = mountEditor();
    await wrapper.find('[data-template-id="gospels"]').trigger('click');
    await wrapper.find(testId('reading-goal-save')).trigger('click');

    expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
      title: 'template.gospels',
      passages: [40, 41, 42, 43].map(bookToPassage),
      startDate: '2026-01-01',
      active: true,
    }));
    expect(wrapper.emitted('saved')).toHaveLength(1);
  });

  it('custom flow: name → books (live verse total) → order → dates', async () => {
    const store = useReadingGoalsStore();
    const createGoal = vi.spyOn(store, 'createGoal').mockImplementation(input => Promise.resolve({ id: 'g1', ...input }));
    const wrapper = mountEditor();
    await wrapper.find(testId('reading-goal-template-custom')).trigger('click');

    expect(wrapper.find(testId('reading-goal-next')).attributes('disabled')).toBeDefined();
    await wrapper.find(testId('reading-goal-title')).setValue('Short letters');
    await wrapper.find(testId('reading-goal-next')).trigger('click');

    await wrapper.find('[data-book="65"]').setValue(true);
    await wrapper.find('[data-book="57"]').setValue(true);
    expect(wrapper.find(testId('reading-goal-next')).attributes('disabled')).toBeUndefined();
    await wrapper.find(testId('reading-goal-next')).trigger('click');

    // Default order is canonical (Philemon before Jude); move Jude up.
    const items = wrapper.findAll(`${testId('reading-goal-order')} li`);
    expect(items.map(li => li.text())).toEqual([
      expect.stringContaining('Philemon'),
      expect.stringContaining('Jude'),
    ]);
    await items[1]!.findAll('button')[0]!.trigger('click');
    await wrapper.find(testId('reading-goal-next')).trigger('click');

    await wrapper.find(testId('reading-goal-save')).trigger('click');
    expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Short letters',
      passages: [bookToPassage(65), bookToPassage(57)],
      // 50 verses at the 100/day goal fit in a single day.
      endDate: '2026-01-01',
    }));
  });

  it('editing starts at the name step with the goal prefilled', () => {
    const wrapper = mountEditor({
      id: 'g1',
      title: 'Existing',
      passages: [bookToPassage(65)],
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      active: false,
    });
    expect(wrapper.find('[data-template-id="gospels"]').exists()).toBe(false);
    expect((wrapper.find(testId('reading-goal-title')).element as HTMLInputElement).value).toBe('Existing');
  });
});
