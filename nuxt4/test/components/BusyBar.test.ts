// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BusyBar from '~/components/ui/BusyBar.vue';

describe('BusyBar', () => {
  it('is not busy by default styling when busy=false', () => {
    const wrapper = mount(BusyBar, { props: { busy: false } });
    expect(wrapper.get('.busy-bar').classes()).not.toContain('is-busy');
  });

  it('adds the is-busy class when busy=true', () => {
    const wrapper = mount(BusyBar, { props: { busy: true } });
    expect(wrapper.get('.busy-bar').classes()).toContain('is-busy');
  });

  it('reacts to the busy prop changing', async () => {
    const wrapper = mount(BusyBar, { props: { busy: false } });
    await wrapper.setProps({ busy: true });
    expect(wrapper.get('.busy-bar').classes()).toContain('is-busy');
  });
});
