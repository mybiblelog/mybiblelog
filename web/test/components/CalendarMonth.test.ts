// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CalendarMonth from '~/components/calendar/CalendarMonth.vue';

const mountMonth = () =>
  mount(CalendarMonth, {
    props: {
      getDateVerseCounts: () => ({ total: 0, unique: 0 }),
      dailyVerseCountGoal: 10,
    },
    global: {
      // Header sub-widgets are out of scope for this test.
      stubs: { CalendarDateIndicator: true, CalendarDateSelector: true },
    },
  });

describe('CalendarMonth', () => {
  it('renders the weekday header and a full grid of day cells', () => {
    const wrapper = mountMonth();
    expect(wrapper.find('.day-of-week').exists()).toBe(true);
    const cells = wrapper.findAll('[data-testid="calendar-day"]');
    // A month grid is padded to whole weeks: 4-6 weeks * 7 days.
    expect(cells.length).toBeGreaterThanOrEqual(28);
    expect(cells.length % 7).toBe(0);
  });

  it('emits daySelected when a current-month day is clicked', async () => {
    const wrapper = mountMonth();
    const currentMonthDay = wrapper
      .findAll('[data-testid="calendar-day"]')
      .find(c => c.attributes('data-current-month') === 'true');
    expect(currentMonthDay).toBeTruthy();

    await currentMonthDay!.trigger('click');

    const emitted = wrapper.emitted('daySelected');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toBe(currentMonthDay!.attributes('data-date'));
  });
});
