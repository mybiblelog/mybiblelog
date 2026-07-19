<template>
  <app-modal :open="store.isOpen" :title="title" @close="close">
    <template #content>
      <div class="auth-code-modal">
        <p class="mbl-content auth-code-modal__instructions">
          {{ t('instructions') }}
        </p>
        <p v-if="store.email" class="auth-code-modal__email">
          <strong>{{ store.email }}</strong>
        </p>
        <div v-if="formError" class="mbl-help mbl-help--danger" data-testid="auth-code-error">
          {{ $terr(formError) }}
        </div>

        <!-- Step 1: enter the emailed code (all flows) -->
        <div v-if="!showPasswordStep" class="mbl-field">
          <label class="mbl-label" for="authCode">{{ t('code_label') }}</label>
          <div class="mbl-control">
            <input
              id="authCode"
              ref="codeInput"
              :value="code"
              class="mbl-input mbl-input--short"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              :maxlength="CODE_LENGTH"
              :disabled="submitting"
              data-testid="auth-code-input"
              @input="onCodeInput"
              @keyup.enter="submitCode"
            >
          </div>
        </div>

        <!-- Step 2 (reset-password only): choose a new password once the code is valid -->
        <form v-else @submit.prevent="submitResetComplete">
          <div class="mbl-field">
            <label class="mbl-label" for="authNewPassword">{{ t('new_password') }}</label>
            <div class="mbl-control">
              <input
                id="authNewPassword"
                ref="passwordInput"
                v-model="newPassword"
                class="mbl-input"
                type="password"
                name="newPassword"
                data-testid="auth-code-new-password"
              >
            </div>
          </div>
          <div class="mbl-field">
            <label class="mbl-label" for="authConfirmPassword">{{ t('confirm_new_password') }}</label>
            <div class="mbl-control">
              <input
                id="authConfirmPassword"
                v-model="confirmNewPassword"
                class="mbl-input"
                type="password"
                name="confirmNewPassword"
                data-testid="auth-code-confirm-password"
              >
            </div>
          </div>
        </form>
      </div>
    </template>
    <template #footer>
      <button
        v-if="showPasswordStep"
        class="mbl-button mbl-button--primary"
        :disabled="submitting"
        data-testid="auth-code-password-submit"
        @click="submitResetComplete"
      >
        {{ t('submit') }}
      </button>
      <button
        v-else
        class="mbl-button mbl-button--primary"
        :disabled="submitting || code.length !== CODE_LENGTH"
        data-testid="auth-code-submit"
        @click="submitCode"
      >
        {{ submitting ? t('verifying') : t('continue') }}
      </button>
      <button class="mbl-button mbl-button--light" :disabled="submitting" @click="close">
        {{ t('close') }}
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useAuthCodeStore } from '~/stores/auth-code';
import { useAuthStore } from '~/stores/auth';
import { useToastStore } from '~/stores/toast';
import { onAuthEvent, postAuthEvent } from '~/composables/auth-channel';

// Digits in a verification code. Mirrors the API's CODE_LENGTH; kept as a local
// constant so the web app doesn't import from the API package.
const CODE_LENGTH = 6;

const { t } = useI18n();
const store = useAuthCodeStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const localePath = useLocalePath();
const router = useRouter();
const { $http } = useNuxtApp();

const code = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const step = ref<'code' | 'password'>('code');
const submitting = ref(false);
const formError = ref<ApiErrorDetail | string | null>(null);

const codeInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);

const showPasswordStep = computed(() => store.flow === 'reset-password' && step.value === 'password');

const title = computed(() => {
  switch (store.flow) {
    case 'reset-password': return t('title_reset_password');
    case 'change-email': return t('title_change_email');
    default: return t('title_verify_email');
  }
});

function resetLocalState() {
  code.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
  step.value = 'code';
  submitting.value = false;
  formError.value = null;
}

function focusCode() {
  nextTick(() => codeInput.value?.focus());
}

function onCodeInput(event: Event) {
  const target = event.target as HTMLInputElement;
  code.value = target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
  // Keep the DOM value in sync when non-digits were stripped.
  target.value = code.value;
}

function setError(err: unknown) {
  const mapped = mapFormErrors(err instanceof ApiError ? err : new UnknownApiError());
  formError.value = mapped._form ?? null;
}

async function completeSignedIn() {
  await authStore.refreshUser();
  postAuthEvent({ type: 'completed', flow: store.flow, email: store.email });
  close();
  await router.push(localePath('/start'));
}

async function submitVerify() {
  await $http.post('/api/auth/verify-email', { email: store.email, code: code.value });
  await completeSignedIn();
}

