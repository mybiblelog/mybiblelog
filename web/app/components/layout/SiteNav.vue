<template>
  <nav class="site-nav no-print" role="navigation" aria-label="main navigation">
    <div class="site-nav__bar">
      <div class="site-nav__inner">
        <div class="site-nav__mobile-head">
          <div class="site-nav__mobile-brand">
            <NuxtLink
              class="site-nav__logo"
              :to="localePath(authStore.loggedIn ? '/start' : '/')"
              aria-label="home"
            >
              <img src="/images/logo.svg" width="28" height="28" alt="">
            </NuxtLink>
            <NuxtLink
              class="site-nav__brand-text"
              :to="localePath(authStore.loggedIn ? '/start' : '/')"
            >
              {{ $t('my_bible_log') }}
            </NuxtLink>
          </div>
          <button
            type="button"
            class="site-nav__icon-btn site-nav__menu-btn"
            :aria-expanded="navOpen ? 'true' : 'false'"
            aria-controls="site-nav-drawer"
            :aria-label="t('open_menu')"
            @click="toggleNav"
          >
            <span class="site-nav__menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        <div class="site-nav__desktop">
          <div class="site-nav__brand">
            <NuxtLink
              class="site-nav__logo"
              :to="localePath(authStore.loggedIn ? '/start' : '/')"
              aria-label="home"
            >
              <img src="/images/logo.svg" width="28" height="28" alt="">
            </NuxtLink>
            <NuxtLink
              v-if="!authStore.loggedIn"
              class="site-nav__brand-text"
              :to="localePath('/')"
            >
              {{ $t('my_bible_log') }}
            </NuxtLink>
          </div>

          <div class="site-nav__link-row">
            <template v-for="item in visibleRouteNavItems" :key="item.to">
              <span
                v-if="item.spaceBefore"
                class="site-nav__route-spacer"
                aria-hidden="true"
              />
              <NuxtLink
                class="site-nav__link"
                :to="localePath(item.to)"
              >
                {{ t(item.labelKey) }}
              </NuxtLink>
            </template>
            <span
              v-if="authStore.loggedIn"
              class="site-nav__route-spacer"
              aria-hidden="true"
            />
            <div
              v-if="showAdminNav"
              ref="adminNavRef"
              class="site-nav__admin"
            >
              <button
                type="button"
                class="site-nav__link site-nav__admin-trigger"
                :aria-expanded="adminDropdownOpen ? 'true' : 'false'"
                @click="toggleAdminDropdown"
              >
                {{ t('admin') }}
              </button>
              <div
                v-if="adminDropdownOpen"
                class="site-nav__admin-panel"
                role="menu"
                @click="toggleAdminDropdown"
              >
                <NuxtLink
                  v-for="item in ADMIN_CHILD_LINKS"
                  :key="'desk-admin-' + item.to"
                  class="site-nav__admin-item"
                  :to="localePath(item.to)"
                  role="menuitem"
                >
                  {{ t(item.labelKey) }}
                </NuxtLink>
              </div>
            </div>
            <template v-if="authStore.loggedIn">
              <div
                ref="accountNavRef"
                class="site-nav__account"
              >
                <button
                  type="button"
                  class="site-nav__link site-nav__account-trigger"
                  :aria-expanded="accountDropdownOpen ? 'true' : 'false'"
                  @click="toggleAccountDropdown"
                >
                  {{ t('account') }}
                </button>
                <div
                  v-if="accountDropdownOpen"
                  class="site-nav__account-panel"
                  role="menu"
                  @click="toggleAccountDropdown"
                >
                  <NuxtLink
                    class="site-nav__account-item"
                    :to="localePath('/settings')"
                    role="menuitem"
                  >
                    {{ t('settings') }}
                  </NuxtLink>
                  <a
                    class="site-nav__account-item"
                    href="#"
                    role="menuitem"
                    @click.prevent="logout"
                  >{{ t('log_out') }}</a>
                </div>
              </div>
            </template>
            <template v-if="!authStore.loggedIn">
              <span class="site-nav__auth-slot">
                <NuxtLink class="site-nav__link" :to="localePath('/register')">
                  {{ t('sign_up') }}
                </NuxtLink>
              </span>
              <span class="site-nav__auth-slot">
                <NuxtLink class="site-nav__link" :to="localePath('/login')">
                  {{ t('sign_in') }}
                </NuxtLink>
              </span>
            </template>
            <LayoutThemeSwitcher variant="toolbar" class="site-nav__theme-desktop" />
            <LayoutLanguageSwitcher variant="toolbar" class="site-nav__locale-desktop" />
          </div>
        </div>
      </div>
    </div>

    <Transition
      :css="false"
      @before-enter="onDrawerBeforeEnter"
      @enter="onDrawerEnter"
      @after-enter="onDrawerAfterEnter"
      @leave="onDrawerLeave"
      @after-leave="onDrawerAfterLeave"
    >
      <div
        v-if="navOpen"
        class="site-nav__overlay"
      >
        <div
          class="site-nav__backdrop"
          aria-hidden="true"
          @click="closeNav"
        />
        <aside
          id="site-nav-drawer"
          class="site-nav__drawer"
          role="dialog"
          aria-modal="true"
          :aria-label="t('open_menu')"
          tabindex="-1"
        >
          <div class="site-nav__drawer-scroll">
            <NuxtLink
              v-for="item in visibleRouteNavItems"
              :key="'drawer-route-' + item.to"
              class="site-nav__drawer-link"
              :to="localePath(item.to)"
            >
              {{ t(item.labelKey) }}
            </NuxtLink>
            <template v-if="showAdminNav">
              <div class="site-nav__drawer-subhead">
                {{ t('admin') }}
              </div>
              <NuxtLink
                v-for="item in ADMIN_CHILD_LINKS"
                :key="'drawer-admin-' + item.to"
                class="site-nav__drawer-link site-nav__drawer-link--indent"
                :to="localePath(item.to)"
              >
                {{ t(item.labelKey) }}
              </NuxtLink>
            </template>
            <template v-if="authStore.loggedIn">
              <div class="site-nav__drawer-subhead">
                {{ t('account') }}
              </div>
              <NuxtLink
                class="site-nav__drawer-link site-nav__drawer-link--indent"
                :to="localePath('/settings')"
              >
                {{ t('settings') }}
              </NuxtLink>
              <a
                class="site-nav__drawer-link site-nav__drawer-link--indent"
                href="#"
                role="button"
                @click.prevent="logout"
              >{{ t('log_out') }}</a>
            </template>
            <template v-if="!authStore.loggedIn">
              <span class="site-nav__auth-slot">
                <NuxtLink class="site-nav__drawer-link" :to="localePath('/register')">
                  {{ t('sign_up') }}
                </NuxtLink>
              </span>
              <span class="site-nav__auth-slot">
                <NuxtLink class="site-nav__drawer-link" :to="localePath('/login')">
                  {{ t('sign_in') }}
                </NuxtLink>
              </span>
            </template>
            <LayoutThemeSwitcher variant="drawer" class="site-nav__theme-drawer" />
            <LayoutLanguageSwitcher variant="drawer" class="site-nav__locale-drawer" />
          </div>
        </aside>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { filterVisibleNavItems, isAdminNavVisible } from '~/helpers/site-nav-visibility';

