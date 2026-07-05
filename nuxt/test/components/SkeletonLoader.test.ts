// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SkeletonLoader from '@/components/ui/SkeletonLoader.vue';

const mountSkeletonLoader = (propsData = {}) =>
  mount(SkeletonLoader, {
    propsData,
    mocks: { $t: (key: string) => key },
  } as never);

describe('components/ui/SkeletonLoader.vue', () => {
  it('renders a single log-entry placeholder card by default', () => {
    const wrapper = mountSkeletonLoader();
    const cards = wrapper.findAll('.skeleton-loader__card');
    expect(cards).toHaveLength(1);
    expect(cards.at(0).classes()).toContain('skeleton-loader__card--log-entry');
  });

  it('renders the requested number of cards', () => {
    const wrapper = mountSkeletonLoader({ count: 3 });
    expect(wrapper.findAll('.skeleton-loader__card')).toHaveLength(3);
  });

  it('renders the requested variant', () => {
    const wrapper = mountSkeletonLoader({ variant: 'note' });
    expect(wrapper.get('.skeleton-loader__card').classes()).toContain('skeleton-loader__card--note');
  });

  it('announces loading status while hiding placeholder cards from assistive tech', () => {
    const wrapper = mountSkeletonLoader();
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('loading');
    expect(wrapper.get('.skeleton-loader__card').attributes('aria-hidden')).toBe('true');
  });
});
