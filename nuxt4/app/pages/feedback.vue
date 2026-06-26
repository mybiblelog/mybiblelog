<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">{{ t('feedback_form') }}</h1>
      <div class="mbl-content">
        <p>{{ t('intro_p1') }}</p>
        <p>{{ t('intro_p2') }}</p>
      </div>

      <form data-testid="feedback-form" @submit.prevent="submitFeedback">
        <div v-if="errors._form" class="mbl-help mbl-help--danger">{{ errors._form }}</div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('your_email') }}</label>
          <div class="mbl-control">
            <input
              v-model="form.email"
              class="mbl-input"
              type="email"
              data-testid="feedback-email"
              :placeholder="t('your_email')"
              :disabled="authStore.loggedIn"
            >
            <div v-if="errors.email" class="mbl-help mbl-help--danger">{{ errors.email }}</div>
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('what_kind') }}</label>
          <div class="mbl-control">
            <div class="mbl-select">
              <select v-model="form.kind" data-testid="feedback-kind">
                <option value="bug">{{ t('bug_report') }}</option>
                <option value="feature">{{ t('feature_request') }}</option>
                <option value="comment">{{ t('general_comment') }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('feedback_details') }}</label>
          <div class="mbl-control">
            <textarea v-model="form.message" class="mbl-textarea" data-testid="feedback-message" :placeholder="t('feedback_details')" />
          </div>
        </div>
        <div class="mbl-field">
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="submit" data-testid="feedback-submit">
              {{ t('submit_feedback') }}
            </button>
          </div>
        </div>
      </form>

      <ContentPageFooter />
    </div>
  </main>
</template>

<script setup lang="ts">
import ContentPageFooter from '~/components/content/PageFooter.vue';
import { useAuthStore } from '~/stores/auth';
import { useDialogStore } from '~/stores/dialog';
import { ApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';

const { t } = useI18n();
useHead({ title: () => t('feedback_form'), meta: [{ name: 'robots', content: 'noindex' }] });

const authStore = useAuthStore();
const dialogStore = useDialogStore();

const initialForm = () => ({
  email: authStore.user?.email || '',
  kind: 'bug',
  message: '',
});

const form = ref(initialForm());
const errors = ref<Record<string, string>>({});

async function submitFeedback() {
  errors.value = {};
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: { email: form.value.email, kind: form.value.kind, message: form.value.message },
    });
    form.value = initialForm();
    await dialogStore.alert({ message: t('feedback_submitted') });
  }
  catch (err) {
    const mapped = err instanceof ApiError ? mapFormErrors(err) : null;
    errors.value = (mapped || { _form: t('unknown_error') }) as Record<string, string>;
  }
}
</script>