const { t } = useI18n();

const ORDERED_ROUTE_NAV = [
  { labelKey: 'today', to: '/today', authOnly: true, spaceBefore: false },
  { labelKey: 'bible_books', to: '/books', authOnly: true, spaceBefore: false },
  { labelKey: 'chapter_checklist', to: '/checklist', authOnly: true, spaceBefore: false },
  { labelKey: 'calendar', to: '/calendar', authOnly: true, spaceBefore: false },
  { labelKey: 'notes', to: '/notes', authOnly: true, spaceBefore: false },
  { labelKey: 'insights', to: '/insights', authOnly: true, spaceBefore: false },
  { labelKey: 'about', to: '/about/overview', authOnly: false, guestOnly: true, spaceBefore: true },
] as const;

const ADMIN_CHILD_LINKS = [
  { labelKey: 'users', to: '/admin/users' },
  { labelKey: 'feedback', to: '/admin/feedback' },
  { labelKey: 'engagement', to: '/admin/engagement' },
] as const;

const SITE_NAV_DRAWER_MS = 280;

const authStore = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();

const navOpen = ref(false);
const adminDropdownOpen = ref(false);
const accountDropdownOpen = ref(false);
const adminNavRef = ref<HTMLElement | null>(null);
const accountNavRef = ref<HTMLElement | null>(null);

const visibleRouteNavItems = computed(() => filterVisibleNavItems(ORDERED_ROUTE_NAV, authStore.loggedIn));

const showAdminNav = computed(() => isAdminNavVisible(authStore.loggedIn, authStore.user?.isAdmin));

