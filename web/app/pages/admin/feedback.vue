<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        Admin Feedback Review
      </h1>

      <div class="mbl-tabs">
        <ul>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'open' }"
              @click.prevent="setView('open')"
            >
              Open
            </a>
          </li>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'resolved' }"
              @click.prevent="setView('resolved')"
            >
              Resolved
            </a>
          </li>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'archived' }"
              @click.prevent="setView('archived')"
            >
              Archived
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
            <div class="mbl-field mbl-field--addons mbl-field--flush" role="group" aria-label="Pagination">
              <p class="mbl-control">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  :disabled="page <= 1"
                  aria-label="Previous page"
                  @click="onPageChanged(page - 1)"
                >
                  <caret-left-icon width="10px" height="18px" fill="currentColor" />
                </button>
              </p>
              <div class="mbl-control">
                <div class="mbl-select mbl-select--sm">
                  <select :value="page" aria-label="Page" @change="onPageChanged(Number(($event.target as HTMLSelectElement).value))">
                    <option v-for="p in totalPages" :key="p" :value="p">
                      Page {{ p }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="mbl-control">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  :disabled="page >= totalPages"
                  aria-label="Next page"
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
              {{ feedback.kind }}
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
                {{ feedback.owner ? 'user' : 'guest' }}
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
                  Resolve
                </button>
              </template>
              <template v-else-if="feedback.status === 'resolved'">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'open')"
                >
                  Reopen
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'archived')"
                >
                  Archive
                </button>
              </template>
              <template v-else>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'open')"
                >
                  Reopen
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setStatus(feedback, 'resolved')"
                >
                  Unarchive
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--danger"
                  type="button"
                  @click="deleteFeedback(feedback)"
                >
                  Delete
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

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

const resultsSummary = computed(() => {
  const s = summary.value;
  if (s.kind === 'none') { return 'No feedback'; }
  if (s.kind === 'all') { return `Showing all ${s.total} ${pluralize(s.total, 'item', 'items')}`; }
  return `Showing ${s.first}–${s.last} of ${s.total} ${pluralize(s.total, 'item', 'items')}`;
});
const emptyMessage = computed(() => {
  if (view.value === 'resolved') { return 'There is no resolved feedback.'; }
  if (view.value === 'archived') { return 'There is no archived feedback.'; }
  return 'There is no open feedback.';
});

function formatDateTime(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD hh:mm a');
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
    await dialogStore.alert({ message: 'Unable to update feedback.' });
  }
}

async function deleteFeedback(feedback: Feedback) {
  const confirmed = await dialogStore.confirm({
    message: 'Are you sure you want to permanently delete this feedback? This action cannot be undone.',
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  try {
    await $http.delete(`/api/admin/feedback/${feedback._id}`);
    await loadFeedbacks();
  }
  catch {
    await dialogStore.alert({ message: 'Unable to delete feedback.' });
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
  padding: 0.5rem 1rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  border-bottom: 1px solid var(--mbl-border-soft);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.feedback-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem 1rem;
  border: 1px solid var(--mbl-border);
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
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
  padding: 0.5rem 0;
  word-break: break-word;
}

.feedback-card__email {
  align-self: center;
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.feedback-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.2em 0.45em;
  border-radius: 0.25rem;
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
