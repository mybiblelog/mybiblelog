// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import * as Vue from 'vue';
import { Bible, bookToPassage } from '@mybiblelog/shared';
import ReadingGoalForm from '~/components/goals/ReadingGoalForm.vue';
import { useReadingGoalsStore, type ReadingGoal } from '~/stores/reading-goals';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useDialogStore } from '~/stores/dialog';

const gospelVerses = [40, 41, 42, 43].reduce((sum, b) => sum + Bible.getBookVerseCount(b), 0);

const mountEditor = (goal?: ReadingGoal) => mount(ReadingGoalForm, {
  props: { goal },
  global: { mocks: { $n: (value: number) => String(value) } },
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T12:00:00'));
  vi.stubGlobal('useI18n', () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    n: (value: number) => String(value),
    locale: Vue.ref('en'),
  }));
  useUserSettingsStore().settings.dailyVerseCountGoal = 100;
});

const testId = (id: string) => `[data-testid="${id}"]`;

const openBooks = (wrapper: ReturnType<typeof mountEditor>) => wrapper.find(testId('reading-goal-books-toggle')).trigger('click');
const value = (wrapper: ReturnType<typeof mountEditor>, id: string) => (wrapper.find(testId(id)).element as HTMLInputElement).value;
const mockCreate = () => vi.spyOn(useReadingGoalsStore(), 'createGoal').mockImplementation(input => Promise.resolve({ id: 'g1', ...input }));
const existing: ReadingGoal = {
  id: 'g1',
  title: 'Existing',
  passages: [bookToPassage(65)],
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  active: false,
};

