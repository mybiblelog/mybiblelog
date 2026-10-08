// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import dayjs from 'dayjs';
import DailyVerseCountGoalForm from '~/components/forms/settings/DailyVerseCountGoalForm.vue';
import { useSettingsWizardStep } from '~/composables/useSettingsWizardStep';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useToastStore } from '~/stores/toast';

const TOTAL_BIBLE_VERSES = 31102;

// Mirrors the component's internal `getDailyGoalForOption`/date math so
// assertions stay correct regardless of what day the suite runs on.
function daysUntil(option: 'year' | '2years' | '6months') {
  const today = dayjs().startOf('day');
  switch (option) {
  case '2years': return today.add(2, 'year').diff(today, 'day');
  case '6months': return today.add(6, 'month').diff(today, 'day');
  default: return today.add(1, 'year').diff(today, 'day');
  }
}

function dailyGoalFor(option: 'year' | '2years' | '6months') {
  return Math.ceil(TOTAL_BIBLE_VERSES / daysUntil(option));
}

function finishDateFor(option: 'year' | '2years' | '6months') {
  const today = dayjs().startOf('day');
  const target = option === '2years' ? today.add(2, 'year') : option === '6months' ? today.add(6, 'month') : today.add(1, 'year');
  return target.format('YYYY-MM-DD');
}

async function mountForm(props: Record<string, unknown> = {}) {
  const wrapper = mount(DailyVerseCountGoalForm, { props });
  await nextTick();
  return wrapper;
}

function radioFor(wrapper: ReturnType<typeof mount>, value: string) {
  return wrapper.find(`input[type="radio"][value="${value}"]`);
}

function isChecked(wrapper: ReturnType<typeof mount>, value: string) {
  return (radioFor(wrapper, value).element as HTMLInputElement).checked;
}

function ownpaceCard(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('input[type="number"]').element.closest('.option-card') as HTMLElement;
}

function dailyGoalInputValue(wrapper: ReturnType<typeof mount>) {
  return Number((wrapper.find('input[type="number"]').element as HTMLInputElement).value);
}

function dateInputValue(wrapper: ReturnType<typeof mount>) {
  return (wrapper.find('input[type="date"]').element as HTMLInputElement).value;
}

beforeEach(() => {
  setActivePinia(createPinia());
  // Not in the setup.ts default globals list; stub with the real composable
  // (mirrors setup.ts's treatment of other plain, Nuxt-agnostic composables).
  vi.stubGlobal('useSettingsWizardStep', useSettingsWizardStep);
});

