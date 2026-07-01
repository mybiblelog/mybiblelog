<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="dialog.open" class="popup-modal">
        <div class="window" role="dialog">
          <div v-if="dialog.title" class="mbl-title mbl-title--4">
            {{ dialog.title }}
          </div>
          <div class="mbl-content">
            <p>{{ dialog.message }}</p>
          </div>
          <div v-if="dialog.type === 'alert'" class="mbl-button-group">
            <button class="mbl-button" :class="buttonClass" data-testid="dialog-ok" @click="dialog.closeAlert()">
              {{ dialog.buttonText || t('ok') }}
            </button>
          </div>
          <div v-if="dialog.type === 'confirm'" class="mbl-button-group popup-modal__actions">
            <button class="mbl-button" :class="confirmButtonClass" data-testid="dialog-confirm" @click="dialog.acceptConfirm()">
              {{ dialog.confirmButtonText || t('confirm') }}
            </button>
            <button class="mbl-button mbl-button--light" data-testid="dialog-cancel" @click="dialog.cancelConfirm()">
              {{ dialog.cancelButtonText || t('cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useDialogStore } from '~/stores/dialog';

const { t } = useI18n();
const dialog = useDialogStore();

const buttonTypeToClass = (type: string) => ({
  primary: 'mbl-button--primary',
  secondary: 'mbl-button--secondary',
  danger: 'mbl-button--danger',
}[type] ?? 'mbl-button--primary');

const buttonClass = computed(() => buttonTypeToClass(dialog.buttonType));
const confirmButtonClass = computed(() => buttonTypeToClass(dialog.confirmButtonType));
</script>

<style scoped>
.popup-modal {
  background-color: var(--mbl-overlay-50);
  position: fixed;
  inset: 0;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  z-index: var(--z-index-popup);
  user-select: none;
}

.popup-modal.fade-enter-active,
.popup-modal.fade-leave-active {
  transition: var(--transition-fade);
}

.popup-modal.fade-enter-active .window,
.popup-modal.fade-leave-active .window {
  transition: var(--transition-modal);
}

.popup-modal.fade-enter-from,
.popup-modal.fade-leave-to {
  opacity: 0;
}

.popup-modal.fade-enter-from .window,
.popup-modal.fade-leave-to .window {
  transform: var(--modal-scale);
}

.window {
  background: var(--mbl-bg);
  padding: 2rem;
  border: 1px solid var(--mbl-border);
  border-radius: var(--modal-card-border-radius);
  box-shadow: 0 0 0.5rem var(--mbl-overlay-20);
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
}

.popup-modal__actions {
  margin-top: 1.25rem;
}
</style>

<i18n lang="json">
{
  "en": { "ok": "OK", "confirm": "Confirm", "cancel": "Cancel" },
  "de": { "ok": "OK", "confirm": "Bestätigen", "cancel": "Abbrechen" },
  "es": { "ok": "OK", "confirm": "Confirmar", "cancel": "Cancelar" },
  "fr": { "ok": "D'accord", "confirm": "Confirmer", "cancel": "Annuler" },
  "ko": { "ok": "확인", "confirm": "확인", "cancel": "취소" },
  "pt": { "ok": "OK", "confirm": "Confirmar", "cancel": "Cancelar" },
  "uk": { "ok": "OK", "confirm": "Підтвердить", "cancel": "Скасувати" }
}
</i18n>
