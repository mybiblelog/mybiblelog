<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">
            {{ t('sign_up') }}
          </h1>
        </div>
        <div class="mbl-level-right">
          <NuxtLink :to="localePath('/login')">
            {{ t('have_an_account') }}
          </NuxtLink>
        </div>
      </div>
      <template v-if="formSubmitted">
        <div class="mbl-content">
          <p>{{ t('registration_submitted') }}</p>
        </div>
      </template>
      <template v-else>
        <form @submit.prevent="onSubmit">
          <div class="mbl-field">
            <label class="mbl-label">{{ t('email') }}</label>
            <div class="mbl-control">
              <input v-model="email" class="mbl-input" type="text" :placeholder="t('email')" :class="{ 'mbl-input--danger': errors.email }">
            </div>
            <p v-if="errors.email" class="mbl-help mbl-help--danger">
              {{ $terr(errors.email) }}
            </p>
          </div>
          <div class="mbl-field">
            <label class="mbl-label">{{ t('password') }}</label>
            <div class="mbl-control">
              <input v-model="password" class="mbl-input" type="password" :placeholder="t('password')" :class="{ 'mbl-input--danger': errors.password }">
              <p v-if="errors.password" class="mbl-help mbl-help--danger">
                {{ $terr(errors.password) }}
              </p>
            </div>
          </div>
          <button :disabled="!mounted || submitting" class="mbl-button mbl-button--primary">
            {{ t('sign_up') }}
          </button>
        </form>
      </template>
      <div class="mbl-flex google-login-button-container">
        <google-login-button v-if="googleOauth2Url" :google-oauth2-url="googleOauth2Url" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import GoogleLoginButton from '~/components/forms/GoogleLoginButton.vue';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'], auth: 'guest' });

const { t, locale } = useI18n();
useHead({ title: () => t('sign_up'), meta: [{ name: 'robots', content: 'noindex' }] });

const localePath = useLocalePath();
const router = useRouter();
const authStore = useAuthStore();
const config = useRuntimeConfig();
const { $http, $terr } = useNuxtApp();

// Fetch once on the server and transfer via the Nuxt payload so the client reuses
// the same result. A plain top-level `await $http.get()` would re-run on hydration
// and mint a fresh OAuth `state`, causing a hydration mismatch on the button href.
const { data: googleOauth2Url } = await useAsyncData('google-oauth2-url', async () => {
  try {
    const { data } = await $http.get<{ url: string }>('/api/auth/oauth2/google/url');
    return (data as any)?.url ?? null;
  }
  catch {
    // non-fatal: button simply won't render
    return null;
  }
});

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
const errors = ref<Record<string, string | ApiErrorDetail>>({});
const formSubmitted = ref(false);
const mounted = ref(false);
const submitting = ref(false);
onMounted(() => { mounted.value = true; });

const onSubmit = async () => {
  if (submitting.value) { return; }
  submitting.value = true;
  email.value = email.value.trim();
  try {
    await $http.post('/api/auth/register', { email: email.value, password: password.value, locale: locale.value });
  }
  catch (err) {
    errors.value = (err instanceof ApiError ? mapFormErrors(err) : null) ?? mapFormErrors(new UnknownApiError());
    return;
  }
  finally {
    submitting.value = false;
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
.google-login-button-container {
  margin-top: 1.5rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "sign_up": "Sign Up",
    "have_an_account": "Have an account?",
    "registration_submitted": "Registration submitted! Please check your email for a verification link.",
    "email": "Email",
    "password": "Password"
  },
  "de": {
    "sign_up": "Registrieren",
    "have_an_account": "Haben Sie bereits ein Konto?",
    "registration_submitted": "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail für einen Bestätigungslink.",
    "email": "E-Mail",
    "password": "Passwort"
  },
  "es": {
    "sign_up": "Registrarse",
    "have_an_account": "¿Ya tienes una cuenta?",
    "registration_submitted": "¡Registro enviado! Por favor, revisa tu correo electrónico para obtener el enlace de verificación.",
    "email": "Correo electrónico",
    "password": "Contraseña"
  },
  "fr": {
    "sign_up": "S'inscrire",
    "have_an_account": "Vous avez un compte?",
    "registration_submitted": "Inscription soumise! Veuillez vérifier votre e-mail pour un lien de vérification.",
    "email": "E-mail",
    "password": "Mot de passe"
  },
  "ko": {
    "sign_up": "회원가입",
    "have_an_account": "이미 계정이 있으신가요?",
    "registration_submitted": "계정 생성 요청이 접수되었습니다. 이메일로 발송된 인증 링크를 확인해 주세요.",
    "email": "이메일",
    "password": "비밀번호"
  },
  "pt": {
    "sign_up": "Inscrever-se",
    "have_an_account": "Já tem uma conta?",
    "registration_submitted": "Inscrição enviada! Por favor, verifique seu e-mail para um link de verificação.",
    "email": "E-mail",
    "password": "Senha"
  },
  "uk": {
    "sign_up": "Зареєструватися",
    "have_an_account": "Вже маєте обліковий запис?",
    "registration_submitted": "Реєстрація надіслана! Будь ласка, перевірте свою електронну пошту на наявність посилання для підтвердження.",
    "email": "Електронна пошта",
    "password": "Пароль"
  }
}
</i18n>
