<template>
  <app-modal :open="open" title="User Details" @close="emit('close')">
    <template #content>
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
        Unable to load user details. This account was likely deleted.
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
        <button class="mbl-button mbl-button--primary" type="button" :disabled="statsError" @click="signInAsUser">
          Sign In As User
        </button>
        <button v-if="allowDelete" class="mbl-button mbl-button--danger" type="button" @click="deleteUser">
          Delete User
        </button>
      </div>
    </template>
    <template #footer>
      <button class="mbl-button" type="button" @click="emit('close')">
        Close
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import { displayTimeSince } from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import { useDialogStore } from '~/stores/dialog';
import { useAuthStore } from '~/stores/auth';

interface AdminUser {
  email: string;
  googleId?: string;
  hasLocalAccount?: boolean;
}

interface UserStats {
  joinDate?: string;
  feedbackCount: number;
  lastLogEntryDate?: string;
  logEntryCount: number;
  lastNoteDate?: string;
  noteCount: number;
}

const props = withDefaults(defineProps<{
  user: AdminUser | null;
  open: boolean;
  allowDelete?: boolean;
}>(), {
  user: null,
  open: false,
  allowDelete: true,
});

const emit = defineEmits<{
  close: [];
  'user-deleted': [];
}>();

const { $http } = useNuxtApp();
const { locale } = useI18n();
const dialogStore = useDialogStore();
const authStore = useAuthStore();
const router = useRouter();

const stats = ref<UserStats | null>(null);
const statsLoading = ref(false);
const statsError = ref(false);

function daysAgo(dateStr: string) {
  return displayTimeSince(dateStr, locale.value);
}

async function loadStats() {
  stats.value = null;
  statsError.value = false;
  statsLoading.value = true;
  try {
    const { data } = await $http.get(`/api/admin/users/${props.user!.email}/stats`);
    stats.value = data;
  }
  catch {
    statsError.value = true;
  }
  finally {
    statsLoading.value = false;
  }
}

async function signInAsUser() {
  const confirmed = await dialogStore.confirm({ message: 'Are you sure you want to sign in as this user? You will be logged out of your own account.' });
  if (!confirmed) { return; }
  try {
    sessionStorage.clear();
    await $http.get(`/api/admin/users/${props.user!.email}/login`);
    await authStore.refreshUser();
    emit('close');
    router.push('/start');
  }
  catch {
    await dialogStore.alert({ message: 'Unable to sign in as user.' });
  }
}

async function deleteUser() {
  if (props.user!.email === authStore.user?.email) {
    await dialogStore.alert({ message: 'You cannot delete your own account.' });
    return;
  }
  let confirmed = await dialogStore.confirm({
    message: `Are you sure you want to delete account "${props.user!.email}"? This action cannot be undone.`,
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  confirmed = await dialogStore.confirm({
    message: `Are you absolutely certain? The account "${props.user!.email}" will be completely removed from the system.`,
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  try {
    await $http.delete(`/api/admin/users/${props.user!.email}`);
    emit('user-deleted');
  }
  catch {
    await dialogStore.alert({ message: 'Unable to delete user.' });
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.user) {
    loadStats();
  }
  else {
    stats.value = null;
    statsLoading.value = false;
    statsError.value = false;
  }
});
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