watch(() => route.fullPath, () => {
  navOpen.value = false;
  adminDropdownOpen.value = false;
  accountDropdownOpen.value = false;
});

watch(navOpen, (open) => {
  if (typeof document === 'undefined') { return; }
  document.body.classList.toggle('site-nav-drawer-open', open);
});

useClickOutside(
  computed(() => (adminDropdownOpen.value ? adminNavRef.value : null)),
  () => { adminDropdownOpen.value = false; },
);

useClickOutside(
  computed(() => (accountDropdownOpen.value ? accountNavRef.value : null)),
  () => { accountDropdownOpen.value = false; },
);

const anyDropdownOrDrawerOpen = computed(() =>
  adminDropdownOpen.value || accountDropdownOpen.value || navOpen.value,
);

useEscapeKey(() => {
  if (adminDropdownOpen.value) { adminDropdownOpen.value = false; }
  if (accountDropdownOpen.value) { accountDropdownOpen.value = false; }
  if (navOpen.value) { closeNav(); }
}, anyDropdownOrDrawerOpen);

let desktopMq: MediaQueryList | null = null;
let onDesktopMq: (() => void) | null = null;

onMounted(() => {
  if (window.matchMedia) {
    desktopMq = window.matchMedia('(min-width: 1024px)');
    onDesktopMq = () => {
      if (desktopMq?.matches) { navOpen.value = false; }
    };
    if (desktopMq.addEventListener) {
      desktopMq.addEventListener('change', onDesktopMq);
    }
    else if (desktopMq.addListener) {
      desktopMq.addListener(onDesktopMq);
    }
  }
});

onBeforeUnmount(() => {
  if (desktopMq && onDesktopMq) {
    if (desktopMq.removeEventListener) {
      desktopMq.removeEventListener('change', onDesktopMq);
    }
    else if (desktopMq.removeListener) {
      desktopMq.removeListener(onDesktopMq);
    }
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove('site-nav-drawer-open');
  }
});

const toggleNav = () => { navOpen.value = !navOpen.value; };
const closeNav = () => { navOpen.value = false; };
const toggleAdminDropdown = () => {
  adminDropdownOpen.value = !adminDropdownOpen.value;
  if (adminDropdownOpen.value) { accountDropdownOpen.value = false; }
};
const toggleAccountDropdown = () => {
  accountDropdownOpen.value = !accountDropdownOpen.value;
  if (accountDropdownOpen.value) { adminDropdownOpen.value = false; }
};

const logout = async () => {
  await authStore.logout();
};

const {
  onBeforeEnter: onDrawerBeforeEnter,
  onEnter: onDrawerEnter,
  onAfterEnter: onDrawerAfterEnter,
  onLeave: onDrawerLeave,
  onAfterLeave: onDrawerAfterLeave,
} = useSlideDrawerTransition({
  drawerSelector: '.site-nav__drawer',
  backdropSelector: '.site-nav__backdrop',
  durationMs: SITE_NAV_DRAWER_MS,
});
</script>

<style scoped>
.site-nav {
  --site-nav-z-bar: 37;
  --site-nav-z-drawer: 36;
  --site-nav-z-backdrop: 35;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--site-nav-z-bar);
}

.site-nav__bar {
  position: relative;
  z-index: calc(var(--site-nav-z-bar) + 1);
  background: var(--mbl-bg);
  border-bottom: 1px solid var(--mbl-border);
}

.site-nav__inner {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 1rem;
  min-height: var(--site-nav-height);
  display: flex;
  align-items: center;
}

.site-nav__mobile-head {
  display: none;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.site-nav__mobile-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.site-nav__mobile-brand .site-nav__brand-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-nav__desktop {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: nowrap;
  min-height: var(--site-nav-height);
}

.site-nav__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.site-nav__logo {
  display: inline-flex;
  align-items: center;
  line-height: 0;
  flex-shrink: 0;
}

.site-nav__logo img {
  display: block;
}

.site-nav__brand-text {
  display: inline-block;
  font-weight: 600;
  text-decoration: none;
  background: var(--mbl-site-title-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.site-nav__brand-text:hover,
.site-nav__brand-text:focus-visible {
  filter: brightness(1.08);
}

.site-nav__brand-text:focus {
  outline: none;
}

.site-nav__brand-text:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 3px;
  border-radius: 4px;
}

.site-nav__link-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex-grow: 1;
  gap: 0.25rem 0.5rem;
  min-width: 0;
}

.site-nav__route-spacer {
  align-self: stretch;
  box-sizing: border-box;
  flex: 1 1 0%;
  min-width: 3rem;
}

.site-nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.65rem;
  font-size: 0.9375rem;
  color: var(--mbl-text-subtle);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.site-nav__link::after {
  content: '';
  position: absolute;
  left: 0.65rem;
  right: 0.65rem;
  bottom: 0.2rem;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, var(--secondary-color), var(--tertiary-color));
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.2s ease;
}

