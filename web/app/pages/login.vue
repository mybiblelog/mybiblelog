<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">
            {{ t('sign_in') }}
          </h1>
        </div>
        <div v-if="!passwordResetSubmitted" class="mbl-level-right">
          <NuxtLink :to="localePath('/register')">
            {{ t('need_an_account') }}
          </NuxtLink>
        </div>
      </div>
      <template v-if="passwordResetSubmitted">
        <p>{{ t('password_reset_link_sent') }}</p>
      </template>
      <template v-else>
        <div v-if="route.query.reason === 'session_expired'" class="mbl-notification mbl-notification--warning">
          {{ t('session_expired') }}
        </div>
        <div v-if="errors._form" class="mbl-help mbl-help--danger">
          {{ $terr(errors._form) }}
        </div>
        <resend-verification-email
          v-if="showResendVerification"
          :email="email || ''"
        />
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
          <div class="mbl-button-group">
            <button :disabled="!mounted || submitting" class="mbl-button mbl-button--primary">
              {{ t('sign_in') }}
            </button>
            <button
              :disabled="!mounted || submitting"
              class="mbl-button"
              :class="{ 'mbl-button--text': !failedLoginAttempt, 'mbl-button--primary': failedLoginAttempt }"
              @click.prevent="sendPasswordReset"
            >
              {{ t('forgot_your_password') }}
            </button>
          </div>
        </form>
        <div class="mbl-flex google-login-button-container">
          <google-login-button v-if="googleOauth2Url" :google-oauth2-url="googleOauth2Url" />
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import GoogleLoginButton from '~/components/forms/GoogleLoginButton.vue';
import ResendVerificationEmail from '~/components/ui/ResendVerificationEmail.vue';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { localStore } from '~/helpers/app-storage';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'], auth: 'guest' });

const { t } = useI18n();

useHead({ title: () => t('sign_in'), meta: [{ name: 'robots', content: 'noindex' }] });
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { $http, $terr } = useNuxtApp();

// Fetch once on the server and transfer via the Nuxt payload so the client reuses
// the same result. A plain top-level `await $http.get()` would re-run on hydration
// and mint a fresh OAuth `state`, causing a hydration mismatch on the button href.
const { data: googleOauth2Url } = await useAsyncData('google-oauth2-url', async () => {
  try {
    const { data } = await $http.get<{ url: string }>('/api/auth/oauth2/google/url');
    return data?.url ?? null;
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
const failedLoginAttempt = ref(false);
const passwordResetSubmitted = ref(false);
const mounted = ref(false);
const submitting = ref(false);
onMounted(() => { mounted.value = true; });

const showResendVerification = computed(() => {
  const formError = errors.value._form;
  return typeof formError === 'object' && formError?.code === 'verify_email';
});

// Persist the user's locale for the Google OAuth flow
if (import.meta.client) {
  const { locale } = useI18n();
  watch(locale, (val) => { localStore.set('loginLanguage', val); }, { immediate: true });
}

const onSubmit = async () => {
  if (submitting.value) { return; }
  submitting.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
  }
  catch (error) {
    errors.value = error instanceof ApiError ? mapFormErrors(error) : mapFormErrors(new UnknownApiError());
    failedLoginAttempt.value = true;
    return;
  }
  finally {
    submitting.value = false;
  }
  await router.push(localePath('/start'));
};

const sendPasswordReset = async () => {
  if (submitting.value) { return; }
  if (!email.value) {
    errors.value = { email: t('your_email_address_is_required') };
    return;
  }
  submitting.value = true;
  try {
    await $http.post('/api/auth/password/reset', { email: email.value });
    passwordResetSubmitted.value = true;
  }
  catch (err) {
    errors.value = (err instanceof ApiError ? mapFormErrors(err) : null) ?? mapFormErrors(new UnknownApiError());
  }
  finally {
    submitting.value = false;
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
    "your_email_address_is_required": "Your email address is required.",
    "sign_in": "Sign In",
    "need_an_account": "Need an account?",
    "password_reset_link_sent": "A password reset link has been sent to your email address.",
    "email": "Email",
    "password": "Password",
    "forgot_your_password": "Forgot your password? Reset it via email.",
    "session_expired": "Your session has expired. Please sign in again."
  },
  "de": {
    "your_email_address_is_required": "Ihre E-Mail-Adresse ist erforderlich.",
    "sign_in": "Anmelden",
    "need_an_account": "Benötigen Sie ein Konto?",
    "password_reset_link_sent": "Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail-Adresse gesendet.",
    "email": "E-Mail",
    "password": "Passwort",
    "forgot_your_password": "Passwort vergessen? Setzen Sie es per E-Mail zurück.",
    "session_expired": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
  },
  "es": {
    "your_email_address_is_required": "Su dirección de correo electrónico es obligatoria.",
    "sign_in": "Iniciar sesión",
    "need_an_account": "¿Necesitas una cuenta?",
    "password_reset_link_sent": "Se ha enviado un enlace de restablecimiento de contraseña a su dirección de correo electrónico.",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "forgot_your_password": "¿Olvidaste tu contraseña? Restablézcalo por correo electrónico.",
    "session_expired": "Tu sesión ha expirado. Por favor, inicia sesión de nuevo."
  },
  "fr": {
    "your_email_address_is_required": "Votre adresse e-mail est requise.",
    "sign_in": "Se connecter",
    "need_an_account": "Besoin d'un compte?",
    "password_reset_link_sent": "Un lien de réinitialisation de mot de passe a été envoyé à votre adresse e-mail.",
    "email": "Email",
    "password": "Mot de passe",
    "forgot_your_password": "Mot de passe oublié ? Réinitialisez-le via e-mail.",
    "session_expired": "Votre session a expiré. Veuillez vous reconnecter."
  },
  "ko": {
    "your_email_address_is_required": "이메일 주소를 입력해 주세요.",
    "sign_in": "로그인",
    "need_an_account": "계정이 없으신가요?",
    "password_reset_link_sent": "암호 재설정 링크가 이메일 주소로 발송되었습니다.",
    "email": "이메일",
    "password": "비밀번호",
    "forgot_your_password": "비밀번호를 잊으셨나요? 이메일을 통해 재설정해보세요.",
    "session_expired": "세션이 만료되었습니다. 다시 로그인해 주세요."
  },
  "pt": {
    "your_email_address_is_required": "Seu endereço de e-mail é obrigatório.",
    "sign_in": "Entrar",
    "need_an_account": "Precisa de uma conta?",
    "password_reset_link_sent": "Um link de redefinição de senha foi enviado para o seu endereço de email.",
    "email": "E-mail",
    "password": "Senha",
    "forgot_your_password": "Esqueceu sua senha? Redefina-a via email.",
    "session_expired": "Sua sessão expirou. Por favor, faça login novamente."
  },
  "uk": {
    "your_email_address_is_required": "Ваша електронна адреса обов'язкова.",
    "sign_in": "Увійти",
    "need_an_account": "Потрібен обліковий запис?",
    "password_reset_link_sent": "Посилання на скидання пароля було надіслано на вашу електронну адресу.",
    "email": "Електронна пошта",
    "password": "Пароль",
    "forgot_your_password": "Забули пароль? Скиньте його електронною поштою.",
    "session_expired": "Термін дії вашого сеансу закінчився. Будь ласка, увійдіть знову."
  }
}
</i18n>
