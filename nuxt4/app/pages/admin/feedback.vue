<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        Admin Feedback Review
      </h1>

      <div class="feedback-page__view-toggle">
        <button
          class="mbl-button mbl-button--sm mbl-button--light"
          :class="{ 'mbl-button--primary': view === 'inbox' }"
          type="button"
          @click="setView('inbox')"
        >
          Inbox
        </button>
        <button
          class="mbl-button mbl-button--sm mbl-button--light"
          :class="{ 'mbl-button--primary': view === 'archive' }"
          type="button"
          @click="setView('archive')"
        >
          Archive
        </button>
      </div>

      <div v-if="!feedbacks.length && !loading">
        <p>{{ view === 'archive' ? 'There is no archived feedback.' : 'There is no feedback in the inbox.' }}</p>
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
              <span v-if="feedback.resolved" class="feedback-badge feedback-badge--resolved">resolved</span>
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
              <template v-if="!feedback.archived">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="toggleResolved(feedback)"
                >
                  {{ feedback.resolved ? 'Mark Unresolved' : 'Mark Resolved' }}
                </button>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setArchived(feedback, true)"
                >
                  Archive
                </button>
              </template>
              <template v-else>
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click="setArchived(feedback, false)"
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
import AdminUserDetailModal from '~/components/admin/AdminUserDetailModal.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import { useDialogStore } from '~/stores/dialog';

definePageMeta({ middleware: ['auth'], auth: 'admin' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const PAGE_LIMIT = 10;

interface Feedback {
  _id: string;
  createdAt: string;
  kind: string;
  message: string;
  email: string;
  owner?: string;
  ip?: string;
  resolved: boolean;
  archived: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  size: number;
  totalPages: number;
}

const { $http } = useNuxtApp();
const dialogStore = useDialogStore();

const view = ref<'inbox' | 'archive'>('inbox');
const feedbacks = ref<Feedback[]>([]);
const loading = ref(false);
const pagination = ref<Pagination>({ page: 1, limit: PAGE_LIMIT, size: 0, totalPages: 1 });
const selectedUser = ref<{ email: string } | null>(null);

const page = computed(() => pagination.value.page);
const totalPages = computed(() => Math.max(1, pagination.value.totalPages));
const resultsSummary = computed(() => {
  const { size, page: p, limit } = pagination.value;
  if (!size) { return 'No feedback'; }
  if (size <= limit) { return `Showing all ${size}`; }
  const first = (p - 1) * limit + 1;
  const last = Math.min(first + feedbacks.value.length - 1, size);
  return `Showing ${first}–${last} of ${size}`;
});

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    const offset = (page.value - 1) * PAGE_LIMIT;
    const archived = view.value === 'archive';
    const { data, meta } = await $http.get<{
      data: Feedback[];
      meta: {
        pagination: {
          offset: number;
          limit: number;
          size: number;
        }
      }
    }>(`/api/admin/feedback?offset=${offset}&limit=${PAGE_LIMIT}&archived=${archived}`);
    feedbacks.value = data;
    const p = (meta && meta.pagination) || {};
    const limit = Number(p.limit || PAGE_LIMIT);
    const size = Number(p.size || 0);
    const resolvedOffset = Number(p.offset || 0);
    pagination.value = {
      limit,
      size,
      page: Math.floor(resolvedOffset / limit) + 1,
      totalPages: Math.max(1, Math.ceil(size / limit)),
    };
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

function setView(newView: 'inbox' | 'archive') {
  if (view.value === newView) { return; }
  view.value = newView;
  pagination.value = { ...pagination.value, page: 1 };
  loadFeedbacks();
}

function onPageChanged(newPage: number) {
  const clamped = Math.min(Math.max(newPage, 1), totalPages.value);
  if (clamped === page.value) { return; }
  pagination.value = { ...pagination.value, page: clamped };
  loadFeedbacks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function toggleResolved(feedback: Feedback) {
  try {
    await $http.put(`/api/admin/feedback/${feedback._id}`, { resolved: !feedback.resolved });
    feedback.resolved = !feedback.resolved;
  }
  catch {
    await dialogStore.alert({ message: 'Unable to update feedback.' });
  }
}

async function setArchived(feedback: Feedback, archived: boolean) {
  try {
    await $http.put(`/api/admin/feedback/${feedback._id}`, { archived });
    await loadFeedbacks();
  }
  catch {
    await dialogStore.alert({ message: `Unable to ${archived ? 'archive' : 'unarchive'} feedback.` });
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
.feedback-page__view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feedback-page__results-bar {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem - 1px);
  z-index: 10;
  background: var(--mbl-app-canvas-bg);
  padding: 0.5rem 1rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  border-bottom: 1px solid var(--mbl-border-soft);
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
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

.feedback-badge--resolved {
  background-color: var(--mbl-success);
  color: var(--neutral-0);
}
</style>
