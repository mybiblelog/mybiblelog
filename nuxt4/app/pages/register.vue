<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">
            {{ $t('sign_up') }}
          </h1>
        </div>
        <div class="mbl-level-right">
          <NuxtLink :to="localePath('/login')">
            {{ $t('have_an_account') }}
          </NuxtLink>
        </div>
      </div>
      <template v-if="formSubmitted">
        <div class="mbl-content">
          <p>{{ $t('registration_submitted') }}</p>
        </div>
      </template>
      <template v-else>
        <form @submit.prevent="onSubmit">
          <div class="mbl-field">
            <label class="mbl-label">{{ $t('email') }}</label>
            <div class="mbl-control">
              <input v-model="email" class="mbl-input" type="text" :placeholder="$t('email')" :class="{ 'mbl-input--danger': errors.email }">
            </div>
            <p v-if="errors.email" class="mbl-help mbl-help--danger">
              {{ $terr(errors.email) }}
            </p>
          </div>
          <div class="mbl-field">
            <label class="mbl-label">{{ $t('password') }}</label>
            <div class="mbl-control">
              <input v-model="password" class="mbl-input" type="password" :placeholder="$t('password')" :class="{ 'mbl-input--danger': errors.password }">
              <p v-if="errors.password" class="mbl-help mbl-help--danger">
                {{ $terr(errors.password) }}
              </p>
            </div>
          </div>
          <button :disabled="!mounted" class="mbl-button mbl-button--primary">
            {{ $t('sign_up') }}
          </button>
        </form>
      </template>
      <div class="mbl-flex register-page__google-signin-hint">
        <article class="mbl-message mbl-message--info">
          <div class="mbl-message__header">
            <p>{{ $t('have_a_google_account') }}</p>
          </div>
          <div class="mbl-message__body">
            {{ $t('sign_in_with_google') }}
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'], auth: 'guest' });

const { t, locale } = useI18n();
useHead({ title: () => t('sign_up'), meta: [{ name: 'robots', content: 'noindex' }] });

const localePath = useLocalePath();
const router = useRouter();
const authStore = useAuthStore();
const config = useRuntimeConfig();
const { $http, $terr } = useNuxtApp() as {
  $http: { post: <T>(path: string, body?: unknown) => Promise<T> };
  $terr: (error: unknown, props?: Record<string, unknown>) => string;
};

// Read DOM values BEFORE Vue's hydration overwrites them, so refs are initialized
// with any values a test runner (Playwright) may have set pre-hydration.
let preFillEmail = '';
let preFillPassword = '';
if (import.meta.client) {
  const form = document.querySelector('form');
  preFillEmail = (form?.querySelector('input[type="text"]') as HTMLInputElement | null)?.value ?? '';
  preFillPassword = (form?.querySelector('input[type="password"]') as HTMLInputElement | null)?.value ?? '';
}

const email = ref(preFillEmail);
const password = ref(preFillPassword);
const errors = ref<Record<string, unknown>>({});
const formSubmitted = ref(false);
const mounted = ref(false);
onMounted(() => { mounted.value = true; });

const onSubmit = async () => {
  email.value = email.value.trim();
  try {
    await $http.post('/api/auth/register', { email: email.value, password: password.value, locale: locale.value });
  }
  catch (err) {
    errors.value = (err instanceof ApiError ? mapFormErrors(err) : null) ?? mapFormErrors(new UnknownApiError());
    return;
  }

  formSubmitted.value = true;

  if (!config.public.requireEmailVerification) {
    try {
      await authStore.login({ email: email.value, password: password.value });
    }
    catch (error) {
      errors.value = error instanceof ApiError ? mapFormErrors(error) : mapFormErrors(new UnknownApiError());
      return;
    }
    await router.push(localePath('/start'));
  }
};
</script>

<style scoped>
.register-page__google-signin-hint {
  margin-top: 2rem;
}
</style>
