// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CalendarMonthDayItem from '~/components/calendar/CalendarMonthDayItem.vue';

const currentMonthDay = { date: '2026-06-15', isCurrentMonth: true };

describe('CalendarMonthDayItem', () => {
  it('shows the day-of-month label and date data attribute', () => {
    const wrapper = mount(CalendarMonthDayItem, { props: { day: currentMonthDay } });
    expect(wrapper.get('.date').text()).toBe('15');
    expect(wrapper.get('[data-testid="calendar-day"]').attributes('data-date')).toBe('2026-06-15');
  });

  it('renders the progress bar only for current-month days', () => {
    const inMonth = mount(CalendarMonthDayItem, { props: { day: currentMonthDay } });
    expect(inMonth.find('.progress-bar').exists()).toBe(true);

    const outOfMonth = mount(CalendarMonthDayItem, { props: { day: { date: '2026-05-31', isCurrentMonth: false } } });
    expect(outOfMonth.find('.progress-bar').exists()).toBe(false);
    expect(outOfMonth.get('[data-testid="calendar-day"]').classes()).toContain('calendar-day--not-current');
  });

  it('shows an earned star when the primary goal is met', () => {
    const wrapper = mount(CalendarMonthDayItem, { props: { day: currentMonthDay, primaryPercentage: 100 } });
    expect(wrapper.find('.star').exists()).toBe(true);
    expect(wrapper.get('[data-testid="calendar-day"]').attributes('data-goal-met')).toBe('true');
  });

  it('emits daySelected with the date when a current-month day is clicked', async () => {
    const wrapper = mount(CalendarMonthDayItem, { props: { day: currentMonthDay } });
    await wrapper.get('[data-testid="calendar-day"]').trigger('click');
    expect(wrapper.emitted('daySelected')).toEqual([['2026-06-15']]);
  });

  it('does not emit when a non-current-month day is clicked', async () => {
    const wrapper = mount(CalendarMonthDayItem, { props: { day: { date: '2026-05-31', isCurrentMonth: false } } });
    await wrapper.get('[data-testid="calendar-day"]').trigger('click');
    expect(wrapper.emitted('daySelected')).toBeUndefined();
  });
});
