<template>
  <main>
    <div class="content-column">
      <div class="mbl-level">
        <div class="mbl-level-left">
          <h1 class="mbl-title">
            {{ t('title') }}
          </h1>
        </div>
        <div class="mbl-level-right">
          <input v-model="searchText" class="mbl-input" type="text" :placeholder="t('search_by_email')">
        </div>
      </div>

      <div class="users-page__toolbar">
        <div class="users-page__sort">
          <span class="mbl-text-small mbl-text-muted">{{ t('sort') }}</span>
          <button
            class="mbl-button mbl-button--sm mbl-button--light"
            :class="{ 'mbl-button--primary': sortOn === 'email' }"
            type="button"
            @click="toggleSort('email')"
          >
            {{ t('sort_user') }}
            <template v-if="sortOn === 'email'">
              <caret-down-icon v-if="sortDirection === 1" />
              <caret-down-icon v-if="sortDirection === -1" class="flipped" />
            </template>
          </button>
          <button
            class="mbl-button mbl-button--sm mbl-button--light"
            :class="{ 'mbl-button--primary': sortOn === 'createdAt' }"
            type="button"
            @click="toggleSort('createdAt')"
          >
            {{ t('sort_join_date') }}
            <template v-if="sortOn === 'createdAt'">
              <caret-down-icon v-if="sortDirection === 1" />
              <caret-down-icon v-if="sortDirection === -1" class="flipped" />
            </template>
          </button>
        </div>
        <div class="users-page__limit">
          <span class="mbl-text-small mbl-text-muted">{{ t('per_page') }}</span>
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
          <p>{{ t('error_loading') }}</p>
        </div>
        <div v-else-if="!users.length">
          <p>{{ t('no_users') }}</p>
        </div>
        <template v-else>
          <div class="users-page__results-bar">
            <div class="mbl-text-small mbl-text-muted">
              {{ resultsSummary }}
            </div>
            <div v-if="totalPages > 1" class="users-page__pager">
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
                  {{ t('details') }}
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
const { t } = useI18n();

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
  if (!totalUsers.value) { return t('summary_none'); }
  if (totalUsers.value <= limit.value) { return t('summary_all', { total: totalUsers.value }); }
  const first = offset.value + 1;
  const last = Math.min(offset.value + (users.value?.length ?? 0), totalUsers.value);
  return t('summary_range', { first, last, total: totalUsers.value });
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
    const { data, meta } = await $http.get<AdminUser[]>(buildUrl());
    users.value = data;
    totalUsers.value = (meta as { pagination: { size: number } }).pagination.size;
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
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-md);
  flex-wrap: wrap;
}

.users-page__sort {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.users-page__limit {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.users-page__results-bar {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem - 1px);
  z-index: 10;
  background: var(--mbl-app-canvas-bg);
  padding: var(--mbl-space-xs) var(--mbl-space-md);
  margin-left: calc(-1 * var(--mbl-space-xs));
  margin-right: calc(-1 * var(--mbl-space-xs));
  margin-bottom: var(--mbl-space-md);
  border-bottom: 1px solid var(--mbl-border-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mbl-space-md);
}

.users-page__pager {
  flex-shrink: 0;
}

.user-cards {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-md);
}

.user-card {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: var(--mbl-space-xs) var(--mbl-space-md);
  border: 1px solid var(--mbl-border);
  border-radius: var(--mbl-radius-lg);
  padding: var(--mbl-space-sm) var(--mbl-space-md);
}