.site-nav__link:hover,
.site-nav__link:focus-visible,
.site-nav__link.router-link-active {
  color: var(--mbl-text-stronger);
}

.site-nav__link:hover::after,
.site-nav__link:focus-visible::after {
  transform: scaleX(1);
}

.site-nav__admin,
.site-nav__account {
  position: relative;
  display: inline-flex;
}

.site-nav__admin-trigger::after,
.site-nav__account-trigger::after {
  left: 0.65rem;
  right: 0.65rem;
}

.site-nav__admin-panel,
.site-nav__account-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.125rem;
  min-width: 12rem;
  padding: 0.35rem 0;
  background: var(--mbl-bg);
  border: 1px solid var(--mbl-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px var(--mbl-overlay-08);
}

.site-nav__admin-item,
.site-nav__account-item {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  color: var(--mbl-text-subtle);
  text-decoration: none;
}

.site-nav__admin-item:hover,
.site-nav__admin-item:focus-visible,
.site-nav__account-item:hover,
.site-nav__account-item:focus-visible {
  background: var(--mbl-bg-hover-light);
  color: var(--mbl-text-stronger);
}

.site-nav__theme-desktop {
  flex-shrink: 0;
  margin-left: 0.25rem;
}

.site-nav__locale-desktop {
  flex-shrink: 0;
  margin-left: 0.125rem;
}

.site-nav__auth-slot {
  display: contents;
}

.site-nav__locale-drawer {
  margin-top: 0.5rem;
  padding: 0 1rem;
}

.site-nav__theme-drawer {
  margin-top: 0.5rem;
  padding: 0 1rem;
}

.site-nav__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-top: -0.25rem;
  margin-bottom: -0.25rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--mbl-text-strong);
  cursor: pointer;
}

.site-nav__icon-btn:hover {
  background: var(--mbl-bg-hover-light);
}

.site-nav__icon-btn:active {
  background: var(--mbl-bg-hover-strong);
}

.site-nav__icon-btn:focus {
  outline: none;
}

.site-nav__icon-btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

.site-nav__menu-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 22px;
}

.site-nav__menu-icon span {
  display: block;
  height: 2px;
  background: currentcolor;
  border-radius: 1px;
}

.site-nav__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--site-nav-z-backdrop);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  padding-top: var(--site-nav-height);
}

.site-nav__backdrop {
  position: absolute;
  inset: var(--site-nav-height) 0 0 0;
  background: var(--mbl-overlay-35);
  opacity: 1;
}

.site-nav__drawer {
  position: relative;
  z-index: var(--site-nav-z-drawer);
  width: min(20rem, 88vw);
  max-height: 100%;
  background: var(--mbl-bg);
  box-shadow: -4px 0 24px var(--mbl-overlay-12);
  outline: none;
}

.site-nav__drawer-scroll {
  display: flex;
  flex-direction: column;
  padding: 1rem 0 calc(2rem + 56px + 1.25rem);
  max-height: calc(100vh - var(--site-nav-height));
  overflow-y: auto;
}

.site-nav__drawer-link {
  padding: 0.85rem 1.25rem;
  font-size: 1rem;
  color: var(--mbl-text-strong);
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.site-nav__drawer-link:hover,
.site-nav__drawer-link:focus-visible,
.site-nav__drawer-link.router-link-active {
  background: var(--mbl-bg-hover-light);
  color: var(--mbl-text-stronger);
}

.site-nav__drawer-link:active {
  background: var(--mbl-bg-hover-strong);
  color: var(--mbl-text-stronger);
}

.site-nav__drawer-link--indent {
  padding-left: 2rem;
  font-size: 0.9375rem;
}

.site-nav__drawer-subhead {
  padding: 0.75rem 1.25rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--mbl-text-subtle);
}

@media screen and (max-width: 1023px) {
  .site-nav__mobile-head {
    display: flex;
  }

  .site-nav__desktop {
    display: none;
  }

  .site-nav__inner {
    padding: 0 0.75rem;
  }
}

@media screen and (max-width: 768px) {
  .site-nav__drawer-scroll {
    padding-bottom: calc(1.5rem + 48px + 1.25rem);
  }
}

