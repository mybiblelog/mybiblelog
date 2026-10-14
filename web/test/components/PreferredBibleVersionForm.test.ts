// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { bibleVersionOptions, localeVersionGroups } from '@mybiblelog/shared';
import PreferredBibleVersionForm from '~/components/forms/settings/PreferredBibleVersionForm.vue';
import { useSettingsWizardStep } from '~/composables/useSettingsWizardStep';

// `bibleVersionOptions` re-sorts per-locale so a user's own-language translations
// show up first in the dropdown; that grouping logic (and the validate()/save()
// wiring handed to `useSettingsWizardStep`) had no coverage.

const updateSettings = vi.fn();

vi.mock('~/stores/user-settings', () => ({
  useUserSettingsStore: () => ({ updateSettings }),
}));

const optionValues = (wrapper: ReturnType<typeof mountForm>) =>
  wrapper.findAll('[data-testid="start-bible-version-select"] option')
    .map(option => option.attributes('value'))
    .filter(value => value !== '');

function mountForm() {
  return mount(PreferredBibleVersionForm, {
    global: { stubs: { teleport: true } },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  updateSettings.mockReset();
  // useSettingsWizardStep is a plain composable (no Nuxt-specific deps beyond
  // the toast store), so install the real implementation like the other
  // dependency-free composables in test/setup.ts.
  vi.stubGlobal('useSettingsWizardStep', useSettingsWizardStep);
});

describe('PreferredBibleVersionForm', () => {
  it('sorts the locale group to the top when the current locale has one', () => {
    const koGroup = localeVersionGroups.ko as readonly string[];
    expect(koGroup.length).toBeGreaterThan(0);

    vi.stubGlobal('useI18n', () => ({
      t: (key: string) => key,
      te: () => true,
      locale: ref('ko'),
      locales: ref([]),
    }));

    const wrapper = mountForm();
    const values = optionValues(wrapper);

    expect(values.slice(0, koGroup.length)).toEqual([...koGroup]);
    const rest = values.slice(koGroup.length);
    const expectedRest = bibleVersionOptions.map(o => o.value).filter(v => !koGroup.includes(v));
    expect(rest).toEqual(expectedRest);
  });

  it('preserves the original order for a locale with no group entries', () => {
    vi.stubGlobal('useI18n', () => ({
      t: (key: string) => key,
      te: () => true,
      // Not a key in `localeVersionGroups`, so the group lookup falls back to [].
      locale: ref('not-a-real-locale'),
      locales: ref([]),
    }));

    const wrapper = mountForm();
    const values = optionValues(wrapper);

    expect(values).toEqual(bibleVersionOptions.map(o => o.value));
  });

  it('wires validate() and save() into useSettingsWizardStep', async () => {
    vi.stubGlobal('useI18n', () => ({
      t: (key: string) => key,
      te: () => true,
      locale: ref('en'),
      locales: ref([]),
    }));
    updateSettings.mockResolvedValue(true);

    const wrapper = mountForm();
    const next = wrapper.get('[data-testid="start-bible-next"]');

    // Neither select has a value yet, so validate() should fail and save()
    // should never run.
    await next.trigger('click');
    expect(updateSettings).not.toHaveBeenCalled();

    await wrapper.get('[data-testid="start-bible-version-select"]').setValue('KJV');
    await wrapper.get('[data-testid="start-bible-app-select"]').setValue('BIBLECOM');
    await next.trigger('click');

    expect(updateSettings).toHaveBeenCalledWith({
      preferredBibleVersion: 'KJV',
      preferredBibleApp: 'BIBLECOM',
    });
  });
});
