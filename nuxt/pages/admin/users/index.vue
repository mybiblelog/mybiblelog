<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">
            Users Admin
          </h1>
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
            :class="{ 'mbl-button--primary': sortOn === SortColumns.email }"
            type="button"
            @click="toggleSort(SortColumns.email)"
          >
            User
            <template v-if="sortOn === SortColumns.email">
              <caret-down-icon v-if="sortDirection === 1" width="1rem" height="1rem" fill="currentColor" />
              <caret-down-icon v-if="sortDirection === -1" class="flipped" width="1rem" height="1rem" fill="currentColor" />
            </template>
          </button>
          <button
            class="mbl-button mbl-button--sm mbl-button--light"
            :class="{ 'mbl-button--primary': sortOn === SortColumns.createdAt }"
            type="button"
            @click="toggleSort(SortColumns.createdAt)"
          >
            Join Date
            <template v-if="sortOn === SortColumns.createdAt">
              <caret-down-icon v-if="sortDirection === 1" width="1rem" height="1rem" fill="currentColor" />
              <caret-down-icon v-if="sortDirection === -1" class="flipped" width="1rem" height="1rem" fill="currentColor" />
            </template>
          </button>
        </div>
        <div class="users-page__limit">
          <span class="mbl-text-small mbl-text-muted">Per page:</span>
          <div class="mbl-select mbl-select--sm">
            <select v-model="limit">
              <option v-for="size in [10, 25, 50, 100]" :key="size" :value="size">
                {{ size }}
              </option>
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
            <div class="mbl-text-small mbl-text-muted">
              {{ resultsSummary }}
            </div>

            <div v-if="pagerTotalPages > 1" class="users-page__pager">
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

          <div class="user-cards">
            <div v-for="(user, index) in users" :key="user._id" class="user-card">
              <div class="user-card__email">
                <span class="user-card__number mbl-text-small mbl-text-muted">#{{ offset + index + 1 }}</span>
                {{ user.email }}
              </div>
              <div class="user-card__date mbl-text-small mbl-text-muted">
                {{ user.createdAt.split('T')[0] }}
              </div>
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

    <admin-user-detail-modal
      :user="selectedUser"
      :open="!!selectedUser"
      @close="closeUserDetails"
      @user-deleted="onUserDeleted"
    />
  </main>
</template>

<script>
import AdminUserDetailModal from '@/components/admin/AdminUserDetailModal';
import CaretDownIcon from '@/components/svg/CaretDownIcon';
import CaretLeftIcon from '@/components/svg/CaretLeftIcon';
import CaretRightIcon from '@/components/svg/CaretRightIcon';

const SortColumns = {
  email: 'email',
  createdAt: 'createdAt',
};

export default {
  name: 'AdminUserListPage',
  components: {
    AdminUserDetailModal,
    CaretDownIcon,
    CaretLeftIcon,
    CaretRightIcon,
  },
  middleware: ['auth'],
  meta: {
    auth: 'admin',
  },
  data() {
    return {
      users: null, // becomes array when loaded
      totalUsers: 0,
      loadError: false,
      selectedUser: null,

      SortColumns,
      sortOn: SortColumns.createdAt,
      sortDirection: -1, // 1 | -1
      searchText: '', // for searching by email
      limit: 50,
      page: 1, // for pagination
    };
  },
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  computed: {
    offset() {
      return (this.page - 1) * this.limit;
    },
    totalPages() {
      return Math.ceil(this.totalUsers / this.limit) || 1;
    },
    pagerPage() {
      return this.page;
    },
    pagerTotalPages() {
      return this.totalPages;
    },
    resultsSummary() {
      if (!this.totalUsers) { return 'No users'; }
      if (this.totalUsers <= this.limit) { return `Showing all ${this.totalUsers}`; }
      const first = this.offset + 1;
      const last = Math.min(this.offset + (this.users?.length ?? 0), this.totalUsers);
      return `Showing ${first}–${last} of ${this.totalUsers}`;
    },
  },
  watch: {
    limit() {
      this.page = 1;
      this.loadUsers();
    },
    page() {
      this.loadUsers();
    },
    searchText() {
      // Only search when there are at least 3 characters
      // OR when the search text is cleared
      if (this.searchText.length && this.searchText.length < 3) {
        return;
      }
      this.page = 1;
      this.loadUsers();
    },
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    buildUsersRequestUrl() {
      const url = new URL('/api/admin/users', this.$config.siteUrl);

      if (this.searchText) {
        url.searchParams.set('searchText', this.searchText);
      }
      if (this.sortOn) {
        url.searchParams.set('sortOn', this.sortOn);
      }
      if (this.sortDirection) {
        const readableDirection = this.sortDirection === 1 ? 'ascending' : 'descending';
        url.searchParams.set('sortDirection', readableDirection);
      }
      if (this.limit) {
        url.searchParams.set('limit', this.limit);
      }
      if (this.offset) {
        url.searchParams.set('offset', this.offset);
      }

      return url.pathname + (url.search || '');
    },
    async loadUsers() {
      const path = this.buildUsersRequestUrl();
      this.loadError = false;
      try {
        const { data: users, meta } = await this.$http.get(path);
        const { size } = meta.pagination;
        this.users = users;
        this.totalUsers = size;
      }
      catch {
        this.users = [];
        this.loadError = true;
      }
    },
    toggleSort(column) {
      if (this.sortOn !== column) {
        this.sortOn = column;
        this.sortDirection = 1;
      }
      else {
        this.sortDirection *= -1;
      }
      this.loadUsers();
    },
    onPageChanged(newPage) {
      const clamped = Math.min(Math.max(Number(newPage || 1), 1), this.pagerTotalPages);
      if (clamped === this.page) { return; }
      this.page = clamped;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    openUserDetails(user) {
      this.selectedUser = user;
    },
    closeUserDetails() {
      this.selectedUser = null;
    },
    onUserDeleted() {
      this.selectedUser = null;
      this.loadUsers();
    },
  },
};
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