<i18n lang="json">
{
  "en": {
    "feedback_form": "Feedback Form",
    "intro_p1": "Use this form to submit feedback for My Bible Log.",
    "intro_p2": "Bug reports, feature requests, and general comments are all welcome.",
    "your_email": "Your Email",
    "what_kind": "What kind of feedback are you submitting?",
    "bug_report": "Bug Report",
    "feature_request": "Feature Request",
    "general_comment": "General Comment",
    "feedback_details": "Feedback Details",
    "submit_feedback": "Submit Feedback",
    "feedback_submitted": "Feedback submitted successfully. Thank you!",
    "unknown_error": "An unknown error occurred. Please try again."
  },
  "de": { "feedback_form": "Feedback-Formular", "intro_p1": "Verwenden Sie dieses Formular, um Feedback für My Bible Log einzureichen.", "intro_p2": "Fehlerberichte, Funktionsanfragen und allgemeine Kommentare sind willkommen.", "your_email": "Ihre E-Mail", "what_kind": "Welche Art von Feedback reichen Sie ein?", "bug_report": "Fehlerbericht", "feature_request": "Funktionsanfrage", "general_comment": "Allgemeiner Kommentar", "feedback_details": "Feedback-Details", "submit_feedback": "Feedback einreichen", "feedback_submitted": "Feedback erfolgreich übermittelt. Vielen Dank!", "unknown_error": "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut." },
  "es": { "feedback_form": "Formulario de Comentarios", "intro_p1": "Utilice este formulario para enviar comentarios sobre My Bible Log.", "intro_p2": "Los informes de errores, las solicitudes de funciones y los comentarios generales son bienvenidos.", "your_email": "Tu Correo Electrónico", "what_kind": "¿Qué tipo de comentarios estás enviando?", "bug_report": "Informe de Error", "feature_request": "Solicitud de Función", "general_comment": "Comentario General", "feedback_details": "Detalles de los Comentarios", "submit_feedback": "Enviar Comentarios", "feedback_submitted": "Comentarios enviados con éxito. ¡Gracias!", "unknown_error": "Ocurrió un error desconocido. Por favor, inténtelo de nuevo." },
  "fr": { "feedback_form": "Formulaire de Commentaires", "intro_p1": "Utilisez ce formulaire pour soumettre des commentaires pour My Bible Log.", "intro_p2": "Les rapports de bogues, les demandes de fonctionnalités et les commentaires généraux sont les bienvenus.", "your_email": "Votre Adresse E-mail", "what_kind": "Quel type de commentaires soumettez-vous?", "bug_report": "Rapport de Bug", "feature_request": "Demande de Fonctionnalité", "general_comment": "Commentaire Général", "feedback_details": "Détails des Commentaires", "submit_feedback": "Soumettre des Commentaires", "feedback_submitted": "Commentaires soumis avec succès. Merci!", "unknown_error": "Une erreur inconnue s'est produite. Veuillez réessayer." },
  "ko": { "feedback_form": "피드백 양식", "intro_p1": "이 양식을 통해 My Bible Log에 대한 피드백을 보내주세요.", "intro_p2": "버그 신고, 기능 제안, 일반 의견 모두 환영합니다.", "your_email": "이메일", "what_kind": "어떤 종류의 피드백인가요?", "bug_report": "버그 신고", "feature_request": "기능 제안", "general_comment": "일반 의견", "feedback_details": "피드백 내용", "submit_feedback": "피드백 제출하기", "feedback_submitted": "피드백이 성공적으로 제출되었습니다. 감사합니다!", "unknown_error": "알 수 없는 오류가 발생했습니다. 다시 시도해 주세요." },
  "pt": { "feedback_form": "Formulário de Feedback", "intro_p1": "Use este formulário para enviar feedback para My Bible Log.", "intro_p2": "Relatórios de bugs, solicitações de recursos e comentários gerais são bem-vindos.", "your_email": "Seu Email", "what_kind": "Que tipo de feedback você está enviando?", "bug_report": "Relatório de Bug", "feature_request": "Solicitação de Recurso", "general_comment": "Comentário Geral", "feedback_details": "Detalhes do Feedback", "submit_feedback": "Enviar Feedback", "feedback_submitted": "Feedback enviado com sucesso. Obrigado!", "unknown_error": "Ocorreu um erro desconhecido. Por favor, tente novamente." },
  "uk": { "feedback_form": "Форма зворотнього зв'язку", "intro_p1": "Використовуйте цю форму для надсилання відгуків про My Bible Log.", "intro_p2": "Звіти про помилки, запити на функції та загальні коментарі вітаються.", "your_email": "Ваша електронна пошта", "what_kind": "Якого роду відгук ви надаєте?", "bug_report": "Звіт про помилку", "feature_request": "Запит функції", "general_comment": "Загальний коментар", "feedback_details": "Деталі відгуку", "submit_feedback": "Надіслати відгук", "feedback_submitted": "Відгук успішно надіслано. Дякуємо!", "unknown_error": "Сталася невідома помилка. Будь ласка, спробуйте ще раз." }
}
</i18n>
