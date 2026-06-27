<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">Users Admin</h1>
        </div>
        <div class="mbl-level-right">
          <input v-model="searchText" class="mbl-input" type="text" placeholder="Search by email">
        </div>
      </div>

      <div class="users-page__toolbar">
        <div class="users-page__sort">
          <span class="mbl-text-small mbl-text-muted">Sort:</span>
          <button
            class="mbl-button mbl-button--sm mbl-button--light"
            :class="{ 'mbl-button--primary': sortOn === 'email' }"
            type="button"
            @click="toggleSort('email')"
          >
            User
            <template v-if="sortOn === 'email'">
              <CaretDownIcon v-if="sortDirection === 1" />
              <CaretDownIcon v-if="sortDirection === -1" class="flipped" />
            </template>
          </button>
          <button
            class="mbl-button mbl-button--sm mbl-button--light"
            :class="{ 'mbl-button--primary': sortOn === 'createdAt' }"
            type="button"
            @click="toggleSort('createdAt')"
          >
            Join Date
            <template v-if="sortOn === 'createdAt'">
              <CaretDownIcon v-if="sortDirection === 1" />
              <CaretDownIcon v-if="sortDirection === -1" class="flipped" />
            </template>
          </button>
        </div>
        <div class="users-page__limit">
          <span class="mbl-text-small mbl-text-muted">Per page:</span>
          <div class="mbl-select mbl-select--sm">
            <select v-model="limit">
              <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">{{ size }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="users !== null">
        <div v-if="loadError">
          <p>There was an error loading users.</p>
        </div>
        <div v-else-if="!users.length">
          <p>There are no users.</p>
        </div>
        <template v-else>
          <div class="users-page__results-bar">
            <div class="mbl-text-small mbl-text-muted">{{ resultsSummary }}</div>
            <div v-if="totalPages > 1" class="users-page__pager">
              <div class="mbl-field mbl-field--addons mbl-field--flush" role="group" aria-label="Pagination">
                <p class="mbl-control">
                  <button
                    class="mbl-button mbl-button--sm mbl-button--light"
                    type="button"
                    :disabled="page <= 1"
                    aria-label="Previous page"
                    @click="onPageChanged(page - 1)"
                  >
                    <CaretLeftIcon width="10px" height="18px" fill="currentColor" />
                  </button>
                </p>
                <div class="mbl-control">
                  <div class="mbl-select mbl-select--sm">
                    <select :value="page" aria-label="Page" @change="onPageChanged(Number(($event.target as HTMLSelectElement).value))">
                      <option v-for="p in totalPages" :key="p" :value="p">Page {{ p }}</option>
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
                    <CaretRightIcon width="10px" height="18px" fill="currentColor" />
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div class="user-cards">
            <div v-for="(user, index) in users" :key="user._id" class="user-card">
              <div class="user-card__email">
                <span class="user-card__number mbl-text-small mbl-text-muted">#{{ offset + index + 1 }}</span>
                {{ user.email }}
              </div>
              <div class="user-card__date mbl-text-small mbl-text-muted">{{ user.createdAt.split('T')[0] }}</div>
              <div class="user-card__actions">
                <button class="mbl-button mbl-button--light mbl-button--primary mbl-button--sm" @click="openUserDetails(user)">
                  Details
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <AdminUserDetailModal
      :user="selectedUser"
      :open="!!selectedUser"
      @close="closeUserDetails"
      @user-deleted="onUserDeleted"
    />
  </main>
</template>

<script setup lang="ts">
import AdminUserDetailModal from '~/components/admin/AdminUserDetailModal.vue';
import CaretDownIcon from '~/components/svg/CaretDownIcon.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';

definePageMeta({ middleware: ['auth'], auth: 'admin' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

interface AdminUser {
  _id: string;
  email: string;
  createdAt: string;
  googleId?: string;
  hasLocalAccount?: boolean;
}

const { $http } = useNuxtApp();

const users = ref<AdminUser[] | null>(null);
const totalUsers = ref(0);
const loadError = ref(false);
const selectedUser = ref<AdminUser | null>(null);
const sortOn = ref<'email' | 'createdAt'>('createdAt');
const sortDirection = ref(-1);
const searchText = ref('');
const limit = ref(50);
const page = ref(1);

const offset = computed(() => (page.value - 1) * limit.value);
const totalPages = computed(() => Math.ceil(totalUsers.value / limit.value) || 1);
const resultsSummary = computed(() => {
  if (!totalUsers.value) { return 'No users'; }
  if (totalUsers.value <= limit.value) { return `Showing all ${totalUsers.value}`; }
  const first = offset.value + 1;
  const last = Math.min(offset.value + (users.value?.length ?? 0), totalUsers.value);
  return `Showing ${first}–${last} of ${totalUsers.value}`;
});

function buildUrl() {
  const params = new URLSearchParams();
  if (searchText.value) { params.set('searchText', searchText.value); }
  if (sortOn.value) { params.set('sortOn', sortOn.value); }
  params.set('sortDirection', sortDirection.value === 1 ? 'ascending' : 'descending');
  params.set('limit', String(limit.value));
  if (offset.value) { params.set('offset', String(offset.value)); }
  return `/api/admin/users?${params}`;
}

async function loadUsers() {
  loadError.value = false;
  try {
    const { data, meta } = await $http.get(buildUrl());
    users.value = data;
    totalUsers.value = meta.pagination.size;
  }
  catch {
    users.value = [];
    loadError.value = true;
  }
}

function toggleSort(column: 'email' | 'createdAt') {
  if (sortOn.value !== column) {
    sortOn.value = column;
    sortDirection.value = 1;
  }
  else {
    sortDirection.value *= -1;
  }
  loadUsers();
}

function onPageChanged(newPage: number) {
  const clamped = Math.min(Math.max(newPage, 1), totalPages.value);
  if (clamped === page.value) { return; }
  page.value = clamped;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openUserDetails(user: AdminUser) {
  selectedUser.value = user;
}

function closeUserDetails() {
  selectedUser.value = null;
}

function onUserDeleted() {
  selectedUser.value = null;
  loadUsers();
}

watch(limit, () => { page.value = 1; loadUsers(); });
watch(page, () => { loadUsers(); });
watch(searchText, () => {
  if (searchText.value.length > 0 && searchText.value.length < 3) { return; }
  page.value = 1;
  loadUsers();
});

onMounted(() => { loadUsers(); });
</script>

<style scoped>
.users-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.users-page__sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.users-page__limit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.users-page__results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.users-page__pager {
  flex-shrink: 0;
}

.user-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.4rem 1rem;
  border: 1px solid var(--mbl-border);
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
}

.user-card__email {
  align-self: center;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card__number {
  flex-shrink: 0;
}

.user-card__date {
  align-self: center;
  text-align: right;
  white-space: nowrap;
}

.user-card__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

.flipped {
  transform: rotate(180deg);
}
</style>