describe('ReadingGoalForm', () => {
  it('a template opens the whole form prefilled: title, books, and a goal date at the daily goal', async () => {
    const wrapper = mountEditor();
    await wrapper.find('[data-template-id="gospels"]').trigger('click');

    expect(wrapper.emitted('update:plan')).toEqual([['gospels']]);
    expect(wrapper.find(testId('reading-goal-book')).exists()).toBe(false);
    expect(wrapper.find(testId('reading-goal-books-summary')).text()).toBe('Matthew, Mark, Luke, John');
    expect(value(wrapper, 'reading-goal-title')).toBe('template.gospels');
    expect(value(wrapper, 'reading-goal-start-date')).toBe('2026-01-01');
    // The start day is day 1, so N reading days end on January N.
    const days = Math.ceil(gospelVerses / 100);
    expect(value(wrapper, 'reading-goal-end-date')).toBe(new Date(Date.UTC(2026, 0, days)).toISOString().slice(0, 10));
  });

  it('saves a template goal as whole-book passages in canonical order', async () => {
    const createGoal = mockCreate();
    const wrapper = mountEditor();
    await wrapper.find('[data-template-id="gospels"]').trigger('click');
    await wrapper.find('form').trigger('submit');

    expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
      title: 'template.gospels',
      passages: [40, 41, 42, 43].map(bookToPassage),
      startDate: '2026-01-01',
      active: true,
    }));
    expect(wrapper.emitted('saved')).toHaveLength(1);
  });

  it('a plan from the parent skips the picker, and clearing it returns there', async () => {
    const wrapper = mount(ReadingGoalForm, { props: { plan: 'gospels' }, global: { mocks: { $n: (n: number) => String(n) } } });
    expect(wrapper.find(testId('reading-goal-plans')).exists()).toBe(false);
    expect(value(wrapper, 'reading-goal-title')).toBe('template.gospels');

    await wrapper.setProps({ plan: '' });
    expect(wrapper.find(testId('reading-goal-plans')).exists()).toBe(true);
  });

  it('custom goal: books are picked on the same page, with a live total and reorderable order', async () => {
    const createGoal = mockCreate();
    const wrapper = mountEditor();
    await wrapper.find(testId('reading-goal-template-custom')).trigger('click');

    await wrapper.find(testId('reading-goal-title')).setValue('Short letters');
    await wrapper.find('[data-book="65"]').setValue(true);
    await wrapper.find('[data-book="57"]').setValue(true);
    expect(wrapper.find(testId('reading-goal-selected-verses')).text()).toContain('"count":"50"');

    // Default order is canonical (Philemon before Jude); move Jude up.
    await wrapper.find(testId('reading-goal-order-toggle')).trigger('click');
    const items = wrapper.findAll(`${testId('reading-goal-order')} li`);
    expect(items.map(li => li.text())).toEqual([
      expect.stringContaining('Philemon'),
      expect.stringContaining('Jude'),
    ]);
    await items[1]!.findAll('button')[0]!.trigger('click');

    await wrapper.find('form').trigger('submit');
    expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Short letters',
      passages: [bookToPassage(65), bookToPassage(57)],
      // 50 verses at the 100/day goal fit in a single day.
      endDate: '2026-01-01',
    }));
  });

  it('a hand-ordered list gets newly checked books at the end', async () => {
    const createGoal = mockCreate();
    const wrapper = mountEditor();
    await wrapper.find(testId('reading-goal-template-custom')).trigger('click');
    await wrapper.find(testId('reading-goal-title')).setValue('Goal');
    await wrapper.find('[data-book="65"]').setValue(true);
    await wrapper.find('[data-book="57"]').setValue(true);
    await wrapper.find(testId('reading-goal-order-toggle')).trigger('click');
    await wrapper.findAll(`${testId('reading-goal-order')} li`)[1]!.findAll('button')[0]!.trigger('click');
    await wrapper.find('[data-book="40"]').setValue(true);
    await wrapper.find('form').trigger('submit');

    expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
      passages: [65, 57, 40].map(bookToPassage),
    }));
  });

  it('select all and clear act on one testament', async () => {
    const wrapper = mountEditor();
    await wrapper.find(testId('reading-goal-template-custom')).trigger('click');
    await wrapper.find(testId('reading-goal-select-all-new_testament')).trigger('click');
    expect(wrapper.findAll(`${testId('reading-goal-book')}:checked`)).toHaveLength(27);
  });

  it('shows what is missing instead of saving an incomplete goal', async () => {
    const createGoal = mockCreate();
    const wrapper = mountEditor();
    await wrapper.find(testId('reading-goal-template-custom')).trigger('click');
    await wrapper.find('form').trigger('submit');

    expect(createGoal).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('errors.title');
    expect(wrapper.text()).toContain('errors.books');
  });

  it('rejects a goal date before the start date', async () => {
    const createGoal = mockCreate();
    const wrapper = mountEditor();
    await wrapper.find('[data-template-id="gospels"]').trigger('click');
    await wrapper.find(testId('reading-goal-end-date')).setValue('2025-12-31');
    await wrapper.find('form').trigger('submit');

    expect(createGoal).not.toHaveBeenCalled();
    expect(wrapper.find(testId('reading-goal-date-error')).text()).toBe('errors.dates_order');
  });

  it('a length preset sets the goal date, and it then stops following the books', async () => {
    const wrapper = mountEditor();
    await wrapper.find('[data-template-id="gospels"]').trigger('click');
    await wrapper.find('[data-preset="1_month"]').trigger('click');
    expect(value(wrapper, 'reading-goal-end-date')).toBe('2026-01-31');

    await openBooks(wrapper);
    await wrapper.find('[data-book="65"]').setValue(true);
    expect(value(wrapper, 'reading-goal-end-date')).toBe('2026-01-31');

    // Back on the daily-goal preset, the date tracks the books again.
    await wrapper.find('[data-preset="daily_goal"]').trigger('click');
    const days = Math.ceil((gospelVerses + 25) / 100);
    expect(value(wrapper, 'reading-goal-end-date')).toBe(new Date(Date.UTC(2026, 0, days)).toISOString().slice(0, 10));
  });

  it('editing shows every field at once, prefilled, and keeps the goal\'s own dates', async () => {
    const updateGoal = vi.spyOn(useReadingGoalsStore(), 'updateGoal').mockImplementation((id, input) => Promise.resolve({ id, ...input }));
    const wrapper = mountEditor(existing);
    expect(wrapper.find('[data-template-id="gospels"]').exists()).toBe(false);
    expect(value(wrapper, 'reading-goal-title')).toBe('Existing');
    expect(value(wrapper, 'reading-goal-end-date')).toBe('2026-01-10');

    await wrapper.find(testId('reading-goal-end-date')).setValue('2026-02-01');
    await wrapper.find('form').trigger('submit');
    expect(updateGoal).toHaveBeenCalledWith('g1', { ...existing, id: undefined, endDate: '2026-02-01' });
  });

  it('cancel asks before discarding changes, and not when nothing changed', async () => {
    const confirm = vi.spyOn(useDialogStore(), 'confirm').mockResolvedValue(false);
    const wrapper = mountEditor(existing);
    await wrapper.find(testId('reading-goal-cancel')).trigger('click');
    await flushPromises();
    expect(confirm).not.toHaveBeenCalled();
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    await wrapper.find(testId('reading-goal-title')).setValue('Renamed');
    await wrapper.find(testId('reading-goal-cancel')).trigger('click');
    await flushPromises();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  describe('deuterocanonical setting', () => {
    const NEHEMIAH = 16;
    const JUDE = 65;
    const TOBIT = 67;
    const SIRACH = 72;
    const settings = () => useUserSettingsStore().settings;
    const book = (wrapper: ReturnType<typeof mountEditor>, index: number) => wrapper.find(`[data-book="${index}"]`);
    const isChecked = (wrapper: ReturnType<typeof mountEditor>, index: number) =>
      (book(wrapper, index).element as HTMLInputElement).checked;
    const templateVerses = (wrapper: ReturnType<typeof mountEditor>, id: string) =>
      wrapper.find(`[data-template-id="${id}"]`).text();
    const existingGoal = (books: number[]): ReadingGoal => ({
      id: 'g1',
      title: 'Existing',
      passages: books.map(bookToPassage),
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      active: true,
    });
    const startCustom = async (wrapper: ReturnType<typeof mountEditor>) => {
      await wrapper.find(testId('reading-goal-template-custom')).trigger('click');
      await wrapper.find(testId('reading-goal-title')).setValue('Goal');
    };
    const save = (wrapper: ReturnType<typeof mountEditor>) => wrapper.find('form').trigger('submit');
    const mockSave = (action: 'createGoal' | 'updateGoal') => {
      const store = useReadingGoalsStore();
      return action === 'createGoal'
        ? vi.spyOn(store, 'createGoal').mockImplementation(input => Promise.resolve({ id: 'g1', ...input }))
        : vi.spyOn(store, 'updateGoal').mockImplementation((id, input) => Promise.resolve({ id, ...input }));
    };

    it('off: the picker offers only common-canon books', async () => {
      const wrapper = mountEditor();
      await startCustom(wrapper);
      expect(wrapper.findAll(testId('reading-goal-book'))).toHaveLength(66);
      expect(book(wrapper, TOBIT).exists()).toBe(false);
    });

    it('on: the picker offers all 77 books, deuterocanonical ones in canonical position', async () => {
      settings().includeDeuterocanonical = true;
      const wrapper = mountEditor();
      await startCustom(wrapper);
      const books = wrapper.findAll(testId('reading-goal-book')).map(input => Number(input.attributes('data-book')));
      expect(books).toHaveLength(77);
      expect(books[books.indexOf(NEHEMIAH) + 1]).toBe(TOBIT);
    });

    it('on: templates include deuterocanonical books in canonical order', async () => {
      settings().includeDeuterocanonical = true;
      const createGoal = mockSave('createGoal');
      const wrapper = mountEditor();
      await wrapper.find('[data-template-id="wisdom"]').trigger('click');
      await save(wrapper);

      expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
        passages: [18, 19, 20, 21, 22, 71, SIRACH].map(bookToPassage),
      }));
    });

    it('template verse totals follow the setting while the editor is open', async () => {
      const wrapper = mountEditor();
      const commonOnly = templateVerses(wrapper, 'old_testament');
      const nt = templateVerses(wrapper, 'new_testament');
      settings().includeDeuterocanonical = true;
      await wrapper.vm.$nextTick();
      expect(templateVerses(wrapper, 'old_testament')).not.toBe(commonOnly);
      expect(templateVerses(wrapper, 'new_testament')).toBe(nt);
    });

    it('a chosen template keeps its books if the setting changes before saving', async () => {
      settings().includeDeuterocanonical = true;
      const createGoal = mockSave('createGoal');
      const wrapper = mountEditor();
      await wrapper.find('[data-template-id="wisdom"]').trigger('click');
      settings().includeDeuterocanonical = false;
      await wrapper.vm.$nextTick();
      await save(wrapper);

      expect(createGoal).toHaveBeenCalledWith(expect.objectContaining({
        passages: [18, 19, 20, 21, 22, 71, SIRACH].map(bookToPassage),
      }));
    });

    it('turning the setting on mid-edit makes deuterocanonical books selectable', async () => {
      const wrapper = mountEditor();
      await startCustom(wrapper);
      expect(book(wrapper, TOBIT).exists()).toBe(false);
      settings().includeDeuterocanonical = true;
      await wrapper.vm.$nextTick();
      expect(book(wrapper, TOBIT).exists()).toBe(true);
    });

    it('newly added books are ordered canonically, not by index', async () => {
      settings().includeDeuterocanonical = true;
      const wrapper = mountEditor();
      await startCustom(wrapper);
      await book(wrapper, TOBIT).setValue(true);
      await book(wrapper, NEHEMIAH).setValue(true);
      await wrapper.find(testId('reading-goal-order-toggle')).trigger('click');

      const items = wrapper.findAll(`${testId('reading-goal-order')} li`);
      expect(items.map(li => li.text())).toEqual([
        expect.stringContaining('Nehemiah'),
        expect.stringContaining('Tobit'),
      ]);
    });

    it('goal created with the setting off, edited after turning it on: deuterocanonical books are addable', async () => {
      settings().includeDeuterocanonical = true;
      const updateGoal = mockSave('updateGoal');
      const wrapper = mountEditor(existingGoal([JUDE]));
      await openBooks(wrapper);
      expect(isChecked(wrapper, TOBIT)).toBe(false);
      await book(wrapper, TOBIT).setValue(true);
      await save(wrapper);

      expect(updateGoal).toHaveBeenCalledWith('g1', expect.objectContaining({
        // Tobit joins in its canonical place, since the list was still in Bible order.
        passages: [bookToPassage(TOBIT), bookToPassage(JUDE)],
      }));
    });

    it('goal with deuterocanonical books, edited after turning the setting off: they stay listed and checked', async () => {
      const wrapper = mountEditor(existingGoal([JUDE, TOBIT]));
      await openBooks(wrapper);
      expect(isChecked(wrapper, TOBIT)).toBe(true);
      // Other hidden books are still not offered.
      expect(book(wrapper, SIRACH).exists()).toBe(false);
    });

    it('setting off: unchecking a deuterocanonical book keeps it listed so it can be re-checked', async () => {
      const wrapper = mountEditor(existingGoal([JUDE, TOBIT]));
      await openBooks(wrapper);
      await book(wrapper, TOBIT).setValue(false);
      expect(book(wrapper, TOBIT).exists()).toBe(true);
      expect(isChecked(wrapper, TOBIT)).toBe(false);
      await book(wrapper, TOBIT).setValue(true);
      expect(isChecked(wrapper, TOBIT)).toBe(true);
    });

    it('setting off: saving without the deuterocanonical book removes it from the goal', async () => {
      const updateGoal = mockSave('updateGoal');
      const wrapper = mountEditor(existingGoal([JUDE, TOBIT]));
      await openBooks(wrapper);
      await book(wrapper, TOBIT).setValue(false);
      await save(wrapper);

      expect(updateGoal).toHaveBeenCalledWith('g1', expect.objectContaining({ passages: [bookToPassage(JUDE)] }));
    });

    it('setting off: a goal of only deuterocanonical books edits and saves unchanged', async () => {
      const updateGoal = mockSave('updateGoal');
      const wrapper = mountEditor(existingGoal([TOBIT, SIRACH]));
      await openBooks(wrapper);
      expect(isChecked(wrapper, TOBIT)).toBe(true);
      expect(isChecked(wrapper, SIRACH)).toBe(true);
      await save(wrapper);

      expect(updateGoal).toHaveBeenCalledWith('g1', expect.objectContaining({
        passages: [bookToPassage(TOBIT), bookToPassage(SIRACH)],
      }));
    });
  });
});
