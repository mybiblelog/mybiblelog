<template>
  <div class="no-print">
    <button
      v-if="authStore.loggedIn"
      class="floating-action-button"
      data-testid="floating-feedback-button"
      :aria-label="t('give_feedback')"
      :disabled="!mounted"
      @click="openModal"
    >
      <feedback-icon fill="var(--mbl-on-accent)" width="28px" height="28px" />
    </button>

    <div v-if="feedbackModalStore.open" class="mbl-modal mbl-modal--active" role="dialog" data-testid="modal">
      <div class="mbl-modal__backdrop" @click="close" />
      <div class="mbl-modal__card">
        <header class="mbl-modal__head">
          <p class="mbl-modal__title">
            {{ t('feedback_form') }}
          </p>
          <button class="mbl-delete" type="button" aria-label="close" data-testid="modal-close" @click.prevent="close" />
        </header>
        <section class="mbl-modal__body">
          <div class="mbl-content">
            <p>{{ t('intro_p1') }}</p>
            <p>{{ t('intro_p2') }}</p>
          </div>
          <form data-testid="feedback-form" @submit.prevent="submitFeedback">
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
                <textarea v-model="form.message" class="mbl-textarea" data-testid="feedback-message" :placeholder="t('feedback_details')" />
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
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FeedbackIcon from '~/components/svg/FeedbackIcon.vue';
import { useAuthStore } from '~/stores/auth';
import { useDialogStore } from '~/stores/dialog';
import { useFeedbackModalStore } from '~/stores/feedback-modal';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';

const { t } = useI18n();
const authStore = useAuthStore();
const dialogStore = useDialogStore();
const feedbackModalStore = useFeedbackModalStore();

const mounted = ref(false);
onMounted(() => { mounted.value = true; });

const initialForm = () => ({
  email: authStore.user?.email || '',
  kind: 'bug',
  message: '',
});

const form = ref(initialForm());
const errors = ref<Record<string, unknown>>({});
const submitting = ref(false);

const isDirty = computed(() =>
  form.value.message !== '' || form.value.kind !== 'bug',
);

function openModal() {
  form.value = initialForm();
  errors.value = {};
  feedbackModalStore.openModal();
}

async function close() {
  if (isDirty.value) {
    const confirmed = await dialogStore.confirm({
      message: t('are_you_sure_close'),
    });
    if (!confirmed) { return; }
  }
  feedbackModalStore.closeModal();
}

async function submitFeedback() {
  if (submitting.value) { return; }
  submitting.value = true;
  errors.value = {};
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: { email: form.value.email, kind: form.value.kind, message: form.value.message },
    });
    form.value = initialForm();
    await dialogStore.alert({ message: t('feedback_submitted') });
    feedbackModalStore.closeModal();
  }
  catch (err) {
    errors.value = (err instanceof ApiError ? mapFormErrors(err) : null) || mapFormErrors(new UnknownApiError()) || {};
  }
  finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.floating-action-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--secondary-color);
  color: var(--mbl-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--mbl-overlay-15);
  transition: all 0.3s ease;
  z-index: var(--z-index-action-button);
  text-decoration: none;
  border: none;
  cursor: pointer;
}
.floating-action-button:hover {
  background-color: var(--secondary-color-hover);
  box-shadow: 0 6px 16px var(--mbl-overlay-20);
  transform: translateY(-2px);
}
</style>

