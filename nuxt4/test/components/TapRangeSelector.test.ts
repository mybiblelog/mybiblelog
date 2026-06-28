// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';

describe('TapRangeSelector', () => {
  it('renders one option per value in [min, max]', () => {
    const wrapper = mount(TapRangeSelector, { props: { min: 1, max: 5 } });
    const options = wrapper.findAll('.tap-range-selector--option');
    expect(options).toHaveLength(5);
    expect(options.map(o => o.text())).toEqual(['1', '2', '3', '4', '5']);
  });

  it('single mode emits an equal from/to on a single tap', async () => {
    const wrapper = mount(TapRangeSelector, { props: { max: 5, multi: false } });
    await wrapper.findAll('.tap-range-selector--option')[2].trigger('click'); // options are 0..5, index 2 => value 2
    expect(wrapper.emitted('selection')).toEqual([[{ from: 2, to: 2 }]]);
  });

  it('multi mode emits a sorted range after two taps', async () => {
    const wrapper = mount(TapRangeSelector, { props: { min: 1, max: 9, multi: true } });
    const options = wrapper.findAll('.tap-range-selector--option');
    await options[4].trigger('click'); // value 5 — start, no emit yet
    expect(wrapper.emitted('selection')).toBeUndefined();
    await options[1].trigger('click'); // value 2 — end
    expect(wrapper.emitted('selection')).toEqual([[{ from: 2, to: 5 }]]);
  });
});
