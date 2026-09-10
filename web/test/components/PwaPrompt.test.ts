// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { reactive, defineComponent, h } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import PwaPrompt from '~/components/ui/PwaPrompt.vue';
import { useAuthStore } from '~/stores/auth';

// Passthrough stub for Nuxt's <ClientOnly> so the prompt's slot content renders.
const ClientOnlyStub = defineComponent({
  name: 'ClientOnly',
  setup(_, { slots }) {
    return () => h('div', slots.default?.());
  },
});

type PwaStub = {
  needRefresh: boolean;
  offlineReady: boolean;
  showInstallPrompt: boolean;
  updateServiceWorker: ReturnType<typeof vi.fn>;
  install: ReturnType<typeof vi.fn>;
  cancelPrompt: ReturnType<typeof vi.fn>;
  cancelInstall: ReturnType<typeof vi.fn>;
};

const makePwa = (state: Partial<PwaStub> = {}): PwaStub => reactive({
  needRefresh: false,
  offlineReady: false,
  showInstallPrompt: false,
  updateServiceWorker: vi.fn(),
  install: vi.fn(),
  cancelPrompt: vi.fn(),
  cancelInstall: vi.fn(),
  ...state,
});

const mountPrompt = (
  pwa: PwaStub | undefined,
  options: { loggedIn?: boolean; contentPage?: boolean } = {},
): VueWrapper => {
  const { loggedIn = true, contentPage = false } = options;
  vi.stubGlobal('useNuxtApp', () => ({ $pwa: pwa }));
  vi.stubGlobal('useRoute', () => ({ query: {}, params: {}, path: '/', fullPath: '/', meta: { contentPage } }));
  useAuthStore().setUser(loggedIn ? { email: 'user@example.test' } : null);
  return mount(PwaPrompt, {
    global: { stubs: { ClientOnly: ClientOnlyStub } },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
});

describe('PwaPrompt', () => {
  it('renders nothing when $pwa is unavailable (SSR / SW not ready)', () => {
    const wrapper = mountPrompt(undefined);
    expect(wrapper.find('[data-testid="pwa-refresh-prompt"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="pwa-install-prompt"]').exists()).toBe(false);
  });

  it('shows the reload prompt and applies the update when needRefresh', async () => {
    const pwa = makePwa({ needRefresh: true });
    const wrapper = mountPrompt(pwa);

    expect(wrapper.find('[data-testid="pwa-refresh-prompt"]').exists()).toBe(true);
    await wrapper.find('[data-testid="pwa-reload"]').trigger('click');
    expect(pwa.updateServiceWorker).toHaveBeenCalledOnce();
  });

  it('shows the install prompt and triggers install', async () => {
    const pwa = makePwa({ showInstallPrompt: true });
    const wrapper = mountPrompt(pwa);

    expect(wrapper.find('[data-testid="pwa-install-prompt"]').exists()).toBe(true);
    await wrapper.find('[data-testid="pwa-install"]').trigger('click');
    expect(pwa.install).toHaveBeenCalledOnce();
  });

  it('prioritizes the update prompt over the install prompt', () => {
    const pwa = makePwa({ needRefresh: true, showInstallPrompt: true });
    const wrapper = mountPrompt(pwa);

    expect(wrapper.find('[data-testid="pwa-refresh-prompt"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pwa-install-prompt"]').exists()).toBe(false);
  });

  it('shows the offline-ready notice and dismisses it', async () => {
    const pwa = makePwa({ offlineReady: true });
    const wrapper = mountPrompt(pwa);

    expect(wrapper.find('[data-testid="pwa-offline-ready"]').exists()).toBe(true);
    await wrapper.find('[data-testid="pwa-offline-dismiss"]').trigger('click');
    expect(pwa.cancelPrompt).toHaveBeenCalledOnce();
  });

  it('prioritizes the offline-ready notice over the install prompt', () => {
    const pwa = makePwa({ offlineReady: true, showInstallPrompt: true });
    const wrapper = mountPrompt(pwa);

    expect(wrapper.find('[data-testid="pwa-offline-ready"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pwa-install-prompt"]').exists()).toBe(false);
  });

  it('hides the offline-ready notice when the user is not authenticated', () => {
    const pwa = makePwa({ offlineReady: true });
    const wrapper = mountPrompt(pwa, { loggedIn: false });

    expect(wrapper.find('[data-testid="pwa-offline-ready"]').exists()).toBe(false);
  });

  it('hides the offline-ready notice on content pages', () => {
    const pwa = makePwa({ offlineReady: true });
    const wrapper = mountPrompt(pwa, { contentPage: true });

    expect(wrapper.find('[data-testid="pwa-offline-ready"]').exists()).toBe(false);
  });
});
