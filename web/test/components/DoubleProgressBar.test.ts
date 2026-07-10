// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DoubleProgressBar from '~/components/ui/DoubleProgressBar.vue';

describe('DoubleProgressBar', () => {
  it('sets primary and secondary bar widths from props', () => {
    const wrapper = mount(DoubleProgressBar, { props: { primaryPercentage: 30, secondaryPercentage: 60 } });
    expect(wrapper.get('[data-testid="primary-bar"]').attributes('style')).toContain('width: 30%');
    expect(wrapper.get('[data-testid="secondary-bar"]').attributes('style')).toContain('width: 60%');
  });

  it('does not mark complete below 100%', () => {
    const wrapper = mount(DoubleProgressBar, { props: { primaryPercentage: 99 } });
    expect(wrapper.get('[data-testid="primary-bar-complete"]').classes()).not.toContain('is-complete');
    expect(wrapper.get('[data-testid="double-progress-bar"]').attributes('data-primary-percentage')).toBe('99');
  });

  it('marks complete at or above 100%', () => {
    const wrapper = mount(DoubleProgressBar, { props: { primaryPercentage: 100 } });
    expect(wrapper.get('[data-testid="primary-bar-complete"]').classes()).toContain('is-complete');
  });
});