@media screen and (min-width: 1024px) {
  .site-nav__overlay {
    display: none !important;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "today": "Today",
    "bible_books": "Bible Books",
    "chapter_checklist": "Chapter Checklist",
    "calendar": "Calendar",
    "log": "Log",
    "notes": "Notes",
    "insights": "Insights",
    "about": "About",
    "account": "Account",
    "settings": "Settings",
    "admin": "Admin",
    "users": "Users",
    "feedback": "Feedback",
    "engagement": "Engagement",
    "log_out": "Log Out",
    "sign_up": "Sign Up",
    "sign_in": "Sign In",
    "open_menu": "Menu"
  },
  "de": {
    "today": "Heute",
    "bible_books": "Bibelbücher",
    "chapter_checklist": "Kapitel Checkliste",
    "calendar": "Kalender",
    "log": "Journal",
    "notes": "Notizen",
    "insights": "Einblicke",
    "about": "Über",
    "account": "Konto",
    "settings": "Einstellungen",
    "admin": "Administrator",
    "users": "Benutzer",
    "feedback": "Feedback",
    "engagement": "Engagement",
    "log_out": "Abmelden",
    "sign_up": "Registrieren",
    "sign_in": "Anmelden",
    "open_menu": "Menü"
  },
  "es": {
    "today": "Hoy",
    "bible_books": "Libros Bíblicos",
    "chapter_checklist": "Lista de Capítulos",
    "calendar": "Calendario",
    "log": "Registro",
    "notes": "Notas",
    "insights": "Estadísticas",
    "about": "Acerca de",
    "account": "Cuenta",
    "settings": "Configuración",
    "admin": "Administrador",
    "users": "Usuarios",
    "feedback": "Comentarios",
    "engagement": "Participación",
    "log_out": "Cerrar sesión",
    "sign_up": "Registrarse",
    "sign_in": "Iniciar sesión",
    "open_menu": "Menú"
  },
  "fr": {
    "today": "Aujourd'hui",
    "bible_books": "Livres de la Bible",
    "chapter_checklist": "Liste de Contrôle",
    "calendar": "Calendrier",
    "log": "Journal",
    "notes": "Notes",
    "insights": "Analyses",
    "about": "À Propos",
    "account": "Compte",
    "settings": "Paramètres",
    "admin": "Administrateur",
    "users": "Utilisateurs",
    "feedback": "Retour d'Information",
    "engagement": "Engagement",
    "log_out": "Déconnexion",
    "sign_up": "S'inscrire",
    "sign_in": "Se connecter",
    "open_menu": "Menu"
  },
  "ko": {
    "today": "오늘의 성경",
    "bible_books": "성경 일람",
    "chapter_checklist": "장별 체크",
    "calendar": "달력",
    "log": "기록",
    "notes": "노트",
    "insights": "통계",
    "about": "소개",
    "account": "계정",
    "settings": "설정",
    "admin": "관리자",
    "users": "사용자",
    "feedback": "피드백",
    "engagement": "참여",
    "log_out": "로그아웃",
    "sign_up": "회원가입",
    "sign_in": "로그인",
    "open_menu": "메뉴"
  },
  "pt": {
    "today": "Hoje",
    "bible_books": "Livros da Bíblia",
    "chapter_checklist": "Lista de Capítulos",
    "calendar": "Calendário",
    "log": "Registro",
    "notes": "Notas",
    "insights": "Estatísticas",
    "about": "Sobre",
    "account": "Conta",
    "settings": "Configurações",
    "admin": "Administrador",
    "users": "Usuários",
    "feedback": "Feedback",
    "engagement": "Engajamento",
    "log_out": "Sair",
    "sign_up": "Inscrever-se",
    "sign_in": "Entrar",
    "open_menu": "Menu"
  },
  "uk": {
    "today": "Сьогодні",
    "bible_books": "Книги Біблії",
    "chapter_checklist": "Список розділів",
    "calendar": "Календар",
    "log": "Журнал",
    "notes": "Нотатки",
    "insights": "Аналітика",
    "about": "Про нас",
    "account": "Обліковий запис",
    "settings": "Налаштування",
    "admin": "Адміністратор",
    "users": "Користувачі",
    "feedback": "Зворотній зв'язок",
    "engagement": "Залученість",
    "log_out": "Вийти",
    "sign_up": "Зареєструватися",
    "sign_in": "Увійти",
    "open_menu": "Меню"
  }
}
</i18n>
