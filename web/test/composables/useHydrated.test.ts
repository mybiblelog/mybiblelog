// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { useHydrated } from '~/composables/useHydrated';

describe('useHydrated', () => {
  it('is false before mount and true after mounting', () => {
    let beforeMount: boolean | undefined;
    const Host = defineComponent({
      setup(_, { expose }) {
        const hydrated = useHydrated();
        beforeMount = hydrated.value;
        expose({ hydrated });
        return () => h('div');
      },
    });
    const wrapper = mount(Host);
    expect(beforeMount).toBe(false);
    expect((wrapper.vm as unknown as { hydrated: boolean }).hydrated).toBe(true);
  });
});
