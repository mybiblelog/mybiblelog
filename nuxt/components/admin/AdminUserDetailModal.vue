<template>
  <app-modal
    :open="open"
    title="User Details"
    @close="$emit('close')"
  >
    <template slot="content">
      <div>
        <p class="mbl-text-small mbl-text-muted">
          Email
        </p>
        <p>{{ user?.email || '—' }}</p>
      </div>
      <br>
      <div>
        <p class="mbl-text-small mbl-text-muted">
          Login Methods
        </p>
        <div class="admin-user-detail__login-methods">
          <span v-if="user?.googleId" class="admin-user-detail__login-badge">Google</span>
          <span v-if="user?.hasLocalAccount" class="admin-user-detail__login-badge">Password</span>
          <span v-if="!user?.googleId && !user?.hasLocalAccount" class="mbl-text-muted">—</span>
        </div>
      </div>
      <br>
      <div v-if="statsLoading" class="admin-user-detail__loading mbl-text-muted mbl-text-small">
        Loading...
      </div>
      <div v-else-if="statsError" class="admin-user-detail__error mbl-text-small">
        Unable to load user details.
      </div>
      <dl v-else-if="stats" class="admin-user-detail__stats">
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            Join Date
          </dt>
          <dd>{{ stats.joinDate ? stats.joinDate.split('T')[0] : '—' }}<span v-if="stats.joinDate" class="admin-user-detail__days-ago"> ({{ daysAgo(stats.joinDate) }})</span></dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            Feedbacks
          </dt>
          <dd>{{ stats.feedbackCount }}</dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            Last Log Entry
          </dt>
          <dd>{{ stats.lastLogEntryDate || '—' }}<span v-if="stats.lastLogEntryDate" class="admin-user-detail__days-ago"> ({{ daysAgo(stats.lastLogEntryDate) }})</span></dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            Log Entries
          </dt>
          <dd>{{ stats.logEntryCount }}</dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            Last Note
          </dt>
          <dd>{{ stats.lastNoteDate ? stats.lastNoteDate.split('T')[0] : '—' }}<span v-if="stats.lastNoteDate" class="admin-user-detail__days-ago"> ({{ daysAgo(stats.lastNoteDate) }})</span></dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            Notes
          </dt>
          <dd>{{ stats.noteCount }}</dd>
        </div>
      </dl>

      <div v-if="user" class="admin-user-detail__actions mbl-button-group">
        <button class="mbl-button mbl-button--primary" type="button" @click="signInAsUser">
          Sign In As User
        </button>
        <button class="mbl-button mbl-button--danger" type="button" @click="deleteUser">
          Delete User
        </button>
      </div>
    </template>
    <template slot="footer">
      <button class="mbl-button" type="button" @click="$emit('close')">
        Close
      </button>
    </template>
  </app-modal>
</template>

<script>
import AppModal from '@/components/popups/AppModal';
import { displayTimeSince } from '@mybiblelog/shared';
import { useDialogStore } from '~/stores/dialog';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'AdminUserDetailModal',
  components: { AppModal },
  props: {
    user: {
      type: Object,
      default: null,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'user-deleted'],
  data() {
    return {
      stats: null,
      statsLoading: false,
      statsError: false,
    };
  },
  watch: {
    open(isOpen) {
      if (isOpen && this.user) {
        this.loadStats();
      }
      else {
        this.stats = null;
        this.statsLoading = false;
        this.statsError = false;
      }
    },
  },
  methods: {
    daysAgo(dateStr) {
      return displayTimeSince(dateStr, this.$i18n.locale);
    },
    async loadStats() {
      this.stats = null;
      this.statsError = false;
      this.statsLoading = true;
      try {
        const { data } = await this.$http.get(`/api/admin/users/${this.user.email}/stats`);
        this.stats = data;
      }
      catch {
        this.statsError = true;
      }
      finally {
        this.statsLoading = false;
      }
    },
    async signInAsUser() {
      const dialogStore = useDialogStore();
      const confirmed = await dialogStore.confirm({ message: 'Are you sure you want to sign in as this user? You will be logged out of your own account.' });
      if (!confirmed) { return; }
      try {
        sessionStorage.clear();
        await this.$http.get(`/api/admin/users/${this.user.email}/login`);
        this.$emit('close');
        this.$router.push('/start');
      }
      catch {
        await dialogStore.alert({ message: 'Unable to sign in as user.' });
      }
    },
    async deleteUser() {
      const dialogStore = useDialogStore();
      if (this.user.email === useAuthStore().user?.email) {
        await dialogStore.alert({ message: 'You cannot delete your own account.' });
        return;
      }
      let confirmed = await dialogStore.confirm({
        message: `Are you sure you want to delete account "${this.user.email}"? This action cannot be undone.`,
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }
      confirmed = await dialogStore.confirm({
        message: `Are you absolutely certain? The account "${this.user.email}" will be completely removed from the system.`,
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }
      try {
        await this.$http.delete(`/api/admin/users/${this.user.email}`);
        this.$emit('user-deleted');
      }
      catch {
        await dialogStore.alert({ message: 'Unable to delete user.' });
      }
    },
  },
};
</script>

<style scoped>
.admin-user-detail__loading,
.admin-user-detail__error {
  margin-bottom: 1rem;
}

.admin-user-detail__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.5rem;
  margin: 0 0 1.25rem;
}

.admin-user-detail__stat dt {
  margin-bottom: 0.125rem;
}

.admin-user-detail__stat dd {
  margin: 0;
  font-weight: 500;
}

.admin-user-detail__days-ago {
  font-weight: 400;
  opacity: 0.6;
  font-size: 0.875em;
}

.admin-user-detail__login-methods {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.admin-user-detail__login-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: var(--mbl-surface-2, #e9ecef);
  color: var(--mbl-text, inherit);
}
</style>