describe('DailyVerseCountGoalForm', () => {
  it('defaults to the "year" option with the 1-year daily goal on mount', async () => {
    const wrapper = await mountForm();

    expect(isChecked(wrapper, 'year')).toBe(true);
    expect(dailyGoalInputValue(wrapper)).toBe(dailyGoalFor('year'));
  });

  it('selecting "specific" pre-fills the finish date to the 1-year mark', async () => {
    const wrapper = await mountForm();

    await radioFor(wrapper, 'specific').setValue();

    expect(isChecked(wrapper, 'specific')).toBe(true);
    expect(dateInputValue(wrapper)).toBe(finishDateFor('year'));
  });

  it('editing goalFinishDate while "specific" is selected recalculates the daily goal', async () => {
    const wrapper = await mountForm();
    await radioFor(wrapper, 'specific').setValue();

    const newDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
    await wrapper.find('input[type="date"]').setValue(newDate);

    const expectedDays = dayjs(newDate).startOf('day').diff(dayjs().startOf('day'), 'day');
    const expectedGoal = Math.ceil(TOTAL_BIBLE_VERSES / expectedDays);
    expect(dailyGoalInputValue(wrapper)).toBe(expectedGoal);
  });

  it('selecting "ownpace" keeps the current daily goal and shows a computed finish date', async () => {
    const wrapper = await mountForm();

    await radioFor(wrapper, 'ownpace').setValue();

    expect(isChecked(wrapper, 'ownpace')).toBe(true);
    expect(dailyGoalInputValue(wrapper)).toBe(dailyGoalFor('year'));
    const expectedDate = dayjs().add(Math.ceil(TOTAL_BIBLE_VERSES / dailyGoalFor('year')), 'day').toDate()
      .toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    expect(ownpaceCard(wrapper).textContent).toContain(expectedDate);
  });

  it('editing dailyVerseCountGoal while "ownpace" is selected recalculates the finish date', async () => {
    const wrapper = await mountForm();
    await radioFor(wrapper, 'ownpace').setValue();

    await wrapper.find('input[type="number"]').setValue(100);

    const daysNeeded = Math.ceil(TOTAL_BIBLE_VERSES / 100);
    const expectedDateStr = dayjs().add(daysNeeded, 'day').toDate()
      .toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
    expect(ownpaceCard(wrapper).textContent).toContain(expectedDateStr);
  });

  it('switching back to "year" resets the date and daily goal to the 1-year values', async () => {
    const wrapper = await mountForm();
    await radioFor(wrapper, 'ownpace').setValue();
    await wrapper.find('input[type="number"]').setValue(500);

    await radioFor(wrapper, 'year').setValue();

    expect(dailyGoalInputValue(wrapper)).toBe(dailyGoalFor('year'));
    expect(dateInputValue(wrapper)).toBe(finishDateFor('year'));
  });

  it('ignores a past or empty finish date while "specific" is selected', async () => {
    const wrapper = await mountForm();
    await radioFor(wrapper, 'specific').setValue();

    await wrapper.find('input[type="date"]').setValue(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    expect(dailyGoalInputValue(wrapper)).toBe(dailyGoalFor('year'));

    await wrapper.find('input[type="date"]').setValue('');
    expect(dailyGoalInputValue(wrapper)).toBe(dailyGoalFor('year'));
  });

  describe('initialValue option-guessing heuristic', () => {
    it('guesses "year" when initialValue matches the 1-year pace', async () => {
      const wrapper = await mountForm({ initialValue: 0 });
      const yearGoal = dailyGoalFor('year');

      await wrapper.setProps({ initialValue: yearGoal });
      await nextTick();

      expect(isChecked(wrapper, 'year')).toBe(true);
      expect(dailyGoalInputValue(wrapper)).toBe(yearGoal);
    });

    // The form has no radios for these; the heuristic selects them internally.
    it('guesses the 2-year pace when initialValue matches it', async () => {
      const wrapper = await mountForm({ initialValue: 0 });
      const twoYearGoal = dailyGoalFor('2years');

      await wrapper.setProps({ initialValue: twoYearGoal });
      await nextTick();

      expect(isChecked(wrapper, 'year')).toBe(false);
      expect(isChecked(wrapper, 'ownpace')).toBe(false);
      expect(dateInputValue(wrapper)).toBe(finishDateFor('2years'));
    });

    it('guesses the 6-month pace when initialValue matches it', async () => {
      const wrapper = await mountForm({ initialValue: 0 });
      const sixMonthGoal = dailyGoalFor('6months');

      await wrapper.setProps({ initialValue: sixMonthGoal });
      await nextTick();

      expect(isChecked(wrapper, 'year')).toBe(false);
      expect(isChecked(wrapper, 'ownpace')).toBe(false);
      expect(dateInputValue(wrapper)).toBe(finishDateFor('6months'));
    });

    it('does not change the selected option when initialValue arrives after the user picked one', async () => {
      const wrapper = await mountForm({ initialValue: 0 });
      await radioFor(wrapper, 'ownpace').setValue();

      await wrapper.setProps({ initialValue: dailyGoalFor('2years') });
      await nextTick();

      expect(isChecked(wrapper, 'ownpace')).toBe(true);
      expect(dailyGoalInputValue(wrapper)).toBe(dailyGoalFor('2years'));
    });

    it('guesses "ownpace" when initialValue is far from every computed pace', async () => {
      const wrapper = await mountForm({ initialValue: 0 });

      await wrapper.setProps({ initialValue: 5000 });
      await nextTick();

      expect(isChecked(wrapper, 'ownpace')).toBe(true);
      expect(dailyGoalInputValue(wrapper)).toBe(5000);
    });
  });

  describe('saving', () => {
    async function mountWithSave(result: boolean, props: Record<string, unknown> = {}) {
      const updateSettings = vi.spyOn(useUserSettingsStore(), 'updateSettings').mockResolvedValue(result);
      const wrapper = await mountForm(props);
      return { wrapper, updateSettings };
    }

    async function submit(wrapper: ReturnType<typeof mount>) {
      await wrapper.find('[data-testid="start-goal-next"]').trigger('click');
      await flushPromises();
    }

    it('saves the daily goal, shows a toast, and emits saved + next', async () => {
      const toastAdd = vi.spyOn(useToastStore(), 'add');
      const { wrapper, updateSettings } = await mountWithSave(true);

      await submit(wrapper);

      expect(updateSettings).toHaveBeenCalledWith({ dailyVerseCountGoal: dailyGoalFor('year') });
      expect(wrapper.emitted('saved')).toEqual([[dailyGoalFor('year')]]);
      expect(wrapper.emitted('next')).toHaveLength(1);
      expect(toastAdd).toHaveBeenCalledTimes(1);
    });

    it('skips the toast when showToast is false', async () => {
      const toastAdd = vi.spyOn(useToastStore(), 'add');
      const { wrapper } = await mountWithSave(true, { showToast: false });

      await submit(wrapper);

      expect(toastAdd).not.toHaveBeenCalled();
      expect(wrapper.emitted('next')).toHaveLength(1);
    });

    it.each([0, 1112])('rejects an out-of-range goal (%i) without saving', async (value) => {
      const { wrapper, updateSettings } = await mountWithSave(true);
      await radioFor(wrapper, 'ownpace').setValue();
      await wrapper.find('input[type="number"]').setValue(value);

      await submit(wrapper);

      expect(updateSettings).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('messaging.unable_to_save_daily_verse_count_goal');
      expect(wrapper.emitted('next')).toBeUndefined();
    });

    it('shows an error and does not advance when the save fails', async () => {
      const { wrapper } = await mountWithSave(false);

      await submit(wrapper);

      expect(wrapper.text()).toContain('messaging.unable_to_save_daily_verse_count_goal');
      expect(wrapper.emitted('saved')).toBeUndefined();
      expect(wrapper.emitted('next')).toBeUndefined();
    });
  });

  it('emits previous when the back button is clicked', async () => {
    const wrapper = await mountForm();

    await wrapper.findAll('button')[0].trigger('click');

    expect(wrapper.emitted('previous')).toHaveLength(1);
  });
});
