<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        {{ t('title') }}
      </h1>

      <div class="mbl-tabs">
        <ul>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'open' }"
              @click.prevent="setView('open')"
            >
              {{ t('tab_open') }}
            </a>
          </li>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'resolved' }"
              @click.prevent="setView('resolved')"
            >
              {{ t('tab_resolved') }}
            </a>
          </li>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'archived' }"
              @click.prevent="setView('archived')"
            >
              {{ t('tab_archived') }}
            </a>
          </li>
        </ul>
      </div>

      <div v-if="!feedbacks.length && !loading">
        <p>{{ emptyMessage }}</p>
      </div>

      <template v-else>
        <div class="feedback-page__results-bar">
          <div class="mbl-text-small mbl-text-muted">
            {{ resultsSummary }}
          </div>
          <div v-if="totalPages > 1" class="feedback-page__pager">
            <div class="mbl-field mbl-field--addons mbl-field--flush" role="group" :aria-label="t('aria_pagination')">
              <p class="mbl-control">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  :disabled="page <= 1"
                  :aria-label="t('aria_previous_page')"
                  @click="onPageChanged(page - 1)"
                >
                  <caret-left-icon width="10px" height="18px" fill="currentColor" />
                </button>
              </p>
              <div class="mbl-control">
                <div class="mbl-select mbl-select--sm">
                  <select :value="page" :aria-label="t('aria_page')" @change="onPageChanged(Number(($event.target as HTMLSelectElement).value))">
                    <option v-for="p in totalPages" :key="p" :value="p">
                      {{ t('page_number', { page: p }) }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="mbl-control">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  :disabled="page >= totalPages"
                  :aria-label="t('aria_next_page')"
                  @click="onPageChanged(page + 1)"
                >
                  <caret-right-icon width="10px" height="18px" fill="currentColor" />
                </button>
              </p>
            </div>
          </div>
        </div>

        <div class="feedback-cards">
          <div v-for="feedback in feedbacks" :key="feedback._id" class="feedback-card">
            <div class="feedback-card__date mbl-text-small mbl-text-muted">
              {{ formatDateTime(feedback.createdAt) }}
            </div>
            <div class="feedback-card__kind mbl-text-small" :class="feedbackKindClass(feedback.kind)">
              {{ feedbackKindLabel(feedback.kind) }}
            </div>
            <div class="feedback-card__message">
              {{ feedback.message }}
            </div>
            <div class="feedback-card__email mbl-text-small">
              <button v-if="feedback.owner" class="feedback-card__email-button" type="button" @click="openUserFromFeedback(feedback)">
                {{ feedback.email }}
              </button>
              <span v-else class="feedback-card__email-text">{{ feedback.email }}</span>
              <span class="feedback-badge" :class="feedback.owner ? 'feedback-badge--user' : 'feedback-badge--guest'">
                {{ feedback.owner ? t('badge_user') : t('badge_guest') }}
              </span>
            </div>
            <div class="feedback-card__ip mbl-text-small mbl-text-muted">
              {{ feedback.ip }}
            </div>
            <div class="feedback-card__actions">
              <template v-if="feedback.status === 'open'">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'resolved')"
                >
                  {{ t('resolve') }}
                </button>
              </template>
              <template v-else-if="feedback.status === 'resolved'">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'open')"
                >
                  {{ t('reopen') }}
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'archived')"
                >
                  {{ t('archive') }}
                </button>
              </template>
              <template v-else>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'open')"
                >
                  {{ t('reopen') }}
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'resolved')"
                >
                  {{ t('unarchive') }}
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--danger"
                  type="button"
                  @click="deleteFeedback(feedback)"
                >
                  {{ t('delete') }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>

    <admin-user-detail-modal
      :user="selectedUser"
      :open="!!selectedUser"
      :allow-delete="false"
      @close="closeUserDetails"
    />
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import AdminUserDetailModal from '~/components/admin/AdminUserDetailModal.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import { useDialogStore } from '~/stores/dialog';

definePageMeta({ middleware: ['auth'], auth: 'admin' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const PAGE_LIMIT = 10;

type FeedbackStatus = 'open' | 'resolved' | 'archived';

interface Feedback {
  _id: string;
  createdAt: string;
  kind: string;
  message: string;
  email: string;
  owner?: string;
  ip?: string;
  status: FeedbackStatus;
}

const { $http } = useNuxtApp();
const { t } = useI18n();
const dialogStore = useDialogStore();

const view = ref<FeedbackStatus>('open');
const feedbacks = ref<Feedback[]>([]);
const loading = ref(false);
const selectedUser = ref<{ email: string } | null>(null);

const { page, totalPages, offset, summary, applyServerMeta, goToPage: onPageChanged, reset: resetToFirstPage } = usePagedResource({
  limit: PAGE_LIMIT,
  load: loadFeedbacks,
  scrollToTopOnPageChange: true,
});

const resultsSummary = computed(() => {
  const s = summary.value;
  if (s.kind === 'none') { return t('summary_none'); }
  if (s.kind === 'all') { return t('summary_all', { total: s.total }); }
  return t('summary_range', { first: s.first, last: s.last, total: s.total });
});
const emptyMessage = computed(() => {
  if (view.value === 'resolved') { return t('empty_resolved'); }
  if (view.value === 'archived') { return t('empty_archived'); }
  return t('empty_open');
});

function formatDateTime(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD hh:mm a');
}

// Kinds come back raw from the API; anything unrecognized (e.g. a kind retired
// from the submission form) falls back to the stored value.
const FEEDBACK_KIND_KEYS: Record<string, string> = {
  bug: 'kind_bug',
  feature: 'kind_feature',
  comment: 'kind_comment',
  question: 'kind_question',
};

function feedbackKindLabel(kind: string) {
  const key = FEEDBACK_KIND_KEYS[kind];
  return key ? t(key) : kind;
}

function feedbackKindClass(kind: string) {
  return {
    'mbl-text-success': kind === 'feature',
    'mbl-text-warning': kind === 'question' || kind === 'comment',
    'mbl-text-danger': kind === 'bug',
  };
}

async function loadFeedbacks() {
  loading.value = true;
  try {
    const url = `/api/admin/feedback?offset=${offset.value}&limit=${PAGE_LIMIT}&status=${view.value}`;
    const { data, meta } = await $http.get<Feedback[]>(url);
    feedbacks.value = data;
    const p = (meta as { pagination?: { offset?: number; size?: number } } | undefined)?.pagination || {};
    applyServerMeta(p, feedbacks.value.length);
  }
  catch {
    feedbacks.value = [];
  }
  finally {
    loading.value = false;
  }
}

function openUserFromFeedback(feedback: Feedback) {
  selectedUser.value = { email: feedback.email };
}

function closeUserDetails() {
  selectedUser.value = null;
}

function setView(newView: FeedbackStatus) {
  if (view.value === newView) { return; }
  view.value = newView;
  resetToFirstPage();
  loadFeedbacks();
}

async function setStatus(feedback: Feedback, status: FeedbackStatus) {
  try {
    await $http.patch(`/api/admin/feedback/${feedback._id}`, { status });
    await loadFeedbacks();
  }
  catch {
    await dialogStore.alert({ message: t('error_update') });
  }
}

async function deleteFeedback(feedback: Feedback) {
  const confirmed = await dialogStore.confirm({
    message: t('confirm_delete'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  try {
    await $http.delete(`/api/admin/feedback/${feedback._id}`);
    await loadFeedbacks();
  }
  catch {
    await dialogStore.alert({ message: t('error_delete') });
  }
}

onMounted(() => { loadFeedbacks(); });
</script>

<style scoped>
.feedback-page__results-bar {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem - 1px);
  z-index: 10;
  background: var(--mbl-app-canvas-bg);
  padding: var(--mbl-space-xs) var(--mbl-space-md);
  margin-left: calc(-1 * var(--mbl-space-xs));
  margin-right: calc(-1 * var(--mbl-space-xs));
  border-bottom: 1px solid var(--mbl-border-soft);
  margin-bottom: var(--mbl-space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mbl-space-md);
}

.feedback-cards {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-md);
}

.feedback-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mbl-space-xs) var(--mbl-space-md);
  border: 1px solid var(--mbl-border);
  border-radius: var(--mbl-radius-lg);
  padding: var(--mbl-space-sm) var(--mbl-space-md);
}

.feedback-card__date {
  align-self: center;
}

.feedback-card__kind {
  text-align: right;
  align-self: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.feedback-card__message {
  grid-column: 1 / -1;
  padding: var(--mbl-space-xs) 0;
  word-break: break-word;
}

.feedback-card__email {
  align-self: center;
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
  min-width: 0;
}

.feedback-card__email-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.feedback-card__email-button {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--mbl-link);
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
}

.feedback-card__ip {
  text-align: right;
  align-self: center;
}

.feedback-card__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: var(--mbl-space-xs);
  margin-top: var(--mbl-space-2xs);
}

.feedback-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.2em 0.45em;
  border-radius: var(--mbl-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.feedback-badge--user {
  background-color: var(--mbl-success);
  color: var(--neutral-0);
}

.feedback-badge--guest {
  background-color: var(--mbl-text-muted);
  color: var(--neutral-0);
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "Admin Feedback Review",
    "tab_open": "Open",
    "tab_resolved": "Resolved",
    "tab_archived": "Archived",
    "empty_open": "There is no open feedback.",
    "empty_resolved": "There is no resolved feedback.",
    "empty_archived": "There is no archived feedback.",
    "summary_none": "No feedback",
    "summary_all": "Showing all {total}",
    "summary_range": "Showing {first}–{last} of {total}",
    "aria_pagination": "Pagination",
    "aria_previous_page": "Previous page",
    "aria_next_page": "Next page",
    "aria_page": "Page",
    "page_number": "Page {page}",
    "kind_bug": "Bug",
    "kind_feature": "Feature",
    "kind_comment": "Comment",
    "kind_question": "Question",
    "badge_user": "user",
    "badge_guest": "guest",
    "resolve": "Resolve",
    "reopen": "Reopen",
    "archive": "Archive",
    "unarchive": "Unarchive",
    "delete": "Delete",
    "confirm_delete": "Are you sure you want to permanently delete this feedback? This action cannot be undone.",
    "error_update": "Unable to update feedback.",
    "error_delete": "Unable to delete feedback."
  },
  "de": {
    "title": "Feedback-Übersicht",
    "tab_open": "Offen",
    "tab_resolved": "Erledigt",
    "tab_archived": "Archiviert",
    "empty_open": "Es gibt kein offenes Feedback.",
    "empty_resolved": "Es gibt kein erledigtes Feedback.",
    "empty_archived": "Es gibt kein archiviertes Feedback.",
    "summary_none": "Kein Feedback",
    "summary_all": "Alle {total} werden angezeigt",
    "summary_range": "{first}–{last} von {total} werden angezeigt",
    "aria_pagination": "Seitennummerierung",
    "aria_previous_page": "Vorherige Seite",
    "aria_next_page": "Nächste Seite",
    "aria_page": "Seite",
    "page_number": "Seite {page}",
    "kind_bug": "Fehler",
    "kind_feature": "Funktion",
    "kind_comment": "Kommentar",
    "kind_question": "Frage",
    "badge_user": "Benutzer",
    "badge_guest": "Gast",
    "resolve": "Erledigen",
    "reopen": "Wieder öffnen",
    "archive": "Archivieren",
    "unarchive": "Aus Archiv holen",
    "delete": "Löschen",
    "confirm_delete": "Möchten Sie dieses Feedback wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    "error_update": "Feedback konnte nicht aktualisiert werden.",
    "error_delete": "Feedback konnte nicht gelöscht werden."
  },
  "es": {
    "title": "Revisión de Comentarios",
    "tab_open": "Abiertos",
    "tab_resolved": "Resueltos",
    "tab_archived": "Archivados",
    "empty_open": "No hay comentarios abiertos.",
    "empty_resolved": "No hay comentarios resueltos.",
    "empty_archived": "No hay comentarios archivados.",
    "summary_none": "Sin comentarios",
    "summary_all": "Mostrando todos los {total}",
    "summary_range": "Mostrando {first}–{last} de {total}",
    "aria_pagination": "Paginación",
    "aria_previous_page": "Página anterior",
    "aria_next_page": "Página siguiente",
    "aria_page": "Página",
    "page_number": "Página {page}",
    "kind_bug": "Error",
    "kind_feature": "Función",
    "kind_comment": "Comentario",
    "kind_question": "Pregunta",
    "badge_user": "usuario",
    "badge_guest": "invitado",
    "resolve": "Resolver",
    "reopen": "Reabrir",
    "archive": "Archivar",
    "unarchive": "Desarchivar",
    "delete": "Eliminar",
    "confirm_delete": "¿Seguro que quieres eliminar permanentemente este comentario? Esta acción no se puede deshacer.",
    "error_update": "No se pudo actualizar el comentario.",
    "error_delete": "No se pudo eliminar el comentario."
  },
  "fr": {
    "title": "Revue des Retours d'Information",
    "tab_open": "Ouverts",
    "tab_resolved": "Résolus",
    "tab_archived": "Archivés",
    "empty_open": "Il n'y a aucun retour ouvert.",
    "empty_resolved": "Il n'y a aucun retour résolu.",
    "empty_archived": "Il n'y a aucun retour archivé.",
    "summary_none": "Aucun retour",
    "summary_all": "Affichage des {total}",
    "summary_range": "Affichage de {first}–{last} sur {total}",
    "aria_pagination": "Pagination",
    "aria_previous_page": "Page précédente",
    "aria_next_page": "Page suivante",
    "aria_page": "Page",
    "page_number": "Page {page}",
    "kind_bug": "Bogue",
    "kind_feature": "Fonctionnalité",
    "kind_comment": "Commentaire",
    "kind_question": "Question",
    "badge_user": "utilisateur",
    "badge_guest": "invité",
    "resolve": "Résoudre",
    "reopen": "Rouvrir",
    "archive": "Archiver",
    "unarchive": "Désarchiver",
    "delete": "Supprimer",
    "confirm_delete": "Voulez-vous vraiment supprimer définitivement ce retour ? Cette action est irréversible.",
    "error_update": "Impossible de mettre à jour le retour.",
    "error_delete": "Impossible de supprimer le retour."
  },
  "ko": {
    "title": "피드백 검토",
    "tab_open": "미처리",
    "tab_resolved": "처리됨",
    "tab_archived": "보관됨",
    "empty_open": "미처리 피드백이 없습니다.",
    "empty_resolved": "처리된 피드백이 없습니다.",
    "empty_archived": "보관된 피드백이 없습니다.",
    "summary_none": "피드백 없음",
    "summary_all": "전체 {total}건 표시 중",
    "summary_range": "{total}건 중 {first}–{last}건 표시 중",
    "aria_pagination": "페이지 매기기",
    "aria_previous_page": "이전 페이지",
    "aria_next_page": "다음 페이지",
    "aria_page": "페이지",
    "page_number": "{page} 페이지",
    "kind_bug": "버그",
    "kind_feature": "기능",
    "kind_comment": "의견",
    "kind_question": "질문",
    "badge_user": "회원",
    "badge_guest": "비회원",
    "resolve": "처리",
    "reopen": "다시 열기",
    "archive": "보관",
    "unarchive": "보관 해제",
    "delete": "삭제",
    "confirm_delete": "이 피드백을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    "error_update": "피드백을 업데이트할 수 없습니다.",
    "error_delete": "피드백을 삭제할 수 없습니다."
  },
  "pt": {
    "title": "Revisão de Feedback",
    "tab_open": "Abertos",
    "tab_resolved": "Resolvidos",
    "tab_archived": "Arquivados",
    "empty_open": "Não há feedback aberto.",
    "empty_resolved": "Não há feedback resolvido.",
    "empty_archived": "Não há feedback arquivado.",
    "summary_none": "Nenhum feedback",
    "summary_all": "Mostrando todos os {total}",
    "summary_range": "Mostrando {first}–{last} de {total}",
    "aria_pagination": "Paginação",
    "aria_previous_page": "Página anterior",
    "aria_next_page": "Próxima página",
    "aria_page": "Página",
    "page_number": "Página {page}",
    "kind_bug": "Erro",
    "kind_feature": "Recurso",
    "kind_comment": "Comentário",
    "kind_question": "Pergunta",
    "badge_user": "usuário",
    "badge_guest": "visitante",
    "resolve": "Resolver",
    "reopen": "Reabrir",
    "archive": "Arquivar",
    "unarchive": "Desarquivar",
    "delete": "Excluir",
    "confirm_delete": "Tem certeza de que deseja excluir permanentemente este feedback? Esta ação não pode ser desfeita.",
    "error_update": "Não foi possível atualizar o feedback.",
    "error_delete": "Não foi possível excluir o feedback."
  },
  "uk": {
    "title": "Огляд зворотного зв'язку",
    "tab_open": "Відкриті",
    "tab_resolved": "Вирішені",
    "tab_archived": "Архівовані",
    "empty_open": "Немає відкритих відгуків.",
    "empty_resolved": "Немає вирішених відгуків.",
    "empty_archived": "Немає архівованих відгуків.",
    "summary_none": "Немає відгуків",
    "summary_all": "Показано всі {total}",
    "summary_range": "Показано {first}–{last} з {total}",
    "aria_pagination": "Нумерація сторінок",
    "aria_previous_page": "Попередня сторінка",
    "aria_next_page": "Наступна сторінка",
    "aria_page": "Сторінка",
    "page_number": "Сторінка {page}",
    "kind_bug": "Помилка",
    "kind_feature": "Функція",
    "kind_comment": "Коментар",
    "kind_question": "Запитання",
    "badge_user": "користувач",
    "badge_guest": "гість",
    "resolve": "Вирішити",
    "reopen": "Відкрити знову",
    "archive": "Архівувати",
    "unarchive": "Розархівувати",
    "delete": "Видалити",
    "confirm_delete": "Ви впевнені, що хочете назавжди видалити цей відгук? Цю дію не можна скасувати.",
    "error_update": "Не вдалося оновити відгук.",
    "error_delete": "Не вдалося видалити відгук."
  }
}
</i18n>
