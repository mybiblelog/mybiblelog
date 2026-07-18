// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, computed, nextTick } from 'vue';
import { useClickOutside } from '~/composables/useClickOutside';

const flushAttach = async () => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const mountHost = (onOutside: () => void) => {
  const active = ref(false);
  const targetRef = ref<HTMLElement | null>(null);
  const Host = defineComponent({
    setup() {
      useClickOutside(computed(() => (active.value ? targetRef.value : null)), onOutside);
      return () =>
        h('div', [
          h('div', { ref: targetRef, class: 'inside' }, 'inside'),
          h('div', { class: 'outside' }, 'outside'),
        ]);
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, active };
};

describe('useClickOutside', () => {
  it('does nothing while the target is inactive (null)', async () => {
    const onOutside = vi.fn();
    mountHost(onOutside);
    await flushAttach();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('calls onOutside for a click outside the active target', async () => {
    const onOutside = vi.fn();
    const { wrapper, active } = mountHost(onOutside);
    active.value = true;
    await flushAttach();

    wrapper.get('.outside').element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('does not call onOutside for a click inside the active target', async () => {
    const onOutside = vi.fn();
    const { wrapper, active } = mountHost(onOutside);
    active.value = true;
    await flushAttach();

    wrapper.get('.inside').element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('stops listening once the target goes inactive again', async () => {
    const onOutside = vi.fn();
    const { active } = mountHost(onOutside);
    active.value = true;
    await flushAttach();
    active.value = false;
    await flushAttach();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(onOutside).not.toHaveBeenCalled();
  });
});
