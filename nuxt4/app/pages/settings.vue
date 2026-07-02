<template>
  <main>
    <div class="content-column">
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3">
          {{ t('settings') }}
        </h1>
        <div class="mbl-dropdown narrow-screen" :class="menuOpen ? 'mbl-dropdown--active' : ''">
          <div class="mbl-dropdown__trigger" @click="toggleMenu">
            <button class="mbl-button" type="button" aria-haspopup="true">
              <span>{{ t('menu') }}</span>
            </button>
          </div>
          <div class="mbl-dropdown__menu" role="menu" @click="toggleMenu">
            <div class="mbl-dropdown__content">
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/settings')">
                {{ t('account') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/settings/start')">
                {{ t('start_page') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/settings/reading')">
                {{ t('reading') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/settings/reminder')">
                {{ t('reminder') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/settings/export')">
                {{ t('export') }}
              </NuxtLink>
              <NuxtLink class="mbl-dropdown__item" :to="localePath('/settings/import')">
                {{ t('import') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </header>
      <div class="mbl-tabs wide-screen">
        <ul>
          <li>
            <NuxtLink :to="localePath('/settings')">
              {{ t('account') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/settings/start')">
              {{ t('start_page') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/settings/reading')">
              {{ t('reading') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/settings/reminder')">
              {{ t('reminder') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/settings/export')">
              {{ t('export') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="localePath('/settings/import')">
              {{ t('import') }}
            </NuxtLink>
          </li>
        </ul>
      </div>
      <NuxtPage />
    </div>
  </main>
</template>

<script setup lang="ts">

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const { t } = useI18n();
const localePath = useLocalePath();

const menuOpen = ref(false);
function toggleMenu() { menuOpen.value = !menuOpen.value; }
</script>

<i18n lang="json">
{
  "en": {
    "settings": "Settings",
    "menu": "Menu",
    "account": "Account",
    "start_page": "Start Page",
    "reading": "Reading",
    "reminder": "Reminder",
    "export": "Export",
    "import": "Import"
  },
  "de": {
    "settings": "Einstellungen",
    "menu": "Menü",
    "account": "Konto",
    "start_page": "Startseite",
    "reading": "Lesen",
    "reminder": "Erinnerung",
    "export": "Exportieren",
    "import": "Importieren"
  },
  "es": {
    "settings": "Configuración",
    "menu": "Menú",
    "account": "Cuenta",
    "start_page": "Página de inicio",
    "reading": "Lectura",
    "reminder": "Recordatorio",
    "export": "Exportar",
    "import": "Importar"
  },
  "fr": {
    "settings": "Paramètres",
    "menu": "Menu",
    "account": "Compte",
    "start_page": "Page de démarrage",
    "reading": "Lecture",
    "reminder": "Rappel",
    "export": "Exporter",
    "import": "Importer"
  },
  "ko": {
    "settings": "설정",
    "menu": "메뉴",
    "account": "계정",
    "start_page": "시작 페이지",
    "reading": "읽기",
    "reminder": "알림",
    "export": "내보내기",
    "import": "불러오기"
  },
  "pt": {
    "settings": "Configurações",
    "menu": "Menu",
    "account": "Conta",
    "start_page": "Página de início",
    "reading": "Leitura",
    "reminder": "Lembrete",
    "export": "Exportar",
    "import": "Importar"
  },
  "uk": {
    "settings": "Налаштування",
    "menu": "Меню",
    "account": "Обліковий запис",
    "start_page": "Стартова сторінка",
    "reading": "Читання",
    "reminder": "Нагадування",
    "export": "Експорт",
    "import": "Імпорт"
  }
}
</i18n>

<style scoped>
.narrow-screen { display: block; }
.wide-screen { display: none; }

@media (min-width: 800px) {
  .narrow-screen { display: none; }
  .wide-screen { display: block; }
}
</style>
