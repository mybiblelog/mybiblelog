<template>
  <div class="theme-switcher" :class="rootClass">
    <button
      v-if="variant === 'toolbar'"
      type="button"
      class="theme-switcher__toolbar-btn"
      :aria-label="toolbarAriaLabel"
      @click="modalOpen = true"
    >
      <span class="theme-switcher__toolbar-icon" aria-hidden="true">
        <sun-icon v-if="themeStore.mode === 'light'" width="20px" height="20px" />
        <moon-icon v-else-if="themeStore.mode === 'dark'" width="20px" height="20px" />
        <computer-icon v-else width="20px" height="20px" />
      </span>
    </button>
    <button
      v-else
      type="button"
      class="theme-switcher__drawer-btn"
      @click="modalOpen = true"
    >
      <span class="theme-switcher__drawer-leading">
        <span class="theme-switcher__drawer-icon" aria-hidden="true">
          <sun-icon v-if="themeStore.mode === 'light'" width="20px" height="20px" />
          <moon-icon v-else-if="themeStore.mode === 'dark'" width="20px" height="20px" />
          <computer-icon v-else width="20px" height="20px" />
        </span>
        <span class="theme-switcher__drawer-label">{{ $t('theme') }}</span>
      </span>
      <span class="theme-switcher__drawer-value">{{ currentModeLabelLong }}</span>
    </button>
    <app-modal :open="modalOpen" :title="$t('choose_theme')" @close="modalOpen = false">
      <template slot="content">
        <div class="theme-switcher-modal">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="theme-switcher-modal__btn"
            :class="{ 'theme-switcher-modal__btn--active': option.value === themeStore.mode }"
            @click="setMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </template>
    </app-modal>
  </div>
</template>

<script>
import AppModal from '@/components/popups/AppModal.vue';
import ComputerIcon from '@/components/svg/ComputerIcon.vue';
import MoonIcon from '@/components/svg/MoonIcon.vue';
import SunIcon from '@/components/svg/SunIcon.vue';
import { useThemeStore } from '~/stores/theme';

export default {
  name: 'ThemeSwitcher',
  components: {
    AppModal,
    ComputerIcon,
    MoonIcon,
    SunIcon,
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
    themeStore() {
      return useThemeStore();
    },
    rootClass() {
      return this.variant === 'drawer'
        ? 'theme-switcher--drawer'
        : 'theme-switcher--toolbar';
    },
    options() {
      return [
        { value: 'light', label: this.$t('light').toString() },
        { value: 'dark', label: this.$t('dark').toString() },
        { value: 'system', label: this.$t('system').toString() },
      ];
    },
    toolbarAriaLabel() {
      const current = this.currentModeLabelLong;
      return `${current}. ${this.$t('choose_theme')}`;
    },
    currentModeLabelLong() {
      const found = this.options.find(option => option.value === this.themeStore.mode);
      return found ? found.label : this.$t('system').toString();
    },
  },
  methods: {
    setMode(mode) {
      this.themeStore.setMode(mode);
      this.modalOpen = false;
    },
  },
};
</script>

<style scoped>
.theme-switcher--toolbar {
  display: inline-flex;
  align-items: center;
}

.theme-switcher__toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.75rem;
  height: 2.75rem;
  padding: 0 0.6rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--mbl-text-strong);
  line-height: 0;
  cursor: pointer;
}

.theme-switcher__toolbar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-switcher__toolbar-btn:hover {
  background: var(--mbl-bg-hover-light);
}

.theme-switcher__toolbar-btn:active {
  background: var(--mbl-bg-hover-strong);
}

.theme-switcher__toolbar-btn:focus {
  outline: none;
}

.theme-switcher__toolbar-btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

.theme-switcher--drawer {
  display: block;
  width: 100%;
}

.theme-switcher__drawer-btn {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
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

.theme-switcher__drawer-btn:hover {
  background: var(--neutral-150);
}

.theme-switcher__drawer-btn:focus {
  outline: none;
}

.theme-switcher__drawer-btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

.theme-switcher__drawer-leading {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.theme-switcher__drawer-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
  color: inherit;
}

.theme-switcher__drawer-value {
  color: var(--mbl-text-muted);
  font-size: 0.875rem;
}

.theme-switcher-modal {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.theme-switcher-modal__btn {
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--neutral-200);
  border-radius: 6px;
  background: var(--mbl-bg);
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--mbl-text-strong);
  cursor: pointer;
}

.theme-switcher-modal__btn:hover {
  background: var(--neutral-150);
  border-color: var(--neutral-300);
}

.theme-switcher-modal__btn--active {
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 1px var(--secondary-color);
}

.theme-switcher-modal__btn:focus {
  outline: none;
}

.theme-switcher-modal__btn:focus-visible {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}
</style>

<i18n lang="json">
{
  "en": {
    "theme": "Theme",
    "choose_theme": "Choose Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "de": {
    "theme": "Design",
    "choose_theme": "Design wählen",
    "light": "Hell",
    "dark": "Dunkel",
    "system": "System"
  },
  "es": {
    "theme": "Tema",
    "choose_theme": "Elegir tema",
    "light": "Claro",
    "dark": "Oscuro",
    "system": "Sistema"
  },
  "fr": {
    "theme": "Thème",
    "choose_theme": "Choisir le thème",
    "light": "Clair",
    "dark": "Sombre",
    "system": "Système"
  },
  "ko": {
    "theme": "테마",
    "choose_theme": "테마 선택",
    "light": "라이트",
    "dark": "다크",
    "system": "시스템"
  },
  "pt": {
    "theme": "Tema",
    "choose_theme": "Escolher tema",
    "light": "Claro",
    "dark": "Escuro",
    "system": "Sistema"
  },
  "uk": {
    "theme": "Тема",
    "choose_theme": "Вибрати тему",
    "light": "Світла",
    "dark": "Темна",
    "system": "Системна"
  }
}
</i18n>
