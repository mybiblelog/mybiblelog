// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompletionBar from '~/components/ui/CompletionBar.vue';

describe('CompletionBar', () => {
  it('defaults to 0% width', () => {
    const wrapper = mount(CompletionBar);
    const progress = wrapper.get('.completion-bar--progress');
    expect(progress.attributes('style')).toContain('width: 0%');
    expect(wrapper.get('[data-testid="completion-bar"]').attributes('data-percentage')).toBe('0');
  });

  it('reflects the percentage prop as the progress width', () => {
    const wrapper = mount(CompletionBar, { props: { percentage: 42 } });
    expect(wrapper.get('.completion-bar--progress').attributes('style')).toContain('width: 42%');
    expect(wrapper.get('[data-testid="completion-bar"]').attributes('data-percentage')).toBe('42');
  });

  it('applies custom colors', () => {
    const wrapper = mount(CompletionBar, {
      props: { percentage: 10, backgroundColor: 'rebeccapurple', foregroundColor: 'gold' },
    });
    expect(wrapper.get('[data-testid="completion-bar"]').attributes('style')).toContain('rebeccapurple');
    expect(wrapper.get('.completion-bar--progress').attributes('style')).toContain('gold');
  });
});
