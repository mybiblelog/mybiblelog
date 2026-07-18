<template>
  <Teleport to="body">
    <Transition name="fade" appear>
      <div
        v-if="open"
        class="mbl-modal mbl-modal--active"
        role="dialog"
        data-testid="modal"
      >
        <div class="mbl-modal__backdrop" @click="emit('close')" />
        <div class="mbl-modal__card">
          <header class="mbl-modal__head">
            <p class="mbl-modal__title">
              {{ title }}
            </p>
            <button class="mbl-delete" type="button" aria-label="close" data-testid="modal-close" @click.prevent="emit('close')" />
          </header>
          <section class="mbl-modal__body">
            <slot name="content" />
          </section>
          <footer v-if="$slots.footer" class="mbl-modal__foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ title?: string; open?: boolean }>(), {
  title: '',
  open: false,
});

const emit = defineEmits<{ close: [] }>();

useEscapeKey(() => emit('close'), toRef(props, 'open'));

watch(() => props.open, (newValue) => {
  if (import.meta.client) {
    document.body.style.overflow = newValue ? 'hidden' : '';
  }
});
</script>

<style scoped>
.mbl-modal .mbl-modal__backdrop {
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

.mbl-modal.fade-enter-from,
.mbl-modal.fade-leave-to {
  opacity: 0;
}

.mbl-modal.fade-enter-from .mbl-modal__card,
.mbl-modal.fade-leave-to .mbl-modal__card {
  transform: var(--modal-scale);
}
</style>
