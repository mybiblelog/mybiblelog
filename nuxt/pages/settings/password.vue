<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('change_password') }}
    </h2>
    <form :disabled="formBusy" @submit.prevent="submitChangePassword()">
      <div v-if="changePasswordErrors._form" class="mbl-help mbl-help--danger">
        {{ $terr(changePasswordErrors._form) }}
      </div>
      <div class="mbl-field">
        <label class="mbl-label" for="currentPassword">{{ $t('current_password') }}</label>
        <div class="mbl-control">
          <input v-model="changePasswordModel.currentPassword" class="mbl-input" type="password" name="currentPassword" data-testid="password-current">
        </div>
        <div v-if="changePasswordErrors.currentPassword" class="mbl-help mbl-help--danger">
          {{ $terr(changePasswordErrors.currentPassword) }}
        </div>
      </div>
      <div class="mbl-field">
        <label class="mbl-label" for="newPassword">{{ $t('new_password') }}</label>
        <div class="mbl-control">
          <input v-model="changePasswordModel.newPassword" class="mbl-input" type="password" name="newPassword" data-testid="password-new">
        </div>
        <div v-if="changePasswordErrors.newPassword" class="mbl-help mbl-help--danger">
          {{ $terr(changePasswordErrors.newPassword) }}
        </div>
      </div>
      <div class="mbl-field">
        <label class="mbl-label" for="confirmNewPassword">{{ $t('confirm_new_password') }}</label>
        <div class="mbl-control">
          <input v-model="changePasswordModel.confirmNewPassword" class="mbl-input" type="password" name="confirmNewPassword" data-testid="password-confirm">
        </div>
        <div v-if="changePasswordErrors.confirmNewPassword" class="mbl-help mbl-help--danger">
          {{ $terr(changePasswordErrors.confirmNewPassword) }}
        </div>
      </div>
      <div class="mbl-field">
        <div class="mbl-control">
          <button class="mbl-button mbl-button--primary" type="submit" data-testid="password-submit" :disabled="formBusy">
            {{ $t('change_password_button') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useToastStore } from '~/stores/toast';

export default {
  name: 'PasswordSettingsPage',
  middleware: ['auth'],
  data() {
    return {
      formBusy: false,
      changePasswordModel: { // 'Change Password' form data
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      },
      changePasswordErrors: { // 'Change Password' form errors
        _form: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      },
    };
  },
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  methods: {
    // Resets 'Change Password' form fields and errors.
    resetChangePasswordForm() {
      Object.assign(this.changePasswordModel, {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      this.resetChangePasswordErrors();
    },

    // Resets 'Change Password' form errors.
    resetChangePasswordErrors() {
      Object.assign(this.changePasswordErrors, {
        _form: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    },

    // Submits 'Change Password' form data and handles response.
    async submitChangePassword() {
      if (this.formBusy) {
        return;
      }
      // Disable form and remove previous errors
      this.formBusy = true;
      this.resetChangePasswordErrors();

      const { currentPassword, newPassword, confirmNewPassword } = this.changePasswordModel;

      if (!currentPassword.length) {
        this.changePasswordErrors.currentPassword = this.$t('enter_current_password');
        this.formBusy = false;
        return;
      }

      if (confirmNewPassword !== newPassword) {
        this.changePasswordErrors.confirmNewPassword = this.$t('passwords_must_match');
        this.formBusy = false;
        return;
      }

      try {
        await this.$http.patch('/api/auth/change-password', {
          currentPassword,
          newPassword,
        });
        this.resetChangePasswordForm();
        const toastStore = useToastStore();
        toastStore.add({
          type: 'success',
          text: this.$t('password_changed_successfully'),
        });
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
};
</script>

<style scoped>
main p {
  margin-bottom: 1rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "change_password": "Change Password",
    "current_password": "Current Password",
    "new_password": "New Password",
    "confirm_new_password": "Confirm New Password",
    "change_password_button": "Change Password",
    "enter_current_password": "Enter your current password.",
    "passwords_must_match": "Passwords must match.",
    "password_changed_successfully": "Password changed successfully.",
    "an_unknown_error_occurred": "An unknown error occurred."
  },
  "de": {
    "change_password": "Passwort ändern",
    "current_password": "Aktuelles Passwort",
    "new_password": "Neues Passwort",
    "confirm_new_password": "Neues Passwort bestätigen",
    "change_password_button": "Passwort ändern",
    "enter_current_password": "Geben Sie Ihr aktuelles Passwort ein.",
    "passwords_must_match": "Passwörter müssen übereinstimmen.",
    "password_changed_successfully": "Passwort erfolgreich geändert.",
    "an_unknown_error_occurred": "Ein unbekannter Fehler ist aufgetreten."
  },
  "es": {
    "change_password": "Cambiar contraseña",
    "current_password": "Contraseña actual",
    "new_password": "Nueva contraseña",
    "confirm_new_password": "Confirmar nueva contraseña",
    "change_password_button": "Cambiar contraseña",
    "enter_current_password": "Ingrese su contraseña actual.",
    "passwords_must_match": "Las contraseñas deben coincidir.",
    "password_changed_successfully": "Contraseña cambiada con éxito.",
    "an_unknown_error_occurred": "Ocurrió un error desconocido."
  },
  "fr": {
    "change_password": "Modifier le mot de passe",
    "current_password": "Mot de passe actuel",
    "new_password": "Nouveau mot de passe",
    "confirm_new_password": "Confirmer le nouveau mot de passe",
    "change_password_button": "Modifier le mot de passe",
    "enter_current_password": "Entrez votre mot de passe actuel.",
    "passwords_must_match": "Les mots de passe doivent correspondre.",
    "password_changed_successfully": "Mot de passe modifié avec succès.",
    "an_unknown_error_occurred": "Une erreur inconnue s'est produite."
  },
  "ko": {
    "change_password": "비밀번호 변경",
    "current_password": "현재 비밀번호",
    "new_password": "새 비밀번호",
    "confirm_new_password": "새 비밀번호 확인",
    "change_password_button": "비밀번호 변경",
    "enter_current_password": "현재 비밀번호를 입력하세요.",
    "passwords_must_match": "비밀번호가 일치해야 합니다.",
    "password_changed_successfully": "비밀번호가 변경되었습니다.",
    "an_unknown_error_occurred": "알 수 없는 오류가 발생했습니다."
  },
  "pt": {
    "change_password": "Alterar Senha",
    "current_password": "Senha Atual",
    "new_password": "Nova Senha",
    "confirm_new_password": "Confirmar Nova Senha",
    "change_password_button": "Alterar Senha",
    "enter_current_password": "Digite sua senha atual.",
    "passwords_must_match": "As senhas devem corresponder.",
    "password_changed_successfully": "Senha alterada com sucesso.",
    "an_unknown_error_occurred": "Ocorreu um erro desconhecido."
  },
  "uk": {
    "change_password": "Змінити пароль",
    "current_password": "Поточний пароль",
    "new_password": "Новий пароль",
    "confirm_new_password": "Підтвердіть новий пароль",
    "change_password_button": "Змінити пароль",
    "enter_current_password": "Введіть поточний пароль.",
    "passwords_must_match": "Паролі повинні збігатися.",
    "password_changed_successfully": "Пароль успішно змінено.",
    "an_unknown_error_occurred": "Сталася невідома помилка."
  }
}
</i18n>
