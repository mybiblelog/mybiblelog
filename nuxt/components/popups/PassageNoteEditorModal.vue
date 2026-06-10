<template>
  <app-modal :open="open" :title="modalTitle" @close="handleClose">
    <template slot="content">
      <passage-note-editor-form
        :passage-note-tags="passageNoteTags"
      />
    </template>
    <template slot="footer">
      <button class="mbl-button mbl-button--primary" data-testid="note-editor-submit" :disabled="!isValid" @click="handleSave">
        {{ $t('note_editor.save') }}
      </button>
      <button class="mbl-button mbl-button--light" data-testid="note-editor-close" @click="handleClose">
        {{ $t('note_editor.close') }}
      </button>
    </template>
  </app-modal>
</template>

<script>
import AppModal from '@/components/popups/AppModal';
import PassageNoteEditorForm from '@/components/forms/PassageNoteEditorForm';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export default {
  name: 'PassageNoteEditorModal',
  components: {
    AppModal,
    PassageNoteEditorForm,
  },
  computed: {
    passageNoteEditorStore() {
      return usePassageNoteEditorStore();
    },
    passageNoteTagsStore() {
      return usePassageNoteTagsStore();
    },
    open() {
      return this.passageNoteEditorStore.open;
    },
    isValid() {
      return this.passageNoteEditorStore.isValid;
    },
    passageNoteTags() {
      return this.passageNoteTagsStore.passageNoteTags;
    },
    modalTitle() {
      // Check if we're editing an existing note or creating a new one
      const passageNote = this.passageNoteEditorStore.passageNote;
      if (passageNote && passageNote.id) {
        return this.$t('note_editor.edit_note');
      }
      return this.$t('note_editor.add_note');
    },
  },
  watch: {
    open(newValue) {
      // Load passage note tags when modal opens
      if (newValue) {
        this.passageNoteTagsStore.loadPassageNoteTags();
      }
    },
  },
  methods: {
    handleClose() {
      this.passageNoteEditorStore.closeEditor({
        confirmMessage: this.$t('messaging.are_you_sure_close_editor'),
      });
    },
    handleSave() {
      // Trigger form submission
      this.passageNoteEditorStore.savePassageNote();
    },
  },
};
</script>

<i18n lang="json">
{
  "en": {
    "note_editor": {
      "edit_note": "Edit Note",
      "add_note": "Add Note",
      "save": "Save",
      "close": "Close"
    },
    "messaging": {
      "are_you_sure_close_editor": "Are you sure you want to close the note editor? All unsaved changes will be lost."
    }
  },
  "de": {
    "note_editor": {
      "edit_note": "Notiz bearbeiten",
      "add_note": "Notiz hinzufügen",
      "save": "Speichern",
      "close": "Schließen"
    },
    "messaging": {
      "are_you_sure_close_editor": "Möchten Sie den Noteneditor wirklich schließen? Alle ungespeicherten Änderungen gehen verloren."
    }
  },
  "es": {
    "note_editor": {
      "edit_note": "Editar Nota",
      "add_note": "Agregar Nota",
      "save": "Guardar",
      "close": "Cerrar"
    },
    "messaging": {
      "are_you_sure_close_editor": "¿Estás seguro de que quieres cerrar el editor de notas? Todas las modificaciones no guardadas se perderán."
    }
  },
  "fr": {
    "note_editor": {
      "edit_note": "Modifier la note",
      "add_note": "Ajouter une note",
      "save": "Enregistrer",
      "close": "Fermer"
    },
    "messaging": {
      "are_you_sure_close_editor": "Êtes-vous sûr de vouloir fermer l'éditeur de notes? Toutes les modifications non enregistrées seront perdues."
    }
  },
  "ko": {
    "note_editor": {
      "edit_note": "노트 편집",
      "add_note": "노트 추가",
      "save": "저장",
      "close": "닫기"
    },
    "messaging": {
      "are_you_sure_close_editor": "노트 편집창을 닫을까요? 저장하지 않은 변경 내용이 사라집니다."
    }
  },
  "pt": {
    "note_editor": {
      "edit_note": "Editar Nota",
      "add_note": "Adicionar Nota",
      "save": "Salvar",
      "close": "Fechar"
    },
    "messaging": {
      "are_you_sure_close_editor": "Tem certeza de que deseja fechar o editor de notas? Todas as modificações não salvas serão perdidas."
    }
  },
  "uk": {
    "note_editor": {
      "edit_note": "Редагувати Ноту",
      "add_note": "Додати Ноту",
      "save": "Зберегти",
      "close": "Закрити"
    },
    "messaging": {
      "are_you_sure_close_editor": "Ви впевнені, що хочете закрити редактор нотатків? Всі незбережені зміни будуть втрачені."
    }
  }
}
</i18n>
