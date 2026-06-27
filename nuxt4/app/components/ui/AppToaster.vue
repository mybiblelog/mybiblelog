<template>
  <div class="toaster">
    <div class="mbl-container">
      <TransitionGroup name="toast" tag="div">
        <div v-for="message in toastStore.messages" :key="message.id" class="mbl-notification" :class="messageClass(message.type)">
          <button class="mbl-delete" @click="toastStore.close(message.id)" />{{ message.text }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast';

const toastStore = useToastStore();

const messageClass = (type?: string) => {
  switch (type) {
  case 'info': return 'mbl-notification--info';
  case 'success': return 'mbl-notification--success';
  case 'warning': return 'mbl-notification--warning';
  case 'error': return 'mbl-notification--danger';
  default: return '';
  }
};
</script>

<style scoped>
.toaster {
  position: fixed;
  top: 72px;
  left: 1rem;
  right: 1rem;
  z-index: var(--z-index-toast);
  pointer-events: none;
}

.mbl-notification {
  box-shadow: 0 0 0 2px var(--mbl-bg), 0 0 5px var(--mbl-text-stronger);
  pointer-events: auto;
  margin-bottom: 1rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