async function submitChangeEmail() {
  await $http.post('/api/auth/change-email/complete', { email: store.email, code: code.value });
  await authStore.refreshUser();
  postAuthEvent({ type: 'completed', flow: store.flow, email: store.email });
  toastStore.add({ type: 'success', text: t('change_email_success') });
  close();
}

async function validateResetCode() {
  const { data } = await $http.post<{ valid: boolean }>(
    '/api/auth/password/reset/validate',
    { email: store.email, code: code.value },
  );
  if (!data.valid) {
    formError.value = t('code_invalid');
    code.value = '';
    focusCode();
    return;
  }
  step.value = 'password';
  nextTick(() => passwordInput.value?.focus());
}

async function submitCode() {
  if (submitting.value || code.value.length !== CODE_LENGTH) { return; }
  submitting.value = true;
  formError.value = null;
  try {
    if (store.flow === 'verify-email') { await submitVerify(); }
    else if (store.flow === 'change-email') { await submitChangeEmail(); }
    else { await validateResetCode(); }
  }
  catch (err) {
    setError(err);
    code.value = '';
    focusCode();
  }
  finally {
    submitting.value = false;
  }
}

async function submitResetComplete() {
  if (submitting.value) { return; }
  formError.value = null;
  if (newPassword.value !== confirmNewPassword.value) {
    formError.value = t('passwords_must_match');
    return;
  }
  submitting.value = true;
  try {
    await $http.post('/api/auth/password/reset/complete', {
      email: store.email,
      code: code.value,
      newPassword: newPassword.value,
    });
    await completeSignedIn();
  }
  catch (err) {
    setError(err);
  }
  finally {
    submitting.value = false;
  }
}

function close() {
  store.close();
  resetLocalState();
}

// Auto-submit as soon as a full code is entered (code step only).
watch(code, (value) => {
  if (value.length === CODE_LENGTH && !submitting.value && step.value === 'code' && store.isOpen) {
    submitCode();
  }
});

// Reset and focus whenever the modal opens.
watch(() => store.isOpen, (isOpen) => {
  if (isOpen) {
    resetLocalState();
    focusCode();
  }
});

// Re-focus the code input when the tab regains focus — the user has usually just
// switched to their email app to read the code.
function onWindowFocus() {
  if (import.meta.client && document.visibilityState === 'hidden') { return; }
  if (store.isOpen && step.value === 'code') { focusCode(); }
}

let unsubscribeAuthEvent: (() => void) | null = null;

onMounted(() => {
  // If another tab completes the same flow (e.g. by clicking the magic link),
  // reflect it here and dismiss the waiting modal.
  unsubscribeAuthEvent = onAuthEvent((event) => {
    if (!store.isOpen || event.flow !== store.flow) { return; }
    if (event.email.trim().toLowerCase() !== store.email.trim().toLowerCase()) { return; }

    if (store.flow === 'change-email') {
      authStore.refreshUser();
      toastStore.add({ type: 'success', text: t('change_email_success') });
      close();
    }
    else {
      authStore.refreshUser().then(() => {
        close();
        router.push(localePath('/start'));
      });
    }
  });
  window.addEventListener('focus', onWindowFocus);
  document.addEventListener('visibilitychange', onWindowFocus);
});

onUnmounted(() => {
  unsubscribeAuthEvent?.();
  window.removeEventListener('focus', onWindowFocus);
  document.removeEventListener('visibilitychange', onWindowFocus);
});
</script>

<style scoped>
.auth-code-modal__email {
  margin-bottom: 1rem;
  word-break: break-all;
}
</style>

