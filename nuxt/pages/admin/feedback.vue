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

          <div v-if="pagerTotalPages > 1" class="feedback-page__pager">
            <div class="mbl-field mbl-field--addons mbl-field--flush" role="group" aria-label="Pagination">
              <p class="mbl-control">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  :disabled="pagerPage <= 1"
                  aria-label="Previous page"
                  @click="onPageChanged(pagerPage - 1)"
                >
                  <caret-left-icon width="10px" height="18px" fill="currentColor" />
                </button>
              </p>

              <div class="mbl-control">
                <div class="mbl-select mbl-select--sm">
                  <select
                    :value="pagerPage"
                    aria-label="Page"
                    @change="onPageChanged(Number($event.target.value))"
                  >
                    <option v-for="p in pagerTotalPages" :key="p" :value="p">
                      Page {{ p }}
                    </option>
                  </select>
                </div>
              </div>

              <p class="mbl-control">
                <button
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  :disabled="pagerPage >= pagerTotalPages"
                  aria-label="Next page"
                  @click="onPageChanged(pagerPage + 1)"
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
              {{ dayjs(feedback.createdAt).format('YYYY-MM-DD hh:mm a') }}
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

<script>
import dayjs from 'dayjs';
import AdminUserDetailModal from '@/components/admin/AdminUserDetailModal';
import CaretLeftIcon from '@/components/svg/CaretLeftIcon';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
import { useDialogStore } from '~/stores/dialog';

const PAGE_LIMIT = 10;

export default {
  name: 'AdminFeedbackReviewPage',
  components: {
    AdminUserDetailModal,
    CaretLeftIcon,
    CaretRightIcon,
  },
  middleware: ['auth'],
  meta: {
    auth: 'admin',
  },
  data() {
    return {
      view: 'open',
      feedbacks: [],
      loading: false,
      pagination: { page: 1, limit: PAGE_LIMIT, size: 0, totalPages: 1 },
      selectedUser: null,
    };
  },
  computed: {
    pagerPage() {
      return Number((this.pagination && this.pagination.page) || 1);
    },
    pagerTotalPages() {
      return Math.max(1, Number((this.pagination && this.pagination.totalPages) || 1));
    },
    resultsSummary() {
      const { size, page, limit } = this.pagination;
      if (!size) { return 'No feedback'; }
      if (size <= limit) { return `Showing all ${size}`; }
      const first = (page - 1) * limit + 1;
      const last = Math.min(first + this.feedbacks.length - 1, size);
      return `Showing ${first}–${last} of ${size}`;
    },
    emptyMessage() {
      if (this.view === 'resolved') { return 'There is no resolved feedback.'; }
      if (this.view === 'archived') { return 'There is no archived feedback.'; }
      return 'There is no open feedback.';
    },
  },
  mounted() {
    this.loadFeedbacks();
  },
  methods: {
    dayjs,
    async loadFeedbacks() {
      this.loading = true;
      try {
        const offset = (this.pagerPage - 1) * PAGE_LIMIT;
        const url = `/api/admin/feedback?offset=${offset}&limit=${PAGE_LIMIT}&status=${this.view}`;
        const { data: feedbacks, meta } = await this.$http.get(url);
        this.feedbacks = feedbacks;
        const p = (meta && meta.pagination) || {};
        const limit = Number(p.limit || PAGE_LIMIT);
        const size = Number(p.size || 0);
        const resolvedOffset = Number(p.offset || 0);
        this.pagination = {
          limit,
          size,
          page: Math.floor(resolvedOffset / limit) + 1,
          totalPages: Math.max(1, Math.ceil(size / limit)),
        };
      }
      catch {
        this.feedbacks = [];
      }
      finally {
        this.loading = false;
      }
    },
    feedbackKindClass(kind) {
      return {
        'mbl-text-success': kind === 'feature',
        'mbl-text-warning': kind === 'question' || kind === 'comment',
        'mbl-text-danger': kind === 'bug',
      };
    },
    openUserFromFeedback(feedback) {
      this.selectedUser = { email: feedback.email };
    },
    closeUserDetails() {
      this.selectedUser = null;
    },
    setView(newView) {
      if (this.view === newView) { return; }
      this.view = newView;
      this.pagination = { ...this.pagination, page: 1 };
      this.loadFeedbacks();
    },
    onPageChanged(newPage) {
      const clamped = Math.min(Math.max(Number(newPage || 1), 1), this.pagerTotalPages);
      if (clamped === this.pagerPage) { return; }
      this.pagination = { ...this.pagination, page: clamped };
      this.loadFeedbacks();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    async setStatus(feedback, status) {
      const dialogStore = useDialogStore();
      try {
        await this.$http.patch(`/api/admin/feedback/${feedback._id}`, { status });
        await this.loadFeedbacks();
      }
      catch {
        await dialogStore.alert({ message: 'Unable to update feedback.' });
      }
    },
    async deleteFeedback(feedback) {
      const dialogStore = useDialogStore();
      const confirmed = await dialogStore.confirm({
        message: 'Are you sure you want to permanently delete this feedback? This action cannot be undone.',
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }
      try {
        await this.$http.delete(`/api/admin/feedback/${feedback._id}`);
        await this.loadFeedbacks();
      }
      catch {
        await dialogStore.alert({ message: 'Unable to delete feedback.' });
      }
    },
  },
};
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
