<template>
  <div class="resend-verification-email">
    <template v-if="lastResult === 'sent'">
      <article class="mbl-message mbl-message--success">
        <div class="mbl-message__body">
          {{ $t('verification_email_sent') }}
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
          {{ $t('resend_verification_email') }}
        </button>
      </div>
      <p v-if="lastResult === 'error'" class="mbl-help mbl-help--danger">
        {{ $t('verification_email_failed') }}
      </p>
    </template>
  </div>
</template>

<script>
import { ApiError, UnknownApiError } from '~/helpers/api-error';

export default {
  name: 'ResendVerificationEmail',
  props: {
    email: {
      type: String,
      required: true,
    },
    initialSecondsUntilCanRetry: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      secondsRemaining: 0,
      loading: false,
      timerId: null,
      lastResult: null, // 'sent' | 'error' | null
    };
  },
  computed: {
    formattedTimeRemaining() {
      const total = Math.max(0, this.secondsRemaining);
      const mm = String(Math.floor(total / 60)).padStart(2, '0');
      const ss = String(total % 60).padStart(2, '0');
      return `${mm}:${ss}`;
    },
    canResend() {
      return !this.loading && this.secondsRemaining <= 0 && Boolean(this.normalizedEmail);
    },
    normalizedEmail() {
      return String(this.email || '').trim().toLowerCase();
    },
  },
  mounted() {
    if (this.initialSecondsUntilCanRetry > 0) {
      this.startCountdown(this.initialSecondsUntilCanRetry);
    }
  },
  beforeDestroy() {
    this.clearTimer();
  },
  methods: {
    clearTimer() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    },
    startCountdown(seconds) {
      this.clearTimer();
      this.secondsRemaining = Math.max(0, Number(seconds) || 0);
      if (this.secondsRemaining <= 0) {
        return;
      }

      this.timerId = setInterval(() => {
        if (this.secondsRemaining <= 1) {
          this.secondsRemaining = 0;
          this.lastResult = null;
          this.clearTimer();
        }
        else {
          this.secondsRemaining -= 1;
        }
      }, 1000);
    },
    async onResend() {
      if (!this.canResend) {
        return;
      }
      this.loading = true;
      this.lastResult = null;
      try {
        const { data } = await this.$http.post('/api/auth/resend-email-verification', {
          email: this.normalizedEmail,
          locale: this.$i18n.locale,
        });
        const secondsUntilCanRetry = Number(data?.secondsUntilCanRetry) || 0;
        this.startCountdown(secondsUntilCanRetry);
        this.lastResult = data?.success ? 'sent' : null;
      }
      catch (err) {
        const error = (err instanceof ApiError ? err : new UnknownApiError());
        // eslint-disable-next-line no-console
        console.error('Failed to resend verification email', error);
        this.lastResult = 'error';
      }
      finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.resend-verification-email {
  margin: 1rem 0;
}
</style>

<i18n lang="json">
{
  "de": {
    "resend_verification_email": "Bestätigungs-E-Mail erneut senden",
    "resend_available_in": "Erneut senden möglich in {time}",
    "verification_email_sent": "Bestätigungs-E-Mail wurde gesendet.",
    "verification_email_failed": "Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut."
  },
  "en": {
    "resend_verification_email": "Resend verification email",
    "resend_available_in": "Resend available in {time}",
    "verification_email_sent": "Verification email sent.",
    "verification_email_failed": "Could not resend verification email. Please try again later."
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
