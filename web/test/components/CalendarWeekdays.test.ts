// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CalendarWeekdays from '~/components/calendar/CalendarWeekdays.vue';

describe('CalendarWeekdays', () => {
  it('renders the seven localized short weekday names', () => {
    const wrapper = mount(CalendarWeekdays);
    const days = wrapper.findAll('li');
    expect(days).toHaveLength(7);
    // useI18n is stubbed to locale 'en' → Intl short weekday names.
    const names = days.map(d => d.text()).sort();
    expect(names).toEqual(['Fri', 'Mon', 'Sat', 'Sun', 'Thu', 'Tue', 'Wed']);
  });
});