.user-card__email {
  align-self: center;
  display: flex;
  align-items: baseline;
  gap: var(--mbl-space-xs);
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

<i18n lang="json">
{
  "en": {
    "title": "Users Admin",
    "search_by_email": "Search by email",
    "sort": "Sort:",
    "sort_user": "User",
    "sort_join_date": "Join Date",
    "per_page": "Per page:",
    "error_loading": "There was an error loading users.",
    "no_users": "There are no users.",
    "summary_none": "No users",
    "summary_all": "Showing all {total}",
    "summary_range": "Showing {first}–{last} of {total}",
    "aria_pagination": "Pagination",
    "aria_previous_page": "Previous page",
    "aria_next_page": "Next page",
    "aria_page": "Page",
    "page_number": "Page {page}",
    "details": "Details"
  },
  "de": {
    "title": "Benutzerverwaltung",
    "search_by_email": "Nach E-Mail suchen",
    "sort": "Sortieren:",
    "sort_user": "Benutzer",
    "sort_join_date": "Beitrittsdatum",
    "per_page": "Pro Seite:",
    "error_loading": "Beim Laden der Benutzer ist ein Fehler aufgetreten.",
    "no_users": "Es gibt keine Benutzer.",
    "summary_none": "Keine Benutzer",
    "summary_all": "Alle {total} werden angezeigt",
    "summary_range": "{first}–{last} von {total} werden angezeigt",
    "aria_pagination": "Seitennummerierung",
    "aria_previous_page": "Vorherige Seite",
    "aria_next_page": "Nächste Seite",
    "aria_page": "Seite",
    "page_number": "Seite {page}",
    "details": "Details"
  },
  "es": {
    "title": "Administración de Usuarios",
    "search_by_email": "Buscar por correo electrónico",
    "sort": "Ordenar:",
    "sort_user": "Usuario",
    "sort_join_date": "Fecha de Registro",
    "per_page": "Por página:",
    "error_loading": "Hubo un error al cargar los usuarios.",
    "no_users": "No hay usuarios.",
    "summary_none": "Sin usuarios",
    "summary_all": "Mostrando todos los {total}",
    "summary_range": "Mostrando {first}–{last} de {total}",
    "aria_pagination": "Paginación",
    "aria_previous_page": "Página anterior",
    "aria_next_page": "Página siguiente",
    "aria_page": "Página",
    "page_number": "Página {page}",
    "details": "Detalles"
  },
  "fr": {
    "title": "Administration des Utilisateurs",
    "search_by_email": "Rechercher par e-mail",
    "sort": "Trier :",
    "sort_user": "Utilisateur",
    "sort_join_date": "Date d'Inscription",
    "per_page": "Par page :",
    "error_loading": "Une erreur s'est produite lors du chargement des utilisateurs.",
    "no_users": "Il n'y a aucun utilisateur.",
    "summary_none": "Aucun utilisateur",
    "summary_all": "Affichage des {total}",
    "summary_range": "Affichage de {first}–{last} sur {total}",
    "aria_pagination": "Pagination",
    "aria_previous_page": "Page précédente",
    "aria_next_page": "Page suivante",
    "aria_page": "Page",
    "page_number": "Page {page}",
    "details": "Détails"
  },
  "ko": {
    "title": "사용자 관리",
    "search_by_email": "이메일로 검색",
    "sort": "정렬:",
    "sort_user": "사용자",
    "sort_join_date": "가입일",
    "per_page": "페이지당:",
    "error_loading": "사용자를 불러오는 중 오류가 발생했습니다.",
    "no_users": "사용자가 없습니다.",
    "summary_none": "사용자 없음",
    "summary_all": "전체 {total}명 표시 중",
    "summary_range": "{total}명 중 {first}–{last}명 표시 중",
    "aria_pagination": "페이지 매기기",
    "aria_previous_page": "이전 페이지",
    "aria_next_page": "다음 페이지",
    "aria_page": "페이지",
    "page_number": "{page} 페이지",
    "details": "상세"
  },
  "pt": {
    "title": "Administração de Usuários",
    "search_by_email": "Buscar por e-mail",
    "sort": "Ordenar:",
    "sort_user": "Usuário",
    "sort_join_date": "Data de Cadastro",
    "per_page": "Por página:",
    "error_loading": "Ocorreu um erro ao carregar os usuários.",
    "no_users": "Não há usuários.",
    "summary_none": "Nenhum usuário",
    "summary_all": "Mostrando todos os {total}",
    "summary_range": "Mostrando {first}–{last} de {total}",
    "aria_pagination": "Paginação",
    "aria_previous_page": "Página anterior",
    "aria_next_page": "Próxima página",
    "aria_page": "Página",
    "page_number": "Página {page}",
    "details": "Detalhes"
  },
  "uk": {
    "title": "Керування користувачами",
    "search_by_email": "Пошук за електронною поштою",
    "sort": "Сортувати:",
    "sort_user": "Користувач",
    "sort_join_date": "Дата реєстрації",
    "per_page": "На сторінці:",
    "error_loading": "Під час завантаження користувачів сталася помилка.",
    "no_users": "Користувачів немає.",
    "summary_none": "Немає користувачів",
    "summary_all": "Показано всі {total}",
    "summary_range": "Показано {first}–{last} з {total}",
    "aria_pagination": "Нумерація сторінок",
    "aria_previous_page": "Попередня сторінка",
    "aria_next_page": "Наступна сторінка",
    "aria_page": "Сторінка",
    "page_number": "Сторінка {page}",
    "details": "Деталі"
  }
}
</i18n>
