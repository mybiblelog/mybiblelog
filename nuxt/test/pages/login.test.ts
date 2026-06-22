// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import { PiniaVuePlugin, setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import LoginPage from '@/pages/login.vue';
import { useAuthStore } from '@/stores/auth';

type AsyncDataComponent = {
  asyncData: (ctx: { app: { $http: { get: (p: string) => Promise<unknown> } } }) => Promise<{ googleOauth2Url: string | null }>;
};

const globalMocks = () => ({
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $terr: (err: unknown) => String(err),
  localePath: (p: string) => p,
  $i18n: { locale: 'en' },
  $route: { query: {} as Record<string, string> },
  $router: { push: vi.fn() },
  $http: { get: vi.fn(), post: vi.fn().mockResolvedValue({}) },
});

const mountLogin = () => {
  const localVue = createLocalVue();
  localVue.use(PiniaVuePlugin);
  const pinia = createTestingPinia({ stubActions: true, createSpy: vi.fn });
  setActivePinia(pinia);

  const mocks = globalMocks();
  const wrapper = shallowMount(LoginPage, {
    localVue,
    pinia,
    mocks,
    stubs: { 'nuxt-link': true },
  } as never);
  return { wrapper, mocks };
};

describe('pages/login.vue — asyncData (guards Workstream C migration)', () => {
  it('returns the Google OAuth2 url on success', async () => {
    const $http = { get: vi.fn().mockResolvedValue({ data: { url: 'https://oauth.example/url' } }) };
    const result = await (LoginPage as unknown as AsyncDataComponent).asyncData({ app: { $http } });
    expect($http.get).toHaveBeenCalledWith('/api/auth/oauth2/google/url');
    expect(result.googleOauth2Url).toBe('https://oauth.example/url');
  });

  it('falls back to null when the request fails', async () => {
    const $http = { get: vi.fn().mockRejectedValue(new Error('boom')) };
    const result = await (LoginPage as unknown as AsyncDataComponent).asyncData({ app: { $http } });
    expect(result.googleOauth2Url).toBeNull();
  });
});

describe('pages/login.vue — render + submit (guards Workstream D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in form', () => {
    const { wrapper } = mountLogin();
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('submitting calls authStore.login with the entered credentials', async () => {
    const { wrapper } = mountLogin();
    await wrapper.setData({ email: 'user@example.com', password: 'secret' });
    await wrapper.find('form').trigger('submit');

    const authStore = useAuthStore();
    expect(authStore.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret' });
  });
});
