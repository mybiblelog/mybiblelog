<template>
  <main>
    <div class="content-column">
      <h1 class="mbl-title">
        Admin Feedback Review
      </h1>

      <div v-if="!feedbacks.length && !loading">
        <p>There are no feedbacks.</p>
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
              <span class="feedback-card__email-text">{{ feedback.email }}</span>
              <span class="feedback-badge" :class="feedback.owner ? 'feedback-badge--user' : 'feedback-badge--guest'">
                {{ feedback.owner ? 'user' : 'guest' }}
              </span>
            </div>
            <div class="feedback-card__ip mbl-text-small mbl-text-muted">
              {{ feedback.ip }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';

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
}

interface Pagination {
  page: number;
  limit: number;
  size: number;
  totalPages: number;
}

const { $http } = useNuxtApp();

const feedbacks = ref<Feedback[]>([]);
const loading = ref(false);
const pagination = ref<Pagination>({ page: 1, limit: PAGE_LIMIT, size: 0, totalPages: 1 });

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
    const { data, meta } = await $http.get(`/api/admin/feedback?offset=${offset}&limit=${PAGE_LIMIT}`);
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

function onPageChanged(newPage: number) {
  const clamped = Math.min(Math.max(newPage, 1), totalPages.value);
  if (clamped === page.value) { return; }
  pagination.value = { ...pagination.value, page: clamped };
  loadFeedbacks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => { loadFeedbacks(); });
</script>

<style scoped>
.feedback-page__results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
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

.feedback-card__ip {
  text-align: right;
  align-self: center;
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
