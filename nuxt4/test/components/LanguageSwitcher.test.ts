// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import LanguageSwitcher from '~/components/layout/LanguageSwitcher.vue';
import { useAuthStore } from '~/stores/auth';
import { useUserSettingsStore } from '~/stores/user-settings';

const ModalStub = defineComponent({
  name: 'PopupsAppModal',
  setup(_, { slots }) {
    return () => h('div', { class: 'modal-stub' }, [slots.content?.()]);
  },
});

let setLocale: ReturnType<typeof vi.fn>;

function mountSwitcher() {
  setLocale = vi.fn();
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('en'),
    locales: ref([
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
    ]),
    setLocale,
  }));
  return mount(LanguageSwitcher, {
    global: { stubs: { PopupsAppModal: ModalStub, SvgTranslatorIcon: true } },
  });
}

beforeEach(() => setActivePinia(createPinia()));

describe('LanguageSwitcher', () => {
  it('lists the available locales', () => {
    const wrapper = mountSwitcher();
    const links = wrapper.findAll('.language-switcher-modal__btn');
    expect(links).toHaveLength(2);
    expect(links.map(l => l.text())).toEqual(['English', 'Deutsch']);
  });

  it('bolds the currently active locale', () => {
    const wrapper = mountSwitcher();
    expect(wrapper.get('.language-switcher-modal__btn strong').text()).toBe('English');
  });

  it('selecting a locale calls setLocale and skips settings when logged out', async () => {
    const wrapper = mountSwitcher();
    const settings = useUserSettingsStore();
    const updateSpy = vi.spyOn(settings, 'updateSettings');

    await wrapper.findAll('.language-switcher-modal__btn')[1].trigger('click');

    expect(setLocale).toHaveBeenCalledWith('de');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('persists the locale to settings when logged in', async () => {
    const wrapper = mountSwitcher();
    const auth = useAuthStore();
    auth.setUser({ email: 'a@b.com' });
    const settings = useUserSettingsStore();
    const updateSpy = vi.spyOn(settings, 'updateSettings').mockResolvedValue(true);

    await wrapper.findAll('.language-switcher-modal__btn')[1].trigger('click');
    await wrapper.vm.$nextTick();

    expect(setLocale).toHaveBeenCalledWith('de');
    expect(updateSpy).toHaveBeenCalledWith({ locale: 'de' });
  });
});