<i18n lang="json">
{
  "en": {
    "title_verify_email": "Verify your email",
    "title_reset_password": "Reset your password",
    "title_change_email": "Confirm your new email",
    "instructions": "Enter the code from your email, or click the link in the email to verify instantly.",
    "code_label": "Verification code",
    "verifying": "Verifying…",
    "continue": "Continue",
    "submit": "Submit",
    "close": "Close",
    "new_password": "New Password",
    "confirm_new_password": "Confirm New Password",
    "passwords_must_match": "Passwords must match.",
    "code_invalid": "That code is invalid or has expired. Please check your email or request a new code.",
    "change_email_success": "Your email address was updated successfully."
  },
  "de": {
    "title_verify_email": "Bestätigen Sie Ihre E-Mail",
    "title_reset_password": "Passwort zurücksetzen",
    "title_change_email": "Bestätigen Sie Ihre neue E-Mail",
    "instructions": "Geben Sie den Code aus Ihrer E-Mail ein oder klicken Sie auf den Link in der E-Mail, um sich sofort zu verifizieren.",
    "code_label": "Bestätigungscode",
    "verifying": "Wird überprüft…",
    "continue": "Weiter",
    "submit": "Absenden",
    "close": "Schließen",
    "new_password": "Neues Passwort",
    "confirm_new_password": "Neues Passwort bestätigen",
    "passwords_must_match": "Passwörter müssen übereinstimmen.",
    "code_invalid": "Dieser Code ist ungültig oder abgelaufen. Bitte überprüfen Sie Ihre E-Mail oder fordern Sie einen neuen Code an.",
    "change_email_success": "Ihre E-Mail-Adresse wurde erfolgreich aktualisiert."
  },
  "es": {
    "title_verify_email": "Verifica tu correo electrónico",
    "title_reset_password": "Restablece tu contraseña",
    "title_change_email": "Confirma tu nuevo correo electrónico",
    "instructions": "Introduce el código de tu correo electrónico, o haz clic en el enlace del correo para verificar al instante.",
    "code_label": "Código de verificación",
    "verifying": "Verificando…",
    "continue": "Continuar",
    "submit": "Enviar",
    "close": "Cerrar",
    "new_password": "Nueva contraseña",
    "confirm_new_password": "Confirmar nueva contraseña",
    "passwords_must_match": "Las contraseñas deben coincidir.",
    "code_invalid": "Ese código no es válido o ha caducado. Revisa tu correo electrónico o solicita un código nuevo.",
    "change_email_success": "Su dirección de correo electrónico se actualizó correctamente."
  },
  "fr": {
    "title_verify_email": "Vérifiez votre e-mail",
    "title_reset_password": "Réinitialisez votre mot de passe",
    "title_change_email": "Confirmez votre nouvel e-mail",
    "instructions": "Saisissez le code reçu par e-mail, ou cliquez sur le lien dans l'e-mail pour vérifier instantanément.",
    "code_label": "Code de vérification",
    "verifying": "Vérification…",
    "continue": "Continuer",
    "submit": "Soumettre",
    "close": "Fermer",
    "new_password": "Nouveau mot de passe",
    "confirm_new_password": "Confirmer le nouveau mot de passe",
    "passwords_must_match": "Les mots de passe doivent correspondre.",
    "code_invalid": "Ce code est invalide ou expiré. Veuillez vérifier votre e-mail ou demander un nouveau code.",
    "change_email_success": "Votre adresse e-mail a été mise à jour avec succès."
  },
  "ko": {
    "title_verify_email": "이메일 인증",
    "title_reset_password": "비밀번호 재설정",
    "title_change_email": "새 이메일 확인",
    "instructions": "이메일에 있는 코드를 입력하거나, 이메일의 링크를 클릭하면 즉시 인증됩니다.",
    "code_label": "인증 코드",
    "verifying": "인증 중…",
    "continue": "계속",
    "submit": "제출",
    "close": "닫기",
    "new_password": "새 비밀번호",
    "confirm_new_password": "새 비밀번호 확인",
    "passwords_must_match": "비밀번호가 일치해야 합니다.",
    "code_invalid": "코드가 유효하지 않거나 만료되었습니다. 이메일을 확인하거나 새 코드를 요청하세요.",
    "change_email_success": "이메일 주소가 성공적으로 변경되었습니다."
  },
  "pt": {
    "title_verify_email": "Verifique seu e-mail",
    "title_reset_password": "Redefina sua senha",
    "title_change_email": "Confirme seu novo e-mail",
    "instructions": "Insira o código do seu e-mail ou clique no link no e-mail para verificar instantaneamente.",
    "code_label": "Código de verificação",
    "verifying": "Verificando…",
    "continue": "Continuar",
    "submit": "Enviar",
    "close": "Fechar",
    "new_password": "Nova Senha",
    "confirm_new_password": "Confirmar Nova Senha",
    "passwords_must_match": "As senhas devem coincidir.",
    "code_invalid": "Esse código é inválido ou expirou. Verifique seu e-mail ou solicite um novo código.",
    "change_email_success": "Seu endereço de e-mail foi atualizado com sucesso."
  },
  "uk": {
    "title_verify_email": "Підтвердіть свою електронну пошту",
    "title_reset_password": "Скиньте свій пароль",
    "title_change_email": "Підтвердіть свою нову електронну пошту",
    "instructions": "Введіть код із вашого листа або натисніть посилання в листі, щоб миттєво підтвердити.",
    "code_label": "Код підтвердження",
    "verifying": "Перевірка…",
    "continue": "Продовжити",
    "submit": "Надіслати",
    "close": "Закрити",
    "new_password": "Новий пароль",
    "confirm_new_password": "Підтвердіть новий пароль",
    "passwords_must_match": "Паролі повинні збігатися.",
    "code_invalid": "Цей код недійсний або застарів. Перевірте свою електронну пошту або запросіть новий код.",
    "change_email_success": "Ваша електронна адреса була успішно оновлена."
  }
}
</i18n>
