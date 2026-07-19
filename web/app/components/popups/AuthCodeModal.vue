<template>
  <app-modal :open="store.isOpen" :title="title" @close="close">
    <template #content>
      <div class="auth-code-modal">
        <p
          v-if="showEmailStep"
          class="mbl-content auth-code-modal__instructions"
        >
          {{ t('reset_email_prompt') }}
        </p>
        <p
          v-else-if="!verified"
          class="mbl-content auth-code-modal__instructions"
        >
          {{ t('instructions') }}
        </p>
        <p
          v-else
          class="mbl-content auth-code-modal__verified"
          data-testid="auth-code-verified"
        >
          {{ verifiedMessage }}
        </p>
        <p v-if="displayEmail && !verified && !showEmailStep" class="auth-code-modal__email">
          <strong>{{ displayEmail }}</strong>
        </p>
        <div v-if="formError" class="mbl-help mbl-help--danger" data-testid="auth-code-error">
          {{ $terr(formError) }}
        </div>

        <!-- Step 0 (reset-password only): enter the account email to receive a code -->
        <div v-if="showEmailStep" class="mbl-field">
          <label class="mbl-label" for="authEmail">{{ t('email_label') }}</label>
          <div class="mbl-control">
            <input
              id="authEmail"
              ref="emailInput"
              v-model="emailModel"
              class="mbl-input"
              type="email"
              autocomplete="email"
              :disabled="submitting"
              data-testid="auth-code-email"
              @keyup.enter="submitEmailRequest"
            >
          </div>
        </div>

        <!-- Step 1: enter the emailed code (all flows) -->
        <div v-else-if="!verified" class="mbl-field">
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
        <form v-else-if="showPasswordStep" @submit.prevent="submitResetComplete">
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
        v-if="showEmailStep"
        class="mbl-button mbl-button--primary"
        :disabled="submitting"
        data-testid="auth-code-send-code"
        @click="submitEmailRequest"
      >
        {{ t('send_code') }}
      </button>
      <button
        v-else-if="showPasswordStep"
        class="mbl-button mbl-button--primary"
        :disabled="submitting"
        data-testid="auth-code-password-submit"
        @click="submitResetComplete"
      >
        {{ t('submit') }}
      </button>
      <button
        v-else-if="!verified"
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

// How long the "Code verified…" confirmation lingers before the verify-email and
// change-email flows finish and close/redirect, so the user sees it register.
const VERIFIED_NOTICE_MS = 900;

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
// reset-password owns its own email step: the flow opens here (email pre-filled
// from the login form when available), sends the reset request itself, then
// advances to the code step. `requestSent` marks that transition.
const emailModel = ref('');
const requestSent = ref(false);
// True once the emailed code has been accepted, for every flow. It swaps the
// helper text for a confirmation and (for reset-password) reveals the password
// step; verify-email/change-email briefly show the notice, then complete.
const verified = ref(false);
const submitting = ref(false);
const formError = ref<ApiErrorDetail | string | null>(null);

const emailInput = ref<HTMLInputElement | null>(null);
const codeInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);

// The address the code was sent to (change-email delivers to the new address,
// so it differs from `store.email`, which stays the current/lookup address).
const displayEmail = computed(() => store.sentToEmail || store.email);

// Only reset-password shows the email step, and only until its request is sent.
const showEmailStep = computed(() => store.flow === 'reset-password' && !requestSent.value);
const showPasswordStep = computed(() => store.flow === 'reset-password' && verified.value);

const verifiedMessage = computed(() => {
  switch (store.flow) {
  case 'reset-password': return t('verified_reset');
  case 'change-email': return t('verified_change');
  default: return t('verified_verify');
  }
});

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
  // Pre-fill the email step from whatever the opener passed (e.g. the login form).
  emailModel.value = store.email;
  requestSent.value = false;
  verified.value = false;
  submitting.value = false;
  formError.value = null;
}

function focusCode() {
  nextTick(() => codeInput.value?.focus());
}

