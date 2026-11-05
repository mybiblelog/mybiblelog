<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ t('feedback_form') }}
      </h1>
      <div class="mbl-content">
        <p>{{ t('intro_p1') }}</p>
        <p>{{ t('intro_p2') }}</p>
      </div>

      <form data-testid="feedback-form" novalidate @submit.prevent="submitFeedback">
        <div v-if="errors._form" class="mbl-help mbl-help--danger">
          {{ $terr(errors._form) }}
        </div>
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
            <div v-if="errors.email" class="mbl-help mbl-help--danger" data-testid="feedback-email-error">
              {{ fieldError(errors.email) }}
            </div>
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('what_kind') }}</label>
          <div class="mbl-control">
            <div class="mbl-select">
              <select v-model="form.kind" data-testid="feedback-kind">
                <option value="bug">
                  {{ t('bug_report') }}
                </option>
                <option value="feature">
                  {{ t('feature_request') }}
                </option>
                <option value="comment">
                  {{ t('general_comment') }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('feedback_details') }}</label>
          <div class="mbl-control">
            <textarea
              v-model="form.message"
              class="mbl-textarea"
              data-testid="feedback-message"
              :maxlength="FEEDBACK_MESSAGE_MAX_LENGTH"
              :placeholder="t('feedback_details')"
            />
            <div v-if="errors.message" class="mbl-help mbl-help--danger" data-testid="feedback-message-error">
              {{ fieldError(errors.message) }}
            </div>
          </div>
        </div>
        <div class="mbl-field">
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="submit" data-testid="feedback-submit" :disabled="submitting">
              {{ t('submit_feedback') }}
            </button>
          </div>
        </div>
      </form>
    </div>
    <content-page-footer />
  </main>
</template>

<script setup lang="ts">
import ContentPageFooter from '~/components/content/PageFooter.vue';
import { useAuthStore } from '~/stores/auth';
import { useDialogStore } from '~/stores/dialog';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { FEEDBACK_MESSAGE_MAX_LENGTH, validateFeedbackForm } from '~/helpers/feedback-form';

const { t, te } = useI18n();
const { $http, $terr } = useNuxtApp();
useHead({ title: () => t('feedback_form'), meta: [{ name: 'robots', content: 'noindex' }] });

const authStore = useAuthStore();
const dialogStore = useDialogStore();

const initialForm = () => ({
  email: authStore.user?.email || '',
  kind: 'bug',
  message: '',
});

const form = ref(initialForm());
const errors = ref<Record<string, ApiErrorDetail>>({});
const submitting = ref(false);

// Prefer this form's own wording for the field errors it knows about (e.g.
// `message_required`), falling back to the generic API error translation.
const fieldError = (detail: ApiErrorDetail) => {
  const key = `${detail.field}_${detail.code}`;
  return te(key) ? t(key) : $terr(detail);
};

