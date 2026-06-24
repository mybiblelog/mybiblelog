<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">
            {{ $t('sign_in') }}
          </h1>
        </div>
        <div v-if="!passwordResetSubmitted" class="mbl-level-right">
          <NuxtLink :to="localePath('/register')">
            {{ $t('need_an_account') }}
          </NuxtLink>
        </div>
      </div>
      <template v-if="passwordResetSubmitted">
        <p>{{ $t('password_reset_link_sent') }}</p>
      </template>
      <template v-else>
        <div v-if="route.query.reason === 'session_expired'" class="mbl-notification mbl-notification--warning">
          {{ $t('session_expired') }}
        </div>
        <div v-if="errors._form" class="mbl-help mbl-help--danger">
          {{ $terr(errors._form) }}
        </div>
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
          <div class="mbl-button-group">
            <button :disabled="!mounted" class="mbl-button mbl-button--primary">
              {{ $t('sign_in') }}
            </button>
            <button
              :disabled="!mounted"
              class="mbl-button"
              :class="{ 'mbl-button--text': !failedLoginAttempt, 'mbl-button--primary': failedLoginAttempt }"
              @click.prevent="sendPasswordReset"
            >
              {{ $t('forgot_your_password') }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'], auth: 'guest' });

const { t } = useI18n();

useHead({ title: () => t('sign_in'), meta: [{ name: 'robots', content: 'noindex' }] });
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
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
const failedLoginAttempt = ref(false);
const passwordResetSubmitted = ref(false);
const mounted = ref(false);
onMounted(() => { mounted.value = true; });

// Persist the user's locale for the Google OAuth flow
if (import.meta.client) {
  const { locale } = useI18n();
  watch(locale, (val) => { localStorage.setItem('login_language', val); }, { immediate: true });
}

const onSubmit = async () => {
  try {
    await authStore.login({ email: email.value, password: password.value });
  }
  catch (error) {
    errors.value = error instanceof ApiError ? mapFormErrors(error) : mapFormErrors(new UnknownApiError());
    failedLoginAttempt.value = true;
    return;
  }
  await router.push(localePath('/start'));
};

const sendPasswordReset = async () => {
  if (!email.value) {
    errors.value = { email: t('your_email_address_is_required') };
    return;
  }
  try {
    await $http.post('/api/auth/reset-password', { email: email.value });
    passwordResetSubmitted.value = true;
  }
  catch (err) {
    errors.value = (err instanceof ApiError ? mapFormErrors(err) : null) ?? mapFormErrors(new UnknownApiError());
  }
};
</script>
