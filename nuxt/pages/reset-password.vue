<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ $t('reset_password') }}
      </h1>
      <template v-if="passwordResetCodeValid">
        <div class="mbl-content">
          <p>{{ $t('once_you_set_a_new_password_you_will_be_automatically_logged_in') }}</p>
        </div>
        <form :disabled="formBusy" @submit.prevent="submitChangePassword()">
          <div v-if="changePasswordErrors._form" class="mbl-help mbl-help--danger">
            {{ $terr(changePasswordErrors._form) }}
          </div>
          <div class="mbl-field">
            <label class="mbl-label" for="newPassword">{{ $t('new_password') }}</label>
            <div class="mbl-control">
              <input v-model="changePasswordModel.newPassword" class="mbl-input" type="password" name="newPassword">
            </div>
            <div v-if="changePasswordErrors.newPassword" class="mbl-help mbl-help--danger">
              {{ $terr(changePasswordErrors.newPassword) }}
            </div>
          </div>
          <div class="mbl-field">
            <label class="mbl-label" for="confirmNewPassword">{{ $t('confirm_new_password') }}</label>
            <div class="mbl-control">
              <input v-model="changePasswordModel.confirmNewPassword" class="mbl-input" type="password" name="confirmNewPassword">
            </div>
            <div v-if="changePasswordErrors.confirmNewPassword" class="mbl-help mbl-help--danger">
              {{ $terr(changePasswordErrors.confirmNewPassword) }}
            </div>
          </div>
          <button class="mbl-button mbl-button--primary" :disabled="formBusy">
            {{ $t('submit') }}
          </button>
        </form>
      </template>
      <template v-else>
        <div class="mbl-content">
          <p>{{ $t('this_password_reset_link_is_expired') }}</p>
          <p>{{ $t('you_can_send_a_new_password_reset_email_from_the_sign_in_page') }}</p>
        </div>
        <nuxt-link class="mbl-button" :to="localePath('/login')">
          Sign In
        </nuxt-link>
      </template>
    </div>
  </main>
</template>

<script>
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'ResetPasswordPage',
  middleware: ['auth'],
  data() {
    return {
      passwordResetCode: undefined,
      passwordResetCodeValid: true,
      formBusy: false,
      changePasswordModel: { // 'Change Password' form data
        newPassword: '',
        confirmNewPassword: '',
      },
      changePasswordErrors: { // 'Change Password' form errors
        _form: '',
        newPassword: '',
        confirmNewPassword: '',
      },
    };
  },
  head() {
    return {
      title: this.$t('reset_password'),
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  async mounted() {
    const passwordResetCode = new URL(window.location.href).searchParams.get('code');
    if (!passwordResetCode) {
      await this.$router.push(this.localePath('/login'));
      return;
    }
    this.passwordResetCode = passwordResetCode;

    // Determine if password reset code is valid
    try {
      const { data } = await this.$http.get(`/api/auth/reset-password/${this.passwordResetCode}/valid`);
      this.passwordResetCodeValid = data.valid;
    }
    catch {
      this.passwordResetCodeValid = false;
    }
  },
  methods: {
    resetChangePasswordErrors() {
      Object.assign(this.changePasswordErrors, {
        _form: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    },
    async submitChangePassword() {
      if (this.formBusy) {
        return;
      }
      // Disable form and remove previous errors
      this.formBusy = true;
      this.resetChangePasswordErrors();

      const { newPassword, confirmNewPassword } = this.changePasswordModel;

      if (confirmNewPassword !== newPassword) {
        this.changePasswordErrors.confirmNewPassword = this.$t('passwords_must_match');
        this.formBusy = false;
        return;
      }

      try {
        await this.$http.post(`/api/auth/reset-password/${this.passwordResetCode}`, { newPassword });
        // If successful, automatically log the user in
        await useAuthStore().refreshUser();
        await this.$router.push(this.localePath('/start'));
      }
      catch (err) {
        if (err instanceof ApiError) {
          Object.assign(this.changePasswordErrors, mapFormErrors(err));
        }
        else {
          Object.assign(this.changePasswordErrors, mapFormErrors(new UnknownApiError()));
        }
      }
      finally {
        this.formBusy = false;
      }
    },
  },
  meta: {
    auth: 'guest',
  },
};
</script>

<style scoped>

</style>

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
    "passwords_must_match": "Passwords must match.",
    "an_unknown_error_occurred": "An unknown error occurred."
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
    "passwords_must_match": "Passwörter müssen übereinstimmen.",
    "an_unknown_error_occurred": "Ein unbekannter Fehler ist aufgetreten."
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
    "passwords_must_match": "Las contraseñas deben coincidir.",
    "an_unknown_error_occurred": "Ocurrió un error desconocido."
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
    "passwords_must_match": "Les mots de passe doivent correspondre.",
    "an_unknown_error_occurred": "Une erreur inconnue s'est produite."
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
    "passwords_must_match": "비밀번호가 일치해야 합니다.",
    "an_unknown_error_occurred": "알 수 없는 오류가 발생했습니다."
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
    "passwords_must_match": "As senhas devem coincidir.",
    "an_unknown_error_occurred": "Ocorreu um erro desconhecido."
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
    "passwords_must_match": "Паролі повинні збігатися.",
    "an_unknown_error_occurred": "Виникла невідома помилка."
  }
}
</i18n>
