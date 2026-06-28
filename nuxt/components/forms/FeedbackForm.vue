<template>
  <form data-testid="feedback-form" @submit.prevent="submitFeedback">
    <div v-if="errors._form" class="mbl-help mbl-help--danger">
      <div class="mbl-help mbl-help--danger">
        {{ $terr(errors._form) }}
      </div>
    </div>
    <div class="mbl-field">
      <label class="mbl-label">{{ $t('your_email') }}</label>
      <div class="mbl-control">
        <input
          v-model="form.email"
          class="mbl-input"
          type="email"
          data-testid="feedback-email"
          :placeholder="$t('your_email')"
          :disabled="authStore.loggedIn"
        >
        <div v-if="errors.email" class="mbl-help mbl-help--danger">
          {{ $terr(errors.email) }}
        </div>
      </div>
    </div>
    <div class="mbl-field">
      <label class="mbl-label">{{ $t('what_kind_of_feedback') }}</label>
      <div class="mbl-control">
        <div class="mbl-select">
          <select v-model="form.kind" data-testid="feedback-kind">
            <option value="bug">
              {{ $t('bug_report') }}
            </option>
            <option value="feature">
              {{ $t('feature_request') }}
            </option>
            <option value="comment">
              {{ $t('general_comment') }}
            </option>
          </select>
        </div>
        <div v-if="errors.kind" class="mbl-help mbl-help--danger">
          {{ $terr(errors.kind) }}
        </div>
      </div>
    </div>
    <div class="mbl-field">
      <label class="mbl-label">{{ $t('feedback_details') }}</label>
      <div class="mbl-control">
        <textarea v-model="form.message" class="mbl-textarea" data-testid="feedback-message" :placeholder="$t('feedback_details')" />
        <div v-if="errors.message" class="mbl-help mbl-help--danger">
          {{ $terr(errors.message) }}
        </div>
      </div>
    </div>
    <div class="mbl-field">
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="feedback-submit" :disabled="submitting">
          {{ $t('submit_feedback') }}
        </button>
      </div>
    </div>
  </form>
</template>

<script>
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'FeedbackForm',
  data() {
    const authStore = useAuthStore();
    const initialForm = {
      email: authStore.user?.email || '',
      kind: 'bug',
      message: '',
    };
    return {
      form: { ...initialForm },
      initialForm,
      errors: {},
      submitting: false,
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    isDirty() {
      return this.form.email !== this.initialForm.email ||
        this.form.kind !== this.initialForm.kind ||
        this.form.message !== this.initialForm.message;
    },
  },
  watch: {
    isDirty: {
      immediate: true,
      handler(isDirty) {
        this.$emit('dirty-change', isDirty);
      },
    },
  },
  methods: {
    async submitFeedback() {
      if (this.submitting) {
        return;
      }
      this.submitting = true;
      this.errors = {};
      try {
        await this.$http.post('/api/feedback', {
          email: this.form.email,
          kind: this.form.kind,
          message: this.form.message,
        });

        // Reset the form to its initial state after successful submission
        this.form = { ...this.initialForm };

        const dialogStore = useDialogStore();
        await dialogStore.alert({ message: this.$t('messaging.feedback_submitted') });

        // Emit success event so parent can handle (e.g., close modal)
        this.$emit('success');
      }
      catch (err) {
        this.errors = (err instanceof ApiError ? mapFormErrors(err) : null) || mapFormErrors(new UnknownApiError());
      }
      finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>

</style>

<i18n lang="json">
{
  "en": {
    "your_email": "Your Email",
    "what_kind_of_feedback": "What kind of feedback are you submitting?",
    "bug_report": "Bug Report",
    "feature_request": "Feature Request",
    "general_comment": "General Comment",
    "feedback_details": "Feedback Details",
    "submit_feedback": "Submit Feedback",
    "messaging": {
      "unknown_error": "An unknown error occurred.",
      "feedback_submitted": "Feedback submitted successfully. Thank you!"
    }
  },
  "de": {
    "your_email": "Ihre E-Mail",
    "what_kind_of_feedback": "Welche Art von Feedback reichen Sie ein?",
    "bug_report": "Fehlerbericht",
    "feature_request": "Funktionsanfrage",
    "general_comment": "Allgemeiner Kommentar",
    "feedback_details": "Feedback-Details",
    "submit_feedback": "Feedback einreichen",
    "messaging": {
      "unknown_error": "Ein unbekannter Fehler ist aufgetreten.",
      "feedback_submitted": "Feedback erfolgreich übermittelt. Vielen Dank!"
    }
  },
  "es": {
    "your_email": "Tu Correo Electrónico",
    "what_kind_of_feedback": "¿Qué tipo de comentarios estás enviando?",
    "bug_report": "Informe de Error",
    "feature_request": "Solicitud de Función",
    "general_comment": "Comentario General",
    "feedback_details": "Detalles de los Comentarios",
    "submit_feedback": "Enviar Comentarios",
    "messaging": {
      "unknown_error": "Ocurrió un error desconocido.",
      "feedback_submitted": "Comentarios enviados con éxito. ¡Gracias!"
    }
  },
  "fr": {
    "your_email": "Votre Adresse E-mail",
    "what_kind_of_feedback": "Quel type de commentaires soumettez-vous?",
    "bug_report": "Rapport de Bug",
    "feature_request": "Demande de Fonctionnalité",
    "general_comment": "Commentaire Général",
    "feedback_details": "Détails des Commentaires",
    "submit_feedback": "Soumettre des Commentaires",
    "messaging": {
      "unknown_error": "Une erreur inconnue s'est produite.",
      "feedback_submitted": "Commentaires soumis avec succès. Merci!"
    }
  },
  "ko": {
    "your_email": "이메일",
    "what_kind_of_feedback": "어떤 종류의 피드백인가요?",
    "bug_report": "버그 신고",
    "feature_request": "기능 제안",
    "general_comment": "일반 의견",
    "feedback_details": "피드백 내용",
    "submit_feedback": "피드백 제출하기",
    "messaging": {
      "unknown_error": "알 수 없는 오류가 발생했습니다.",
      "feedback_submitted": "피드백이 성공적으로 제출되었습니다. 감사합니다!"
    }
  },
  "pt": {
    "your_email": "Seu Email",
    "what_kind_of_feedback": "Que tipo de feedback você está enviando?",
    "bug_report": "Relatório de Bug",
    "feature_request": "Solicitação de Recurso",
    "general_comment": "Comentário Geral",
    "feedback_details": "Detalhes do Feedback",
    "submit_feedback": "Enviar Feedback",
    "messaging": {
      "unknown_error": "Ocorreu um erro desconhecido.",
      "feedback_submitted": "Feedback enviado com sucesso. Obrigado!"
    }
  },
  "uk": {
    "your_email": "Ваша електронна пошта",
    "what_kind_of_feedback": "Якого роду відгук ви надаєте?",
    "bug_report": "Звіт про помилку",
    "feature_request": "Запит функції",
    "general_comment": "Загальний коментар",
    "feedback_details": "Деталі відгуку",
    "submit_feedback": "Надіслати відгук",
    "messaging": {
      "unknown_error": "Сталася невідома помилка.",
      "feedback_submitted": "Відгук успішно надіслано. Дякуємо!"
    }
  }
}
</i18n>
