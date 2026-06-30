<template>
  <div class="app-modal-root">
    <transition name="fade" appear>
      <div
        v-if="open"
        class="mbl-modal mbl-modal--active"
        role="dialog"
        data-testid="modal"
      >
        <div class="mbl-modal__backdrop" @click="close" />
        <div class="mbl-modal__card">
          <header class="mbl-modal__head">
            <p class="mbl-modal__title">
              {{ title }}
            </p>
            <button class="mbl-delete" type="button" aria-label="close" data-testid="modal-close" @click.prevent="close" />
          </header>
          <section
            class="mbl-modal__body"
          >
            <slot name="content" />
          </section>
          <footer v-if="$slots.footer" class="mbl-modal__foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
/**
 * Delay in milliseconds for the modal exit transition.
 * Based on the CSS transition duration for  the .mbl-modal class.
 */
const MODAL_EXIT_DELAY = 300;

export default {
  name: 'AppModal',
  props: {
    title: { type: String, default: '' },
    open: { type: Boolean, default: false },
  },
  watch: {
    open(newValue) {
      if (newValue) {
        document.body.style.overflow = 'hidden';
        this.teleportIn();
        document.addEventListener('keydown', this.handleKeydown);
      }
      else {
        document.body.style.overflow = '';
        setTimeout(() => this.teleportOut(), MODAL_EXIT_DELAY);
        document.removeEventListener('keydown', this.handleKeydown);
      }
    },
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    /**
     * This component’s root is rendered into the body of the document, rather than into the parent’s DOM.
     * This is a workaround for the fact that we cannot use the teleport component in Vue 2.
     * In Vue 3 we will be able to use the teleport component to achieve this,
     * but for now we need to manually append and remove the root from the body.
     * This frees the modal from any ancestor stacking context, avoiding z-index conflicts.
     * Specifically, this was needed to break the component out of a `sticky` stacking context.
     *
     * The root is a stable wrapper so `mounted` always has a real DOM node even when `open` is false
     * (the inner modal is gated by `open` inside a `<transition>`).
     */
    teleportIn() {
      // (remove in Vue 3 and use teleport component instead)
      if (typeof document === 'undefined') { return; }
      if (this.$el && this.$el.parentNode !== document.body) {
        document.body.appendChild(this.$el);
      }
    },
    teleportOut() {
      // (remove in Vue 3 and use teleport component instead)
      if (typeof document === 'undefined') { return; }
      if (this.$el && this.$el.parentNode === document.body) {
        document.body.removeChild(this.$el);
      }
    },
    handleKeydown(e) {
      if (e.key === 'Escape') { this.close(); }
    },
    close() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.app-modal-root {
  pointer-events: none;
}

.mbl-modal.mbl-modal--active {
  pointer-events: auto;
}

.mbl-modal .mbl-modal__backdrop {
  /*  help ensure modal background covers the entire viewport */
  height: 100dvh;
}

.mbl-modal.fade-enter-active,
.mbl-modal.fade-appear-active,
.mbl-modal.fade-leave-active {
  transition: var(--transition-fade);
}

.mbl-modal.fade-enter-active .mbl-modal__card,
.mbl-modal.fade-appear-active .mbl-modal__card,
.mbl-modal.fade-leave-active .mbl-modal__card {
  transition: var(--transition-modal);
}

.mbl-modal.fade-enter,
.mbl-modal.fade-appear,
.mbl-modal.fade-leave-to {
  opacity: 0;
}

.mbl-modal.fade-enter .mbl-modal__card,
.mbl-modal.fade-appear .mbl-modal__card,
.mbl-modal.fade-leave-to .mbl-modal__card {
  transform: var(--modal-scale);
}
</style>
