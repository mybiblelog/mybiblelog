// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AuthCodeModal from '~/components/popups/AuthCodeModal.vue';
import { useAuthCodeStore } from '~/stores/auth-code';
import { UnknownApiError } from '~/helpers/api-error';

// The verify-email flow drives the modal through the code-entry step and, on a
// full code, auto-submits. That path has no e2e coverage (the e2e web server
// runs with REQUIRE_EMAIL_VERIFICATION=false, so the modal never opens after
// registration), so exercise the modal's own logic here.

type HttpMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

let http: HttpMock;
let routerPush: ReturnType<typeof vi.fn>;

// Point useNuxtApp at a stable $http we can assert on (the default setup stub
// hands out a fresh mock on every call, so the component's copy would differ).
function stubNuxtApp() {
  http = {
    get: vi.fn().mockResolvedValue({ data: { user: { email: 'user@example.com' } } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  };
  routerPush = vi.fn();
  vi.stubGlobal('useNuxtApp', () => ({
    $http: http,
    $terr: (error: unknown) => String(error),
    $i18n: { locale: ref('en'), t: (key: string) => key },
  }));
  vi.stubGlobal('useRouter', () => ({ push: routerPush, replace: vi.fn(), back: vi.fn() }));
}

const mountModal = () =>
  mount(AuthCodeModal, {
    global: {
      stubs: { teleport: true },
      // `$terr` is injected as a template global by the Nuxt plugin, not
      // destructured from useNuxtApp, so it must be provided to the render ctx.
      mocks: { $terr: (error: unknown) => String(error) },
    },
  });

const codeInput = (wrapper: ReturnType<typeof mountModal>) =>
  wrapper.get('[data-testid="auth-code-input"]');

beforeEach(() => {
  setActivePinia(createPinia());
  stubNuxtApp();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AuthCodeModal', () => {
  it('opens on the code step for verify-email (no email step)', () => {
    useAuthCodeStore().open({ flow: 'verify-email', email: 'user@example.com' });
    const wrapper = mountModal();

    expect(wrapper.find('[data-testid="auth-code-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="auth-code-email"]').exists()).toBe(false);
  });

  it('opens on the email step for reset-password', () => {
    useAuthCodeStore().open({ flow: 'reset-password', email: 'user@example.com' });
    const wrapper = mountModal();

    expect(wrapper.find('[data-testid="auth-code-email"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="auth-code-input"]').exists()).toBe(false);
  });

  it('strips non-digits from the code and caps its length at six', async () => {
    useAuthCodeStore().open({ flow: 'verify-email', email: 'user@example.com' });
    const wrapper = mountModal();

    // maxlength enforces the six-digit cap in the DOM; a full six digits would
    // auto-submit, so assert the strip with a shorter value.
    expect(codeInput(wrapper).attributes('maxlength')).toBe('6');
    await codeInput(wrapper).setValue('12ab34');
    expect((codeInput(wrapper).element as HTMLInputElement).value).toBe('1234');
  });

  it('keeps the submit button disabled until six digits are entered', async () => {
    useAuthCodeStore().open({ flow: 'verify-email', email: 'user@example.com' });
    const wrapper = mountModal();

    const submit = wrapper.get('[data-testid="auth-code-submit"]');
    expect(submit.attributes('disabled')).toBeDefined();

    await codeInput(wrapper).setValue('12345');
    expect(submit.attributes('disabled')).toBeDefined();
  });

  it('auto-submits a full code to the verify-email endpoint and signs in', async () => {
    vi.useFakeTimers();
    useAuthCodeStore().open({ flow: 'verify-email', email: 'user@example.com' });
    const wrapper = mountModal();

    await codeInput(wrapper).setValue('123456');
    await flushPromises();

    expect(http.post).toHaveBeenCalledWith('/api/auth/verify-email', {
      email: 'user@example.com',
      code: '123456',
    });

    // The "code verified" notice lingers briefly before completion runs.
    expect(wrapper.find('[data-testid="auth-code-verified"]').exists()).toBe(true);

    await vi.runAllTimersAsync();
    // Completion refreshes the session and routes to onboarding.
    expect(http.get).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/start');
  });

  it('shows an error and clears the field when the code is rejected', async () => {
    http.post.mockRejectedValueOnce(new UnknownApiError());
    useAuthCodeStore().open({ flow: 'verify-email', email: 'user@example.com' });
    const wrapper = mountModal();

    await codeInput(wrapper).setValue('000000');
    await flushPromises();

    expect(wrapper.find('[data-testid="auth-code-error"]').exists()).toBe(true);
    expect((codeInput(wrapper).element as HTMLInputElement).value).toBe('');
  });
});
