<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ t('reset_password') }}
      </h1>
      <template v-if="passwordResetCodeValid">
        <div class="mbl-content">
          <p>{{ t('once_you_set_a_new_password_you_will_be_automatically_logged_in') }}</p>
        </div>
        <form @submit.prevent="submitChangePassword">
          <div v-if="errors._form" class="mbl-help mbl-help--danger">
            {{ $terr(errors._form) }}
          </div>
          <div class="mbl-field">
            <label class="mbl-label" for="newPassword">{{ t('new_password') }}</label>
            <div class="mbl-control">
              <input id="newPassword" v-model="newPassword" class="mbl-input" type="password" name="newPassword">
            </div>
            <div v-if="errors.newPassword" class="mbl-help mbl-help--danger">
              {{ $terr(errors.newPassword) }}
            </div>
          </div>
          <div class="mbl-field">
            <label class="mbl-label" for="confirmNewPassword">{{ t('confirm_new_password') }}</label>
            <div class="mbl-control">
              <input id="confirmNewPassword" v-model="confirmNewPassword" class="mbl-input" type="password" name="confirmNewPassword">
            </div>
            <div v-if="errors.confirmNewPassword" class="mbl-help mbl-help--danger">
              {{ $terr(errors.confirmNewPassword) }}
            </div>
          </div>
          <button class="mbl-button mbl-button--primary" :disabled="!mounted || submitting">
            {{ t('submit') }}
          </button>
        </form>
      </template>
      <template v-else-if="checkedCode">
        <div class="mbl-content">
          <p>{{ t('this_password_reset_link_is_expired') }}</p>
          <p>{{ t('you_can_send_a_new_password_reset_email_from_the_sign_in_page') }}</p>
        </div>
        <NuxtLink class="mbl-button" :to="localePath('/login')">
          {{ t('sign_in') }}
        </NuxtLink>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthStore } from '~/stores/auth';
import { postAuthEvent } from '~/composables/auth-channel';

definePageMeta({ middleware: ['auth'], auth: 'guest' });

const { t } = useI18n();
useHead({ title: () => t('reset_password'), meta: [{ name: 'robots', content: 'noindex' }] });

const localePath = useLocalePath();
const router = useRouter();
const authStore = useAuthStore();
const { $http, $terr } = useNuxtApp();

const passwordResetCode = ref<string | null>(null);
const passwordResetEmail = ref<string | null>(null);
const passwordResetCodeValid = ref(true);
const checkedCode = ref(false);
const newPassword = ref('');
const confirmNewPassword = ref('');
const errors = ref<Record<string, string | ApiErrorDetail>>({});
const mounted = ref(false);
const submitting = ref(false);
onMounted(() => { mounted.value = true; });

onMounted(async () => {
  const params = new URL(window.location.href).searchParams;
  const code = params.get('code');
  const email = params.get('email');
  if (!code || !email) {
    await router.push(localePath('/login'));
    return;
  }
  passwordResetCode.value = code;
  passwordResetEmail.value = email;

  try {
    const { data } = await $http.post<{ valid: boolean }>(
      '/api/auth/password/reset/validate',
      { email, code },
    );
    passwordResetCodeValid.value = data.valid;
  }
  catch {
    passwordResetCodeValid.value = false;
  }
  finally {
    checkedCode.value = true;
  }
});

const submitChangePassword = async () => {
  if (submitting.value) { return; }
  submitting.value = true;
  errors.value = {};

  if (confirmNewPassword.value !== newPassword.value) {
    errors.value = { confirmNewPassword: t('passwords_must_match') };
    submitting.value = false;
    return;
  }

  try {
    await $http.post('/api/auth/password/reset/complete', {
      email: passwordResetEmail.value,
      code: passwordResetCode.value,
      newPassword: newPassword.value,
    });
    await authStore.refreshUser();
    postAuthEvent({ type: 'completed', flow: 'reset-password', email: passwordResetEmail.value ?? '' });
    await router.push(localePath('/start'));
  }
  catch (err) {
    errors.value = err instanceof ApiError ? mapFormErrors(err) : mapFormErrors(new UnknownApiError());
  }
  finally {
    submitting.value = false;
  }
};
</script>

