<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('change_password') }}
    </h2>
    <form @submit.prevent="submitChangePassword">
      <div v-if="errors._form" class="mbl-help mbl-help--danger">
        {{ $terr(errors._form) }}
      </div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('current_password') }}</label>
        <div class="mbl-control">
          <input v-model="model.currentPassword" class="mbl-input" type="password" data-testid="password-current" :disabled="!mounted">
        </div>
        <div v-if="errors.currentPassword" class="mbl-help mbl-help--danger">
          {{ $terr(errors.currentPassword) }}
        </div>
      </div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('new_password') }}</label>
        <div class="mbl-control">
          <input v-model="model.newPassword" class="mbl-input" type="password" data-testid="password-new" :disabled="!mounted">
        </div>
        <div v-if="errors.newPassword" class="mbl-help mbl-help--danger">
          {{ $terr(errors.newPassword) }}
        </div>
      </div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('confirm_new_password') }}</label>
        <div class="mbl-control">
          <input v-model="model.confirmNewPassword" class="mbl-input" type="password" data-testid="password-confirm" :disabled="!mounted">
        </div>
        <div v-if="errors.confirmNewPassword" class="mbl-help mbl-help--danger">
          {{ errors.confirmNewPassword }}
        </div>
      </div>
      <div class="mbl-field">
        <div class="mbl-control">
          <button class="mbl-button mbl-button--primary" type="submit" :disabled="!mounted || busy" data-testid="password-submit">
            {{ t('change_password_button') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const mounted = ref(false);
onMounted(() => { mounted.value = true; });

const { t } = useI18n();
const toastStore = useToastStore();

const { $http, $terr } = useNuxtApp() as {
  $http: { patch: <T>(path: string, body?: unknown) => Promise<T> };
  $terr: (error: unknown, props?: Record<string, unknown>) => string;
};

const busy = ref(false);
const model = reactive({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
const errors = reactive<Record<string, unknown>>({
  _form: null,
  currentPassword: null,
  newPassword: null,
  confirmNewPassword: '',
});

function resetErrors() {
  errors._form = null;
  errors.currentPassword = null;
  errors.newPassword = null;
  errors.confirmNewPassword = '';
}

async function submitChangePassword() {
  if (busy.value) { return; }
  busy.value = true;
  resetErrors();

  const { currentPassword, newPassword, confirmNewPassword } = model;

  if (!currentPassword.length) {
    errors.currentPassword = { field: 'currentPassword', code: 'required' };
    busy.value = false;
    return;
  }

  if (confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = t('passwords_must_match');
    busy.value = false;
    return;
  }

  try {
    await $http.patch('/api/auth/password', { currentPassword, newPassword });
    model.currentPassword = '';
    model.newPassword = '';
    model.confirmNewPassword = '';
    toastStore.add({ type: 'success', text: t('password_changed_successfully') });
  }
  catch (err) {
    const mapped = mapFormErrors(err instanceof ApiError ? err : new UnknownApiError());
    Object.assign(errors, mapped);
  }
  finally {
    busy.value = false;
  }
}
</script>

<i18n lang="json">
{
  "en": {
    "change_password": "Change Password",
    "current_password": "Current Password",
    "new_password": "New Password",
    "confirm_new_password": "Confirm New Password",
    "change_password_button": "Change Password",
    "passwords_must_match": "Passwords must match.",
    "password_changed_successfully": "Password changed successfully."
  },
  "de": {
    "change_password": "Passwort ändern",
    "current_password": "Aktuelles Passwort",
    "new_password": "Neues Passwort",
    "confirm_new_password": "Neues Passwort bestätigen",
    "change_password_button": "Passwort ändern",
    "passwords_must_match": "Passwörter müssen übereinstimmen.",
    "password_changed_successfully": "Passwort erfolgreich geändert."
  },
  "es": {
    "change_password": "Cambiar contraseña",
    "current_password": "Contraseña actual",
    "new_password": "Nueva contraseña",
    "confirm_new_password": "Confirmar nueva contraseña",
    "change_password_button": "Cambiar contraseña",
    "passwords_must_match": "Las contraseñas deben coincidir.",
    "password_changed_successfully": "Contraseña cambiada con éxito."
  },
  "fr": {
    "change_password": "Modifier le mot de passe",
    "current_password": "Mot de passe actuel",
    "new_password": "Nouveau mot de passe",
    "confirm_new_password": "Confirmer le nouveau mot de passe",
    "change_password_button": "Modifier le mot de passe",
    "passwords_must_match": "Les mots de passe doivent correspondre.",
    "password_changed_successfully": "Mot de passe modifié avec succès."
  },
  "ko": {
    "change_password": "비밀번호 변경",
    "current_password": "현재 비밀번호",
    "new_password": "새 비밀번호",
    "confirm_new_password": "새 비밀번호 확인",
    "change_password_button": "비밀번호 변경",
    "passwords_must_match": "비밀번호가 일치해야 합니다.",
    "password_changed_successfully": "비밀번호가 변경되었습니다."
  },
  "pt": {
    "change_password": "Alterar Senha",
    "current_password": "Senha Atual",
    "new_password": "Nova Senha",
    "confirm_new_password": "Confirmar Nova Senha",
    "change_password_button": "Alterar Senha",
    "passwords_must_match": "As senhas devem corresponder.",
    "password_changed_successfully": "Senha alterada com sucesso."
  },
  "uk": {
    "change_password": "Змінити пароль",
    "current_password": "Поточний пароль",
    "new_password": "Новий пароль",
    "confirm_new_password": "Підтвердіть новий пароль",
    "change_password_button": "Змінити пароль",
    "passwords_must_match": "Паролі повинні збігатися.",
    "password_changed_successfully": "Пароль успішно змінено."
  }
}
</i18n>
