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
          <button :disabled="!mounted" class="mbl-button mbl-button--primary">
            {{ t('sign_up') }}
          </button>
        </form>
      </template>
      <div class="mbl-flex register-page__google-signin-hint">
        <article class="mbl-message mbl-message--info">
          <div class="mbl-message__header">
            <p>{{ t('have_a_google_account') }}</p>
          </div>
          <div class="mbl-message__body">
            {{ t('sign_in_with_google') }}
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

<i18n lang="json">
{
  "en": {
    "sign_up": "Sign Up",
    "have_an_account": "Have an account?",
    "registration_submitted": "Registration submitted! Please check your email for a verification link.",
    "email": "Email",
    "password": "Password",
    "have_a_google_account": "Have a Google account?",
    "sign_in_with_google": "You can sign in with Google without creating a password! Go to the Sign In page to get started."
  },
  "de": {
    "sign_up": "Registrieren",
    "have_an_account": "Haben Sie bereits ein Konto?",
    "registration_submitted": "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail für einen Bestätigungslink.",
    "email": "E-Mail",
    "password": "Passwort",
    "have_a_google_account": "Haben Sie ein Google-Konto?",
    "sign_in_with_google": "Sie können sich mit Google anmelden, ohne ein Passwort zu erstellen! Gehen Sie zur Anmeldeseite, um loszulegen."
  },
  "es": {
    "sign_up": "Registrarse",
    "have_an_account": "¿Ya tienes una cuenta?",
    "registration_submitted": "¡Registro enviado! Por favor, revisa tu correo electrónico para obtener el enlace de verificación.",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "have_a_google_account": "¿Tienes una cuenta de Google?",
    "sign_in_with_google": "¡Puedes iniciar sesión con Google sin crear una contraseña! ¡Ve a la página de inicio de sesión para comenzar!"
  },
  "fr": {
    "sign_up": "S'inscrire",
    "have_an_account": "Vous avez un compte?",
    "registration_submitted": "Inscription soumise! Veuillez vérifier votre e-mail pour un lien de vérification.",
    "email": "E-mail",
    "password": "Mot de passe",
    "have_a_google_account": "Vous avez un compte Google?",
    "sign_in_with_google": "Vous pouvez vous connecter avec Google sans créer de mot de passe! Rendez-vous sur la page de connexion pour commencer."
  },
  "ko": {
    "sign_up": "회원가입",
    "have_an_account": "이미 계정이 있으신가요?",
    "registration_submitted": "계정 생성 요청이 접수되었습니다. 이메일로 발송된 인증 링크를 확인해 주세요.",
    "email": "이메일",
    "password": "비밀번호",
    "have_a_google_account": "Google 계정이 있으신가요?",
    "sign_in_with_google": "비밀번호 없이 Google 계정으로 로그인할 수 있어요! 로그인 페이지에서 바로 시작해보세요."
  },
  "pt": {
    "sign_up": "Inscrever-se",
    "have_an_account": "Já tem uma conta?",
    "registration_submitted": "Inscrição enviada! Por favor, verifique seu e-mail para um link de verificação.",
    "email": "E-mail",
    "password": "Senha",
    "have_a_google_account": "Tem uma conta do Google?",
    "sign_in_with_google": "Você pode entrar com o Google sem criar uma senha! Acesse a página de Login para começar."
  },
  "uk": {
    "sign_up": "Зареєструватися",
    "have_an_account": "Вже маєте обліковий запис?",
    "registration_submitted": "Реєстрація надіслана! Будь ласка, перевірте свою електронну пошту на наявність посилання для підтвердження.",
    "email": "Електронна пошта",
    "password": "Пароль",
    "have_a_google_account": "Маєте обліковий запис Google?",
    "sign_in_with_google": "Ви можете увійти за допомогою Google без створення пароля! Перейдіть на сторінку входу, щоб почати."
  }
}
</i18n>
