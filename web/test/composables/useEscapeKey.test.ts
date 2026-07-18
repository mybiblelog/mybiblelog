// @vitest-environment happy-dom
// Each test mounts its own tiny harness component to isolate the composable's
// lifecycle (mount/unmount) per case, hence multiple `defineComponent` calls.
/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick } from 'vue';
import { useEscapeKey } from '~/composables/useEscapeKey';

const pressEscape = async () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await nextTick();
};

const pressOtherKey = async () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  await nextTick();
};

describe('useEscapeKey', () => {
  it('fires on Escape when no active ref is given', async () => {
    const onEscape = vi.fn();
    const Host = defineComponent({
      setup() {
        useEscapeKey(onEscape);
        return () => h('div');
      },
    });
    mount(Host);
    await pressEscape();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('ignores non-Escape keys', async () => {
    const onEscape = vi.fn();
    const Host = defineComponent({
      setup() {
        useEscapeKey(onEscape);
        return () => h('div');
      },
    });
    mount(Host);
    await pressOtherKey();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('only fires while isActiveRef is true', async () => {
    const onEscape = vi.fn();
    const active = ref(false);
    const Host = defineComponent({
      setup() {
        useEscapeKey(onEscape, active);
        return () => h('div');
      },
    });
    mount(Host);

    await pressEscape();
    expect(onEscape).not.toHaveBeenCalled();

    active.value = true;
    await pressEscape();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('stops listening after the component unmounts', async () => {
    const onEscape = vi.fn();
    const Host = defineComponent({
      setup() {
        useEscapeKey(onEscape);
        return () => h('div');
      },
    });
    const wrapper = mount(Host);
    wrapper.unmount();
    await pressEscape();
    expect(onEscape).not.toHaveBeenCalled();
  });
});
