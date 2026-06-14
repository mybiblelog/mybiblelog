<template>
  <div class="language-switcher" :class="rootClass">
    <button
      v-if="variant === 'toolbar'"
      type="button"
      class="language-switcher__toolbar-btn"
      :aria-label="$t('choose_language')"
      @click="modalOpen = true"
    >
      <translator-icon />
    </button>
    <button
      v-else
      type="button"
      class="language-switcher__drawer-btn"
      @click="modalOpen = true"
    >
      <translator-icon class="language-switcher__drawer-icon" width="20" height="20" />
      <span class="language-switcher__drawer-label">{{ $t('choose_language') }}</span>
    </button>
    <app-modal :open="modalOpen" :title="'🌎 ' + $t('choose_language')" @close="modalOpen = false">
      <template slot="content">
        <div class="language-switcher-modal">
          <div class="language-switcher-modal__grid">
            <a
              v-for="locale in availableLocales"
              :key="locale.code"
              class="language-switcher-modal__btn"
              href="#"
              role="button"
              @click.prevent.stop="() => { modalOpen = false; setLocale(locale.code); }"
            >
              <strong v-if="locale.code === $i18n.locale">{{ locale.name }}</strong>
              <span v-else>{{ locale.name }}</span>
            </a>
          </div>
        </div>
      </template>
    </app-modal>
  </div>
</template>

<script>
import AppModal from '@/components/popups/AppModal.vue';
import TranslatorIcon from '@/components/svg/TranslatorIcon.vue';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'LanguageSwitcher',
  components: {
    AppModal,
    TranslatorIcon,
  },
  props: {
    variant: {
      type: String,
      default: 'toolbar',
      validator(v) {
        return v === 'toolbar' || v === 'drawer';
      },
    },
  },
  data() {
    return {
      modalOpen: false,
    };
  },
  computed: {
    rootClass() {
      return this.variant === 'drawer'
        ? 'language-switcher--drawer'
        : 'language-switcher--toolbar';
    },
    availableLocales() {
      return this.$i18n.locales;
    },
  },
  methods: {
    setLocale(locale) {
      this.$i18n.setLocale(locale);

      // If the user is already logged in and changes the locale, we capture the new locale in the database
      if (useAuthStore().loggedIn) {
        useUserSettingsStore().updateSettings({ locale });
      }
    },
  },
};
</script>

<style scoped>
.language-switcher--toolbar {
  display: inline-flex;
  align-items: center;
}

.language-switcher__toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--mbl-text-strong);
  cursor: pointer;
}

.language-switcher__toolbar-btn:hover {
  background: var(--mbl-bg-hover-light);
}

.language-switcher__toolbar-btn:active {
  background: var(--mbl-bg-hover-strong);
}

.language-switcher__toolbar-btn:focus {
  outline: none;
}

.language-switcher__toolbar-btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

.language-switcher--drawer {
  display: block;
  width: 100%;
}

.language-switcher__drawer-btn {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  margin: 0;
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  background: var(--mbl-bg);
  font-size: 1rem;
  font-family: inherit;
  color: var(--mbl-text-strong);
  text-align: left;
  cursor: pointer;
}

.language-switcher__drawer-btn:hover {
  background: var(--neutral-150);
}

.language-switcher__drawer-btn:focus {
  outline: none;
}

.language-switcher__drawer-btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

.language-switcher__drawer-label {
  flex: 1;
}

.language-switcher-modal {
  /* stylelint-disable-next-line property-no-unknown */
  container-type: inline-size;
  max-width: 100%;
}

.language-switcher-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  max-width: 100%;
}

/* stylelint-disable-next-line at-rule-no-unknown */
@container (max-width: 300px) {
  .language-switcher-modal__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.language-switcher-modal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--neutral-200);
  border-radius: 6px;
  background: var(--mbl-bg);
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--mbl-text-strong);
  text-decoration: none;
  text-align: center;
  cursor: pointer;
}

.language-switcher-modal__btn:hover {
  background: var(--neutral-150);
  border-color: var(--neutral-300);
}

.language-switcher-modal__btn:focus {
  outline: none;
}

.language-switcher-modal__btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}
</style>

<i18n lang="json">
{
  "en": {
    "choose_language": "Choose Language"
  },
  "de": {
    "choose_language": "Sprache wählen"
  },
  "es": {
    "choose_language": "Elige idioma"
  },
  "fr": {
    "choose_language": "Choisissez la langue"
  },
  "ko": {
    "choose_language": "언어 선택"
  },
  "pt": {
    "choose_language": "Escolha o Idioma"
  },
  "uk": {
    "choose_language": "Виберіть мову"
  }
}
</i18n>
