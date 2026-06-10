<template>
  <pop-up-modal :visible="dialog.open">
    <div v-if="dialog.title" class="mbl-title mbl-title--4">
      {{ dialog.title }}
    </div>
    <div class="mbl-content">
      <p>{{ dialog.message }}</p>
    </div>
    <div v-if="dialog.type === 'alert'" class="mbl-button-group">
      <button class="mbl-button" :class="buttonClass" data-testid="dialog-ok" @click="_clear">
        {{ dialog.buttonText || $t('ok') }}
      </button>
    </div>
    <div v-if="dialog.type === 'confirm'" class="mbl-button-group popup-modal__actions">
      <button class="mbl-button" :class="confirmButtonClass" data-testid="dialog-confirm" @click="_confirm">
        {{ dialog.confirmButtonText || $t('confirm') }}
      </button>
      <button class="mbl-button mbl-button--light" data-testid="dialog-cancel" @click="_cancel">
        {{ dialog.cancelButtonText || $t('cancel') }}
      </button>
    </div>
  </pop-up-modal>
</template>

<script>
import { useDialogStore } from '~/stores/dialog';
import PopUpModal from '@/components/popups/PopUpModal.vue';

const buttonTypeToClass = (buttonType) => {
  return {
    primary: 'mbl-button--primary',
    secondary: 'mbl-button--secondary',
    danger: 'mbl-button--danger',
  }[buttonType] ?? 'mbl-button--primary';
};

export default {
  name: 'PopUps',
  components: {
    PopUpModal,
  },
  computed: {
    dialogStore() {
      return useDialogStore();
    },
    dialog() {
      return this.dialogStore;
    },
    buttonClass() {
      const buttonClass = buttonTypeToClass(this.dialog.buttonType);
      return buttonClass;
    },
    confirmButtonClass() {
      const buttonClass = buttonTypeToClass(this.dialog.confirmButtonType);
      return buttonClass;
    },
  },

  methods: {
    _clear() {
      this.dialogStore.closeAlert();
    },
    _confirm() {
      this.dialogStore.acceptConfirm();
    },
    _cancel() {
      this.dialogStore.cancelConfirm();
    },
  },
};
</script>

<style scoped>
.popup-modal__actions {
  margin-top: 1.25rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "ok": "OK",
    "confirm": "Confirm",
    "cancel": "Cancel"
  },
  "de": {
    "ok": "OK",
    "confirm": "Bestätigen",
    "cancel": "Abbrechen"
  },
  "es": {
    "ok": "OK",
    "confirm": "Confirmar",
    "cancel": "Cancelar"
  },
  "fr": {
    "ok": "D'accord",
    "confirm": "Confirmer",
    "cancel": "Annuler"
  },
  "ko": {
    "ok": "확인",
    "confirm": "확인",
    "cancel": "취소"
  },
  "pt": {
    "ok": "OK",
    "confirm": "Confirmar",
    "cancel": "Cancelar"
  },
  "uk": {
    "ok": "OK",
    "confirm": "Підтвердити",
    "cancel": "Скасувати"
  }
}
</i18n>