async function submitFeedback() {
  if (submitting.value) { return; }
  errors.value = validateFeedbackForm(form.value);
  if (Object.keys(errors.value).length) { return; }
  submitting.value = true;
  try {
    await $http.post('/api/feedback', {
      email: form.value.email,
      kind: form.value.kind,
      message: form.value.message,
    });
    form.value = initialForm();
    await dialogStore.alert({ message: t('feedback_submitted') });
  }
  catch (err) {
    errors.value = mapFormErrors(err instanceof ApiError ? err : new UnknownApiError());
  }
  finally {
    submitting.value = false;
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
    "message_required": "Please enter your feedback.",
    "email_required": "Please enter your email address.",
    "email_not_valid": "Please enter a valid email address."
  },
  "de": {
    "feedback_form": "Feedback-Formular",
    "intro_p1": "Verwenden Sie dieses Formular, um Feedback für My Bible Log einzureichen.",
    "intro_p2": "Fehlerberichte, Funktionsanfragen und allgemeine Kommentare sind willkommen.",
    "your_email": "Ihre E-Mail",
    "what_kind": "Welche Art von Feedback reichen Sie ein?",
    "bug_report": "Fehlerbericht",
    "feature_request": "Funktionsanfrage",
    "general_comment": "Allgemeiner Kommentar",
    "feedback_details": "Feedback-Details",
    "submit_feedback": "Feedback einreichen",
    "feedback_submitted": "Feedback erfolgreich übermittelt. Vielen Dank!",
    "message_required": "Bitte geben Sie Ihr Feedback ein.",
    "email_required": "Bitte geben Sie Ihre E-Mail-Adresse ein.",
    "email_not_valid": "Bitte geben Sie eine gültige E-Mail-Adresse ein."
  },
  "es": {
    "feedback_form": "Formulario de Comentarios",
    "intro_p1": "Utilice este formulario para enviar comentarios sobre My Bible Log.",
    "intro_p2": "Los informes de errores, las solicitudes de funciones y los comentarios generales son bienvenidos.",
    "your_email": "Tu Correo Electrónico",
    "what_kind": "¿Qué tipo de comentarios estás enviando?",
    "bug_report": "Informe de Error",
    "feature_request": "Solicitud de Función",
    "general_comment": "Comentario General",
    "feedback_details": "Detalles de los Comentarios",
    "submit_feedback": "Enviar Comentarios",
    "feedback_submitted": "Comentarios enviados con éxito. ¡Gracias!",
    "message_required": "Por favor, escriba sus comentarios.",
    "email_required": "Por favor, ingrese su correo electrónico.",
    "email_not_valid": "Por favor, ingrese un correo electrónico válido."
  },
  "fr": {
    "feedback_form": "Formulaire de Commentaires",
    "intro_p1": "Utilisez ce formulaire pour soumettre des commentaires pour My Bible Log.",
    "intro_p2": "Les rapports de bogues, les demandes de fonctionnalités et les commentaires généraux sont les bienvenus.",
    "your_email": "Votre Adresse E-mail",
    "what_kind": "Quel type de commentaires soumettez-vous?",
    "bug_report": "Rapport de Bug",
    "feature_request": "Demande de Fonctionnalité",
    "general_comment": "Commentaire Général",
    "feedback_details": "Détails des Commentaires",
    "submit_feedback": "Soumettre des Commentaires",
    "feedback_submitted": "Commentaires soumis avec succès. Merci!",
    "message_required": "Veuillez saisir vos commentaires.",
    "email_required": "Veuillez saisir votre adresse e-mail.",
    "email_not_valid": "Veuillez saisir une adresse e-mail valide."
  },
  "ko": {
    "feedback_form": "피드백 양식",
    "intro_p1": "이 양식을 통해 My Bible Log에 대한 피드백을 보내주세요.",
    "intro_p2": "버그 신고, 기능 제안, 일반 의견 모두 환영합니다.",
    "your_email": "이메일",
    "what_kind": "어떤 종류의 피드백인가요?",
    "bug_report": "버그 신고",
    "feature_request": "기능 제안",
    "general_comment": "일반 의견",
    "feedback_details": "피드백 내용",
    "submit_feedback": "피드백 제출하기",
    "feedback_submitted": "피드백이 성공적으로 제출되었습니다. 감사합니다!",
    "message_required": "피드백 내용을 입력해 주세요.",
    "email_required": "이메일을 입력해 주세요.",
    "email_not_valid": "올바른 이메일 주소를 입력해 주세요."
  },
  "pt": {
    "feedback_form": "Formulário de Feedback",
    "intro_p1": "Use este formulário para enviar feedback para My Bible Log.",
    "intro_p2": "Relatórios de bugs, solicitações de recursos e comentários gerais são bem-vindos.",
    "your_email": "Seu Email",
    "what_kind": "Que tipo de feedback você está enviando?",
    "bug_report": "Relatório de Bug",
    "feature_request": "Solicitação de Recurso",
    "general_comment": "Comentário Geral",
    "feedback_details": "Detalhes do Feedback",
    "submit_feedback": "Enviar Feedback",
    "feedback_submitted": "Feedback enviado com sucesso. Obrigado!",
    "message_required": "Por favor, escreva seu feedback.",
    "email_required": "Por favor, insira seu email.",
    "email_not_valid": "Por favor, insira um email válido."
  },
  "uk": {
    "feedback_form": "Форма зворотнього зв'язку",
    "intro_p1": "Використовуйте цю форму для надсилання відгуків про My Bible Log.",
    "intro_p2": "Звіти про помилки, запити на функції та загальні коментарі вітаються.",
    "your_email": "Ваша електронна пошта",
    "what_kind": "Якого роду відгук ви надаєте?",
    "bug_report": "Звіт про помилку",
    "feature_request": "Запит функції",
    "general_comment": "Загальний коментар",
    "feedback_details": "Деталі відгуку",
    "submit_feedback": "Надіслати відгук",
    "feedback_submitted": "Відгук успішно надіслано. Дякуємо!",
    "message_required": "Будь ласка, введіть ваш відгук.",
    "email_required": "Будь ласка, введіть вашу електронну пошту.",
    "email_not_valid": "Будь ласка, введіть дійсну адресу електронної пошти."
  }
}
</i18n>
