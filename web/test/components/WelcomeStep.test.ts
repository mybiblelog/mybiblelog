// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import WelcomeStep from '~/components/forms/settings/WelcomeStep.vue';
import { useUserSettingsStore } from '~/stores/user-settings';

// `handleSkip` only navigates to /today when the settings save actually
// succeeds; a silent failure should leave the user on the wizard so they don't
// lose track of the fact their skip didn't take.

const updateSettings = vi.fn();

vi.mock('~/stores/user-settings', () => ({
  useUserSettingsStore: vi.fn(),
}));

let routerPush: ReturnType<typeof vi.fn>;

function mountForm() {
  return mount(WelcomeStep, {
    global: { stubs: { teleport: true } },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  updateSettings.mockReset();
  vi.mocked(useUserSettingsStore).mockReturnValue({ updateSettings } as unknown as ReturnType<typeof useUserSettingsStore>);
  routerPush = vi.fn();
  vi.stubGlobal('useRouter', () => ({ push: routerPush, replace: vi.fn(), back: vi.fn() }));
});

describe('WelcomeStep', () => {
  it('navigates to /today when the skip save succeeds', async () => {
    updateSettings.mockResolvedValue(true);
    const wrapper = mountForm();

    await wrapper.get('[data-testid="welcome-skip"]').trigger('click');

    expect(updateSettings).toHaveBeenCalledWith({ startPage: 'today' });
    expect(routerPush).toHaveBeenCalledWith('/today');
  });

  it('stays put when the skip save fails', async () => {
    updateSettings.mockResolvedValue(false);
    const wrapper = mountForm();

    await wrapper.get('[data-testid="welcome-skip"]').trigger('click');

    expect(updateSettings).toHaveBeenCalledWith({ startPage: 'today' });
    expect(routerPush).not.toHaveBeenCalled();
  });
});
