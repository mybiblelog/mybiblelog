// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SunIcon from '~/components/svg/SunIcon.vue';
import MoonIcon from '~/components/svg/MoonIcon.vue';
import StarIcon from '~/components/svg/StarIcon.vue';
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';

describe('svg icon components', () => {
  it('render an <svg> with default dimensions and currentColor fill', () => {
    for (const Icon of [SunIcon, MoonIcon, StarIcon, CheckmarkIcon]) {
      const wrapper = mount(Icon);
      const svg = wrapper.get('svg');
      expect(svg.attributes('width')).toBe('24px');
      expect(svg.attributes('height')).toBe('24px');
    }
  });

  it('forwards width/height/fill props', () => {
    const wrapper = mount(SunIcon, { props: { width: '10px', height: '12px', fill: 'gold' } });
    const svg = wrapper.get('svg');
    expect(svg.attributes('width')).toBe('10px');
    expect(svg.attributes('height')).toBe('12px');
    expect(wrapper.html()).toContain('gold');
  });

  it('only marks the checkmark path for drawing when asked', () => {
    const drawClass = 'checkmark-icon__path--draw';
    expect(mount(CheckmarkIcon).get('path').classes()).not.toContain(drawClass);
    expect(mount(CheckmarkIcon, { props: { draw: true } }).get('path').classes()).toContain(drawClass);
  });
});