// Focus the input for whichever step the modal opens on.
function focusInitial() {
  nextTick(() => (showEmailStep.value ? emailInput.value : codeInput.value)?.focus());
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

// Briefly hold the "Code verified…" notice so it registers before a flow that
// otherwise completes and closes/redirects instantly.
function showVerifiedNotice() {
  verified.value = true;
  return new Promise(resolve => setTimeout(resolve, VERIFIED_NOTICE_MS));
}

async function submitVerify() {
  await $http.post('/api/auth/verify-email', { email: store.email, code: code.value });
  await showVerifiedNotice();
  await completeSignedIn();
}

async function submitChangeEmail() {
  await $http.post('/api/auth/change-email/complete', { email: store.email, code: code.value });
  await showVerifiedNotice();
  await authStore.refreshUser();
  postAuthEvent({ type: 'completed', flow: store.flow, email: store.email });
  toastStore.add({ type: 'success', text: t('change_email_success') });
  close();
}

// reset-password email step: send the reset request, then move to code entry.
// The endpoint intentionally succeeds even for unknown emails (no enumeration),
// so we advance whenever the request itself doesn't error.
async function submitEmailRequest() {
  if (submitting.value) { return; }
  const email = emailModel.value.trim();
  if (!email) {
    formError.value = t('email_required');
    return;
  }
  submitting.value = true;
  formError.value = null;
  try {
    await $http.post('/api/auth/password/reset', { email });
    store.email = email;
    requestSent.value = true;
    focusCode();
  }
  catch (err) {
    setError(err);
  }
  finally {
    submitting.value = false;
  }
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
  verified.value = true;
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
  if (value.length === CODE_LENGTH && !submitting.value && !verified.value && store.isOpen) {
    submitCode();
  }
});

// Reset and focus whenever the modal opens.
watch(() => store.isOpen, (isOpen) => {
  if (isOpen) {
    resetLocalState();
    focusInitial();
  }
});

// Re-focus the active step's input when the tab regains focus — the user has
// usually just switched to their email app to read the code.
function onWindowFocus() {
  if (import.meta.client && document.visibilityState === 'hidden') { return; }
  if (!store.isOpen || verified.value) { return; }
  focusInitial();
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
    "verified_reset": "Code verified. Choose your new password.",
    "verified_verify": "Code verified. Signing you in…",
    "verified_change": "Code verified. Updating your email…",
    "reset_email_prompt": "Enter your account email and we'll send a code to reset your password.",
    "email_label": "Email",
    "email_required": "Your email address is required.",
    "send_code": "Send code",
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
    "verified_reset": "Code bestätigt. Wählen Sie Ihr neues Passwort.",
    "verified_verify": "Code bestätigt. Sie werden angemeldet…",
    "verified_change": "Code bestätigt. Ihre E-Mail wird aktualisiert…",
    "reset_email_prompt": "Geben Sie Ihre Konto-E-Mail-Adresse ein, und wir senden Ihnen einen Code zum Zurücksetzen Ihres Passworts.",
    "email_label": "E-Mail",
    "email_required": "Ihre E-Mail-Adresse ist erforderlich.",
    "send_code": "Code senden",
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
    "verified_reset": "Código verificado. Elige tu nueva contraseña.",
    "verified_verify": "Código verificado. Iniciando sesión…",
    "verified_change": "Código verificado. Actualizando tu correo electrónico…",
    "reset_email_prompt": "Introduce el correo de tu cuenta y te enviaremos un código para restablecer tu contraseña.",
    "email_label": "Correo electrónico",
    "email_required": "Su dirección de correo electrónico es obligatoria.",
    "send_code": "Enviar código",
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
    "verified_reset": "Code vérifié. Choisissez votre nouveau mot de passe.",
    "verified_verify": "Code vérifié. Connexion en cours…",
    "verified_change": "Code vérifié. Mise à jour de votre e-mail…",
    "reset_email_prompt": "Saisissez l'e-mail de votre compte et nous vous enverrons un code pour réinitialiser votre mot de passe.",
    "email_label": "Email",
    "email_required": "Votre adresse e-mail est requise.",
    "send_code": "Envoyer le code",
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
    "verified_reset": "코드가 확인되었습니다. 새 비밀번호를 입력하세요.",
    "verified_verify": "코드가 확인되었습니다. 로그인 중…",
    "verified_change": "코드가 확인되었습니다. 이메일을 업데이트하는 중…",
    "reset_email_prompt": "계정 이메일을 입력하시면 비밀번호 재설정 코드를 보내드립니다.",
    "email_label": "이메일",
    "email_required": "이메일 주소를 입력해 주세요.",
    "send_code": "코드 보내기",
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
    "verified_reset": "Código verificado. Escolha sua nova senha.",
    "verified_verify": "Código verificado. Entrando…",
    "verified_change": "Código verificado. Atualizando seu e-mail…",
    "reset_email_prompt": "Digite o e-mail da sua conta e enviaremos um código para redefinir sua senha.",
    "email_label": "E-mail",
    "email_required": "Seu endereço de e-mail é obrigatório.",
    "send_code": "Enviar código",
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
    "verified_reset": "Код підтверджено. Виберіть новий пароль.",
    "verified_verify": "Код підтверджено. Вхід у систему…",
    "verified_change": "Код підтверджено. Оновлення вашої електронної пошти…",
    "reset_email_prompt": "Введіть електронну адресу облікового запису, і ми надішлемо код для скидання пароля.",
    "email_label": "Електронна пошта",
    "email_required": "Ваша електронна адреса обов'язкова.",
    "send_code": "Надіслати код",
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
