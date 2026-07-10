<template>
  <div class="resend-verification-email">
    <template v-if="lastResult === 'sent'">
      <article class="mbl-message mbl-message--success">
        <div class="mbl-message__body">
          {{ t('verification_email_sent') }}
        </div>
      </article>
    </template>
    <template v-else>
      <div class="mbl-button-group">
        <button
          class="mbl-button"
          :class="{ 'mbl-button--primary': canResend, 'mbl-button--static': !canResend }"
          :disabled="!canResend"
          @click.prevent="onResend"
        >
          {{ t('resend_verification_email') }}
        </button>
      </div>
      <p v-if="lastResult === 'error'" class="mbl-help mbl-help--danger">
        {{ t('verification_email_failed') }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ApiError, UnknownApiError } from '~/helpers/api-error';

const props = withDefaults(defineProps<{
  email: string;
  initialSecondsUntilCanRetry?: number;
}>(), { initialSecondsUntilCanRetry: 0 });

const { $http } = useNuxtApp();
const { t, locale: i18nLocale } = useI18n();

const secondsRemaining = ref(0);
const loading = ref(false);
const lastResult = ref<'sent' | 'error' | null>(null);
let timerId: ReturnType<typeof setInterval> | null = null;

const normalizedEmail = computed(() => String(props.email || '').trim().toLowerCase());
const canResend = computed(() => !loading.value && secondsRemaining.value <= 0 && Boolean(normalizedEmail.value));

function clearTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startCountdown(seconds: number) {
  clearTimer();
  secondsRemaining.value = Math.max(0, Number(seconds) || 0);
  if (secondsRemaining.value <= 0) { return; }
  timerId = setInterval(() => {
    if (secondsRemaining.value <= 1) {
      secondsRemaining.value = 0;
      lastResult.value = null;
      clearTimer();
    }
    else {
      secondsRemaining.value -= 1;
    }
  }, 1000);
}

onMounted(() => {
  if (props.initialSecondsUntilCanRetry > 0) {
    startCountdown(props.initialSecondsUntilCanRetry);
  }
});

onBeforeUnmount(() => clearTimer());

async function onResend() {
  if (!canResend.value) { return; }
  loading.value = true;
  lastResult.value = null;
  try {
    const data = await $http.post<{ success?: boolean; secondsUntilCanRetry?: number }>(
      '/api/auth/verify-email/resend',
      { email: normalizedEmail.value, locale: i18nLocale.value },
    );
    const secondsUntilCanRetry = Number((data as any)?.secondsUntilCanRetry) || 0;
    startCountdown(secondsUntilCanRetry);
    lastResult.value = (data as any)?.success ? 'sent' : null;
  }
  catch (err) {
    const error = err instanceof ApiError ? err : new UnknownApiError();
    // eslint-disable-next-line no-console
    console.error('Failed to resend verification email', error);
    lastResult.value = 'error';
  }
  finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.resend-verification-email {
  margin: 1rem 0;
}
</style>

<i18n lang="json">
{
  "en": {
    "resend_verification_email": "Resend verification email",
    "resend_available_in": "Resend available in {time}",
    "verification_email_sent": "Verification email sent.",
    "verification_email_failed": "Could not resend verification email. Please try again later."
  },
  "de": {
    "resend_verification_email": "Bestätigungs-E-Mail erneut senden",
    "resend_available_in": "Erneut senden möglich in {time}",
    "verification_email_sent": "Bestätigungs-E-Mail wurde gesendet.",
    "verification_email_failed": "Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut."
  },
  "es": {
    "resend_verification_email": "Reenviar correo de verificación",
    "resend_available_in": "Reenvío disponible en {time}",
    "verification_email_sent": "Correo de verificación enviado.",
    "verification_email_failed": "No se pudo reenviar el correo de verificación. Por favor, inténtalo de nuevo más tarde."
  },
  "fr": {
    "resend_verification_email": "Renvoyer l'e-mail de vérification",
    "resend_available_in": "Renvoi disponible dans {time}",
    "verification_email_sent": "E-mail de vérification envoyé.",
    "verification_email_failed": "Impossible de renvoyer l'e-mail de vérification. Veuillez réessayer plus tard."
  },
  "ko": {
    "resend_verification_email": "인증 이메일 다시 보내기",
    "resend_available_in": "{time} 후에 다시 보낼 수 있습니다",
    "verification_email_sent": "인증 이메일을 보냈습니다.",
    "verification_email_failed": "인증 이메일을 다시 보낼 수 없습니다. 나중에 다시 시도해 주세요."
  },
  "pt": {
    "resend_verification_email": "Reenviar e-mail de verificação",
    "resend_available_in": "Reenvio disponível em {time}",
    "verification_email_sent": "E-mail de verificação enviado.",
    "verification_email_failed": "Não foi possível reenviar o e-mail de verificação. Tente novamente mais tarde."
  },
  "uk": {
    "resend_verification_email": "Надіслати лист підтвердження ще раз",
    "resend_available_in": "Повторна відправка доступна через {time}",
    "verification_email_sent": "Лист підтвердження надіслано.",
    "verification_email_failed": "Не вдалося надіслати лист підтвердження. Будь ласка, спробуйте пізніше."
  }
}
</i18n>