<i18n lang="json">
{
  "en": {
    "reset_password": "Reset Password",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "Once you set a new password, you will be automatically logged in.",
    "new_password": "New Password",
    "confirm_new_password": "Confirm New Password",
    "submit": "Submit",
    "this_password_reset_link_is_expired": "This password reset link is expired.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "You can send a new password reset email from the Sign In page.",
    "sign_in": "Sign In",
    "passwords_must_match": "Passwords must match."
  },
  "de": {
    "reset_password": "Passwort zurücksetzen",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "Sobald Sie ein neues Passwort festgelegt haben, werden Sie automatisch angemeldet.",
    "new_password": "Neues Passwort",
    "confirm_new_password": "Neues Passwort bestätigen",
    "submit": "Absenden",
    "this_password_reset_link_is_expired": "Dieses Passwort-Wiederherstellungs-Link ist abgelaufen.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "Sie können ein neues Passwort-Wiederherstellungs-E-Mail von der Anmeldeseite senden.",
    "sign_in": "Anmelden",
    "passwords_must_match": "Passwörter müssen übereinstimmen."
  },
  "es": {
    "reset_password": "Restablecer la contraseña",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "Una vez que establezca una nueva contraseña, se le iniciará sesión automáticamente.",
    "new_password": "Nueva contraseña",
    "confirm_new_password": "Confirmar nueva contraseña",
    "submit": "Enviar",
    "this_password_reset_link_is_expired": "Este enlace de restablecimiento de contraseña ha caducado.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "Puede enviar un nuevo correo electrónico de restablecimiento de contraseña desde la página de inicio de sesión.",
    "sign_in": "Iniciar sesión",
    "passwords_must_match": "Las contraseñas deben coincidir."
  },
  "fr": {
    "reset_password": "Réinitialiser le mot de passe",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "Une fois que vous avez défini un nouveau mot de passe, vous serez automatiquement connecté.",
    "new_password": "Nouveau mot de passe",
    "confirm_new_password": "Confirmer le nouveau mot de passe",
    "submit": "Soumettre",
    "this_password_reset_link_is_expired": "Ce lien de réinitialisation de mot de passe a expiré.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "Vous pouvez envoyer un nouvel e-mail de réinitialisation de mot de passe depuis la page de connexion.",
    "sign_in": "Se connecter",
    "passwords_must_match": "Les mots de passe doivent correspondre."
  },
  "ko": {
    "reset_password": "비밀번호 재설정",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "새 비밀번호를 설정하면 자동으로 로그인됩니다.",
    "new_password": "새 비밀번호",
    "confirm_new_password": "새 비밀번호 확인",
    "submit": "제출",
    "this_password_reset_link_is_expired": "본 비밀번호 재설정 링크는 만료되었습니다.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "로그인 페이지에서 비밀번호 재설정 이메일을 새로 보낼 수 있습니다.",
    "sign_in": "로그인",
    "passwords_must_match": "비밀번호가 일치해야 합니다."
  },
  "pt": {
    "reset_password": "Redefinir Senha",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "Assim que definir uma nova senha, você será automaticamente conectado.",
    "new_password": "Nova Senha",
    "confirm_new_password": "Confirmar Nova Senha",
    "submit": "Enviar",
    "this_password_reset_link_is_expired": "Este link de redefinição de senha expirou.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "Você pode enviar um novo e-mail de redefinição de senha a partir da página de login.",
    "sign_in": "Entrar",
    "passwords_must_match": "As senhas devem coincidir."
  },
  "uk": {
    "reset_password": "Скинути пароль",
    "once_you_set_a_new_password_you_will_be_automatically_logged_in": "Після встановлення нового пароля ви автоматично увійдете в систему.",
    "new_password": "Новий пароль",
    "confirm_new_password": "Підтвердіть новий пароль",
    "submit": "Надіслати",
    "this_password_reset_link_is_expired": "Це посилання для скидання пароля застаріло.",
    "you_can_send_a_new_password_reset_email_from_the_sign_in_page": "Ви можете надіслати новий лист зі скиданням пароля зі сторінки входу.",
    "sign_in": "Увійти",
    "passwords_must_match": "Паролі повинні збігатися."
  }
}
</i18n>
