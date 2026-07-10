<template>
  <div class="language-switcher" :class="variant === 'drawer' ? 'language-switcher--drawer' : 'language-switcher--toolbar'">
    <button
      v-if="variant === 'toolbar'"
      type="button"
      class="language-switcher__toolbar-btn"
      :aria-label="t('choose_language')"
      data-testid="language-switcher-toolbar-btn"
      @click="modalOpen = true"
    >
      <SvgTranslatorIcon />
    </button>
    <button
      v-else
      type="button"
      class="language-switcher__drawer-btn"
      data-testid="language-switcher-drawer-btn"
      @click="modalOpen = true"
    >
      <SvgTranslatorIcon class="language-switcher__drawer-icon" width="20" height="20" />
      <span class="language-switcher__drawer-label">{{ t('choose_language') }}</span>
    </button>
    <PopupsAppModal :open="modalOpen" :title="'🌎 ' + t('choose_language')" @close="modalOpen = false">
      <template #content>
        <div class="language-switcher-modal">
          <div class="language-switcher-modal__grid">
            <a
              v-for="loc in availableLocales"
              :key="loc.code"
              class="language-switcher-modal__btn"
              href="#"
              role="button"
              @click.prevent.stop="selectLocale(loc.code)"
            >
              <strong v-if="loc.code === locale">{{ loc.name }}</strong>
              <span v-else>{{ loc.name }}</span>
            </a>
          </div>
        </div>
      </template>
    </PopupsAppModal>
  </div>
</template>

<script setup lang="ts">
import type { LocaleCode } from '@mybiblelog/shared';
import { useAuthStore } from '~/stores/auth';
import { useUserSettingsStore } from '~/stores/user-settings';

withDefaults(defineProps<{ variant?: 'toolbar' | 'drawer' }>(), {
  variant: 'toolbar',
});

const { t, locale, locales, setLocale } = useI18n();
const authStore = useAuthStore();
const userSettingsStore = useUserSettingsStore();
const modalOpen = ref(false);

const availableLocales = computed(() =>
  (locales.value as Array<{ code: LocaleCode; name: string }>),
);

const selectLocale = async (code: LocaleCode) => {
  modalOpen.value = false;
  await setLocale(code);
  if (authStore.loggedIn) {
    userSettingsStore.updateSettings({ locale: code });
  }
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
  container-type: inline-size;
  max-width: 100%;
}

.language-switcher-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  max-width: 100%;
}

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
