// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import ThemeSwitcher from '~/components/layout/ThemeSwitcher.vue';
import { useThemeStore } from '~/stores/theme';

// Passthrough modal stub so the option buttons in the content slot render.
const ModalStub = defineComponent({
  name: 'PopupsAppModal',
  setup(_, { slots }) {
    return () => h('div', { class: 'modal-stub' }, [slots.content?.(), slots.footer?.()]);
  },
});

const mountSwitcher = (): VueWrapper =>
  mount(ThemeSwitcher, {
    global: {
      stubs: { PopupsAppModal: ModalStub, SvgSunIcon: true, SvgMoonIcon: true, SvgComputerIcon: true },
    },
  });

beforeEach(() => setActivePinia(createPinia()));

describe('ThemeSwitcher', () => {
  it('renders the toolbar trigger button', () => {
    const wrapper = mountSwitcher();
    expect(wrapper.find('[data-testid="theme-switcher-toolbar-btn"]').exists()).toBe(true);
  });

  it('renders an option per theme mode', () => {
    const wrapper = mountSwitcher();
    expect(wrapper.findAll('.theme-switcher-modal__btn')).toHaveLength(3);
  });

  it('selecting a mode updates the theme store', async () => {
    const wrapper = mountSwitcher();
    const store = useThemeStore();
    // options order is light, dark, system
    await wrapper.findAll('.theme-switcher-modal__btn')[1].trigger('click');
    expect(store.mode).toBe('dark');
  });

  it('marks the active mode option', async () => {
    const wrapper = mountSwitcher();
    const store = useThemeStore();
    store.setMode('light');
    await wrapper.vm.$nextTick();
    const active = wrapper.findAll('.theme-switcher-modal__btn').filter(b => b.classes().includes('theme-switcher-modal__btn--active'));
    expect(active).toHaveLength(1);
  });
});