<i18n lang="json">
{
  "en": {
    "give_feedback": "Give Feedback",
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
    "are_you_sure_close": "Are you sure you want to close the feedback form? All unsaved changes will be lost."
  },
  "de": { "give_feedback": "Feedback geben", "feedback_form": "Feedback-Formular", "intro_p1": "Verwenden Sie dieses Formular, um Feedback für My Bible Log einzureichen.", "intro_p2": "Fehlerberichte, Funktionsanfragen und allgemeine Kommentare sind willkommen.", "your_email": "Ihre E-Mail", "what_kind": "Welche Art von Feedback reichen Sie ein?", "bug_report": "Fehlerbericht", "feature_request": "Funktionsanfrage", "general_comment": "Allgemeiner Kommentar", "feedback_details": "Feedback-Details", "submit_feedback": "Feedback einreichen", "feedback_submitted": "Feedback erfolgreich übermittelt. Vielen Dank!", "are_you_sure_close": "Möchten Sie das Feedback-Formular wirklich schließen? Alle ungespeicherten Änderungen gehen verloren." },
  "es": { "give_feedback": "Dar Comentarios", "feedback_form": "Formulario de Comentarios", "intro_p1": "Utilice este formulario para enviar comentarios sobre My Bible Log.", "intro_p2": "Los informes de errores, las solicitudes de funciones y los comentarios generales son bienvenidos.", "your_email": "Tu Correo Electrónico", "what_kind": "¿Qué tipo de comentarios estás enviando?", "bug_report": "Informe de Error", "feature_request": "Solicitud de Función", "general_comment": "Comentario General", "feedback_details": "Detalles de los Comentarios", "submit_feedback": "Enviar Comentarios", "feedback_submitted": "Comentarios enviados con éxito. ¡Gracias!", "are_you_sure_close": "¿Estás seguro de que quieres cerrar el formulario de comentarios? Todas las modificaciones no guardadas se perderán." },
  "fr": { "give_feedback": "Donner des Commentaires", "feedback_form": "Formulaire de Commentaires", "intro_p1": "Utilisez ce formulaire pour soumettre des commentaires pour My Bible Log.", "intro_p2": "Les rapports de bogues, les demandes de fonctionnalités et les commentaires généraux sont les bienvenus.", "your_email": "Votre Adresse E-mail", "what_kind": "Quel type de commentaires soumettez-vous?", "bug_report": "Rapport de Bug", "feature_request": "Demande de Fonctionnalité", "general_comment": "Commentaire Général", "feedback_details": "Détails des Commentaires", "submit_feedback": "Soumettre des Commentaires", "feedback_submitted": "Commentaires soumis avec succès. Merci!", "are_you_sure_close": "Êtes-vous sûr de vouloir fermer le formulaire de commentaires ? Toutes les modifications non enregistrées seront perdues." },
  "ko": { "give_feedback": "피드백 보내기", "feedback_form": "피드백 양식", "intro_p1": "이 양식을 통해 My Bible Log에 대한 피드백을 보내주세요.", "intro_p2": "버그 신고, 기능 제안, 일반 의견 모두 환영합니다.", "your_email": "이메일", "what_kind": "어떤 종류의 피드백인가요?", "bug_report": "버그 신고", "feature_request": "기능 제안", "general_comment": "일반 의견", "feedback_details": "피드백 내용", "submit_feedback": "피드백 제출하기", "feedback_submitted": "피드백이 성공적으로 제출되었습니다. 감사합니다!", "are_you_sure_close": "피드백 양식을 닫을까요? 저장하지 않은 변경 내용이 사라집니다." },
  "pt": { "give_feedback": "Dar Feedback", "feedback_form": "Formulário de Feedback", "intro_p1": "Use este formulário para enviar feedback para My Bible Log.", "intro_p2": "Relatórios de bugs, solicitações de recursos e comentários gerais são bem-vindos.", "your_email": "Seu Email", "what_kind": "Que tipo de feedback você está enviando?", "bug_report": "Relatório de Bug", "feature_request": "Solicitação de Recurso", "general_comment": "Comentário Geral", "feedback_details": "Detalhes do Feedback", "submit_feedback": "Enviar Feedback", "feedback_submitted": "Feedback enviado com sucesso. Obrigado!", "are_you_sure_close": "Tem certeza de que deseja fechar o formulário de feedback? Todas as modificações não salvas serão perdidas." },
  "uk": { "give_feedback": "Залишити відгук", "feedback_form": "Форма зворотнього зв'язку", "intro_p1": "Використовуйте цю форму для надсилання відгуків про My Bible Log.", "intro_p2": "Звіти про помилки, запити на функції та загальні коментарі вітаються.", "your_email": "Ваша електронна пошта", "what_kind": "Якого роду відгук ви надаєте?", "bug_report": "Звіт про помилку", "feature_request": "Запит функції", "general_comment": "Загальний коментар", "feedback_details": "Деталі відгуку", "submit_feedback": "Надіслати відгук", "feedback_submitted": "Відгук успішно надіслано. Дякуємо!", "are_you_sure_close": "Ви впевнені, що хочете закрити форму зворотного зв'язку? Всі незбережені зміни будуть втрачені." }
}
</i18n>
