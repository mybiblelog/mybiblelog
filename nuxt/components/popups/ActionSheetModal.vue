<template>
  <div>
    <!-- Overlay with fade transition -->
    <transition name="fade">
      <div
        v-if="open"
        class="action-sheet-overlay"
        @click="close"
      />
    </transition>

    <!-- Sheet with slide transition -->
    <transition name="slide-up">
      <div
        v-if="open"
        class="action-sheet"
        @click.stop
      >
        <div v-if="title" class="action-sheet-title">
          {{ title }}
        </div>
        <div
          v-for="action in actions"
          :key="action.label"
          class="action-sheet-item"
          data-testid="action-sheet-item"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { useActionSheetStore } from '~/stores/action-sheet';

export default {
  name: 'ActionSheetModal',
  computed: {
    actionSheetStore() {
      return useActionSheetStore();
    },
    open() {
      return this.actionSheetStore.open;
    },
    title() {
      return this.actionSheetStore.title;
    },
    actions() {
      return this.actionSheetStore.actions;
    },
  },
  watch: {
    open(newValue) {
      // Prevent body scroll when sheet is open
      if (newValue) {
        document.body.style.overflow = 'hidden';
      }
      else {
        document.body.style.overflow = '';
      }
    },
  },
  mounted() {
    // Close sheet when pressing Escape
    document.addEventListener('keydown', this.handleKeydown);
    // Prevent body scroll when sheet is open
    if (this.open) {
      document.body.style.overflow = 'hidden';
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.body.style.overflow = '';
  },
  methods: {
    close() {
      this.actionSheetStore.closeSheet();
    },
    handleAction(action) {
      this.close();
      if (action.callback) {
        action.callback();
      }
    },
    handleKeydown(event) {
      // Close on Escape key
      if (event.key === 'Escape' && this.open) {
        this.close();
      }
    },
  },
};
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

  /*  Small screens: bottom sheet style */
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
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
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
}

@media (max-width: 799px) {
  .action-sheet-title {
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
  }
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

.action-sheet-item:active {
  background-color: var(--neutral-150);
}

.action-sheet-item:last-child {
  border-bottom: none;
}

@media (max-width: 799px) {
  .action-sheet-item:first-child {
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
  }
}

@media (min-width: 800px) {
  .action-sheet-item:first-child {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
  }

  .action-sheet-item:last-child {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }
}

/*  Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/*  Slide up transition for sheet */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 800px) {
  .slide-up-enter {
    transform: translate(-50%, -50%) var(--modal-scale);
    opacity: 0;
  }
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 800px) {
  .slide-up-leave-to {
    transform: translate(-50%, -50%) var(--modal-scale);
    opacity: 0;
  }
}

.slide-up-enter-to,
.slide-up-leave {
  transform: translateY(0);
  opacity: 1;
}

@media (min-width: 800px) {
  .slide-up-enter-to,
  .slide-up-leave {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}
</style>
