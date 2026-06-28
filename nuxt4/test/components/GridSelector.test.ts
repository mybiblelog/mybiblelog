// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GridSelector from '~/components/forms/GridSelector.vue';

const options = [
  { label: 'One', value: 1 },
  { label: 'Two', value: 2 },
  { label: 'Three', value: 3 },
];

describe('GridSelector', () => {
  it('renders an option per entry', () => {
    const wrapper = mount(GridSelector, { props: { options } });
    const cells = wrapper.findAll('.grid-selector--option');
    expect(cells).toHaveLength(3);
    expect(cells.map(c => c.text())).toEqual(['One', 'Two', 'Three']);
  });

  it('emits selection with the option value on click', async () => {
    const wrapper = mount(GridSelector, { props: { options } });
    await wrapper.findAll('.grid-selector--option')[1].trigger('click');
    expect(wrapper.emitted('selection')).toEqual([[2]]);
  });

  it('uses the columns prop in the grid template', () => {
    const wrapper = mount(GridSelector, { props: { options, columns: 4 } });
    expect(wrapper.get('.grid-selector').attributes('style')).toContain('repeat(4,');
  });

  it('renders nothing with no options', () => {
    const wrapper = mount(GridSelector);
    expect(wrapper.findAll('.grid-selector--option')).toHaveLength(0);
  });
});
