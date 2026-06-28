<template>
  <app-modal :open="open" :title="modalTitle" @close="handleClose">
    <template slot="content">
      <log-entry-editor-form />
    </template>
    <template slot="footer">
      <button class="mbl-button mbl-button--primary" :disabled="!isValid || submitting" data-testid="log-entry-editor-submit" @click="handleSave">
        {{ logEntry.id ? $t('save') : $t('add') }}
      </button>
      <button class="mbl-button mbl-button--light" data-testid="log-entry-editor-close" @click="handleClose">
        {{ $t('close') }}
      </button>
    </template>
  </app-modal>
</template>

<script>
import AppModal from '@/components/popups/AppModal';
import LogEntryEditorForm from '@/components/forms/LogEntryEditorForm';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useDialogStore } from '~/stores/dialog';

export default {
  name: 'LogEntryEditorModal',
  components: {
    AppModal,
    LogEntryEditorForm,
  },
  computed: {
    logEntryEditorStore() {
      return useLogEntryEditorStore();
    },
    userSettingsStore() {
      return useUserSettingsStore();
    },
    dialogStore() {
      return useDialogStore();
    },
    open() {
      return this.logEntryEditorStore.open;
    },
    isValid() {
      return this.logEntryEditorStore.isValid;
    },
    submitting() {
      return this.logEntryEditorStore.submitting;
    },
    logEntry() {
      return this.logEntryEditorStore.logEntry;
    },
    modalTitle() {
      if (this.logEntry && this.logEntry.id) {
        return this.$t('edit_entry');
      }
      return this.$t('add_entry');
    },
  },
  methods: {
    handleClose() {
      this.logEntryEditorStore.closeEditor({
        confirmMessage: this.$t('messaging.are_you_sure_close_editor'),
      });
    },
    async handleSave() {
      const entryDate = this.logEntry?.date;
      const result = await this.logEntryEditorStore.saveLogEntry().catch(() => null);
      if (result && entryDate) {
        const lookBackDate = this.userSettingsStore.settings.lookBackDate;
        if (lookBackDate && entryDate < lookBackDate) {
          this.dialogStore.alert({ message: this.$t('messaging.entry_before_tracker_start_date') });
        }
      }
    },
  },
};
</script>

<i18n lang="json">
{
  "en": {
    "add_entry": "Add Entry",
    "edit_entry": "Edit Entry",
    "save": "Save",
    "add": "Add",
    "close": "Close",
    "messaging": {
      "are_you_sure_close_editor": "Are you sure you want to close the editor? All unsaved changes will be lost.",
      "entry_before_tracker_start_date": "This entry is before your Tracker Start Date and will not be counted in your reading progress."
    }
  },
  "de": {
    "add_entry": "Eintrag hinzufügen",
    "edit_entry": "Eintrag bearbeiten",
    "save": "Speichern",
    "add": "Hinzufügen",
    "close": "Schließen",
    "messaging": {
      "are_you_sure_close_editor": "Möchten Sie den Editor wirklich schließen? Alle ungespeicherten Änderungen gehen verloren.",
      "entry_before_tracker_start_date": "Dieser Eintrag liegt vor Ihrem Tracker-Startdatum und wird nicht in Ihrem Lesefortschritt gezählt."
    }
  },
  "es": {
    "add_entry": "Añadir entrada",
    "edit_entry": "Editar entrada",
    "save": "Guardar",
    "add": "Añadir",
    "close": "Cerrar",
    "messaging": {
      "are_you_sure_close_editor": "¿Estás seguro de que quieres cerrar el editor? Todas las modificaciones no guardadas se perderán.",
      "entry_before_tracker_start_date": "Esta entrada es anterior a tu Fecha de Inicio del Rastreador y no se contará en tu progreso de lectura."
    }
  },
  "fr": {
    "add_entry": "Ajouter une entrée",
    "edit_entry": "Modifier l'entrée",
    "save": "Sauvegarder",
    "add": "Ajouter",
    "close": "Fermer",
    "messaging": {
      "are_you_sure_close_editor": "Êtes-vous sûr de vouloir fermer l'éditeur? Toutes les modifications non enregistrées seront perdues.",
      "entry_before_tracker_start_date": "Cette entrée est antérieure à votre Date de Début du Suivi et ne sera pas comptée dans votre progression de lecture."
    }
  },
  "ko": {
    "add_entry": "기록 추가",
    "edit_entry": "기록 수정",
    "save": "저장",
    "add": "추가",
    "close": "닫기",
    "messaging": {
      "are_you_sure_close_editor": "편집창을 닫을까요? 저장하지 않은 변경 내용이 사라집니다.",
      "entry_before_tracker_start_date": "이 기록은 추적기 시작일 이전의 날짜로, 읽기 진도에 포함되지 않습니다."
    }
  },
  "pt": {
    "add_entry": "Adicionar Entrada",
    "edit_entry": "Editar Entrada",
    "save": "Salvar",
    "add": "Adicionar",
    "close": "Fechar",
    "messaging": {
      "are_you_sure_close_editor": "Tem certeza de que deseja fechar o editor? Todas as modificações não salvas serão perdidas.",
      "entry_before_tracker_start_date": "Esta entrada é anterior à sua Data de Início do Rastreador e não será contada no seu progresso de leitura."
    }
  },
  "uk": {
    "add_entry": "Додати запис",
    "edit_entry": "Редагувати запис",
    "save": "Зберегти",
    "add": "Додати",
    "close": "Закрити",
    "messaging": {
      "are_you_sure_close_editor": "Ви впевнені, що хочете закрити редактор? Всі незбережені зміни будуть втрачені.",
      "entry_before_tracker_start_date": "Цей запис датований до вашої дати початку відстеження і не буде враховуватись у вашому прогресі читання."
    }
  }
}
</i18n>
