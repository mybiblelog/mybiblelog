<template>
  <main>
    <div class="content-column">
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3">
          {{ $t('settings') }}
          <info-link :to="localePath('/about/page-features--settings')" />
        </h1>
        <div class="mbl-dropdown narrow-screen mbl-dropdown--right" :class="menuOpen ? 'mbl-dropdown--active' : ''">
          <div class="mbl-dropdown__trigger" @click="toggleMenu">
            <button class="mbl-button" aria-haspopup="true" aria-controls="mbl-dropdown__menu">
              <span>{{ $t('menu') }}</span>
            </button>
          </div>
          <div class="mbl-dropdown__menu" role="menu" @click="toggleMenu">
            <div class="mbl-dropdown__content">
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/settings')">
                {{ $t('account') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/settings/start')">
                {{ $t('start_page') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/settings/reading')">
                {{ $t('reading') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/settings/reminder')">
                {{ $t('reminder') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/settings/export')">
                {{ $t('export') }}
              </nuxt-link>
              <nuxt-link class="mbl-dropdown__item" :to="localePath('/settings/import')">
                {{ $t('import') }}
              </nuxt-link>
            </div>
          </div>
        </div>
      </header>
      <div class="mbl-tabs wide-screen">
        <ul>
          <li>
            <nuxt-link :to="localePath('/settings')">
              {{ $t('account') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/settings/start')">
              {{ $t('start_page') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/settings/reading')">
              {{ $t('reading') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/settings/reminder')">
              {{ $t('reminder') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/settings/export')">
              {{ $t('export') }}
            </nuxt-link>
          </li>
          <li>
            <nuxt-link :to="localePath('/settings/import')">
              {{ $t('import') }}
            </nuxt-link>
          </li>
        </ul>
      </div>
      <nuxt-child />
    </div>
  </main>
</template>

<script>
import InfoLink from '@/components/ui/InfoLink';

export default {
  name: 'SettingsPage',
  components: {
    InfoLink,
  },
  middleware: ['auth'],
  data() {
    return {
      menuOpen: false,
    };
  },
  head() {
    return {
      title: this.$t('settings'),
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
  },
};
</script>

<style scoped>
@media screen and (min-width: 600px) {
  .narrow-screen {
    display: none;
  }
}

@media screen and (max-width: 599px) {
  .wide-screen {
    display: none;
  }
}
</style>

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
    "account": "Акаунт",
    "start_page": "Стартова сторінка",
    "reading": "Читання",
    "reminder": "Нагадування",
    "export": "Експорт",
    "import": "Імпорт"
  }
}
</i18n>
