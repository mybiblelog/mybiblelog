<template>
  <div>
    <Transition name="fade">
      <div v-if="store.open" class="action-sheet-overlay" @click="store.closeSheet()" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="store.open" class="action-sheet" @click.stop>
        <div v-if="store.title" class="action-sheet-title">{{ store.title }}</div>
        <div
          v-for="action in store.actions"
          :key="action.label"
          class="action-sheet-item"
          data-testid="action-sheet-item"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useActionSheetStore } from '~/stores/action-sheet';
import type { ActionSheetItem } from '~/stores/action-sheet';

const store = useActionSheetStore();

watch(() => store.open, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : '';
  }
});

function handleAction(action: ActionSheetItem) {
  store.closeSheet();
  action.callback?.();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && store.open) {
    store.closeSheet();
  }
}

onMounted(() => { document.addEventListener('keydown', handleKeydown); });
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-action-menu);
  background: var(--mbl-overlay-50);
}

.action-sheet {
  position: fixed;
  left: 0;
  right: 0;
  background: var(--mbl-bg);
  border: 1px solid var(--mbl-border);
  box-shadow: var(--mbl-shadow-overlay);
  z-index: calc(var(--z-index-action-menu) + 1);
  overflow-y: auto;
  max-height: 80vh;
  bottom: 0;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

@media (min-width: 800px) {
  .action-sheet {
    bottom: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
    width: auto;
    min-width: 300px;
    max-width: 500px;
    border-radius: 0.5rem;
    max-height: 70vh;
  }
}

.action-sheet-title {
  padding: 1.25rem 1.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--mbl-text-strong);
  border-bottom: 1px solid var(--mbl-overlay-15);
  background-color: var(--mbl-bg-subtle);
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}

@media (min-width: 800px) {
  .action-sheet-title {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }
}

.action-sheet-item {
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
  color: var(--mbl-text-strong);
  border-bottom: 1px solid var(--mbl-overlay-10);
}

.action-sheet-item:hover {
  background-color: var(--mbl-bg-muted);
}

.action-sheet-item:last-child {
  border-bottom: none;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.slide-up-enter-active,
.slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(100%); opacity: 0; }

@media (min-width: 800px) {
  .slide-up-enter-from,
  .slide-up-leave-to { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
}
</style>
