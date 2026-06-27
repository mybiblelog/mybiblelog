<template>
  <div class="action-menu-wrapper">
    <div v-if="isOpen" class="action-menu-overlay" @click="close" />

    <button
      v-if="actions.length > 0"
      :aria-label="t('open_menu')"
      class="action-menu-button"
      data-testid="action-menu-toggle"
      @click.stop="toggle"
    >
      <span class="action-menu-button-icon" />
    </button>

    <div v-if="isOpen" class="action-menu" @click.stop>
      <div
        v-for="action in actions"
        :key="action.label"
        class="action-menu-item"
        data-testid="action-menu-item"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

type Action = { label: string; callback?: () => void };

const props = withDefaults(defineProps<{ actions?: Action[] }>(), { actions: () => [] });
const isOpen = ref(false);

const toggle = () => { isOpen.value = !isOpen.value; };
const close = () => { isOpen.value = false; };

const handleAction = (action: Action) => {
  close();
  action.callback?.();
};

const handleDocumentClick = (event: Event) => {
  const el = getCurrentInstance()?.proxy?.$el as HTMLElement | undefined;
  if (isOpen.value && el && !el.contains(event.target as Node)) {
    close();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.action-menu-wrapper {
  position: relative;
  display: inline-block;
}

.action-menu-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  width: 35px;
  height: 35px;
}

.action-menu-button:hover {
  background-color: var(--mbl-overlay-05);
}

.action-menu-button:focus {
  outline: 2px solid var(--mbl-link-bright);
  outline-offset: 2px;
}

.action-menu-button-icon {
  position: relative;
  display: inline-block;
  width: 3px;
  height: 3px;
  color: var(--mbl-text-subtle);
  user-select: none;
  background-color: currentColor;
  border-radius: 50%;
  box-shadow:
    0 -6px 0 0 currentColor,
    0 6px 0 0 currentColor;
}

.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-action-menu);
  background: transparent;
}

.action-menu {
  position: absolute;
  top: 0;
  right: 0;
  margin-top: 0;
  background: var(--mbl-bg);
  border: 1px solid var(--mbl-menu-border, var(--mbl-overlay-20));
  border-radius: 0.25rem;
  box-shadow: 0 2px 8px var(--mbl-overlay-25);
  min-width: 150px;
  z-index: 39;
  overflow: hidden;
}

.action-menu-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
  color: var(--mbl-text-strong);
}

.action-menu-item:hover {
  background-color: var(--mbl-bg-muted);
}

.action-menu-item:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.action-menu-item:last-child {
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "open_menu": "Open menu"
  },
  "de": {
    "open_menu": "Menü öffnen"
  },
  "es": {
    "open_menu": "Abrir menú"
  },
  "fr": {
    "open_menu": "Ouvrir le menu"
  },
  "ko": {
    "open_menu": "메뉴 열기"
  },
  "pt": {
    "open_menu": "Abrir menu"
  },
  "uk": {
    "open_menu": "Відкрити меню"
  }
}
</i18n>
