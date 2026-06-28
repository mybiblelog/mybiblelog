<template>
  <app-modal :open="open" :title="modalTitle" @close="handleClose">
    <template slot="content">
      <passage-note-tag-editor-form />
    </template>
    <template slot="footer">
      <button class="mbl-button mbl-button--primary" data-testid="tag-editor-submit" :disabled="!isValid || submitting" @click="handleSave">
        {{ $t('tag_editor.save') }}
      </button>
      <button class="mbl-button mbl-button--light" data-testid="tag-editor-close" @click="handleClose">
        {{ $t('tag_editor.close') }}
      </button>
    </template>
  </app-modal>
</template>

<script>
import AppModal from '@/components/popups/AppModal';
import PassageNoteTagEditorForm from '@/components/forms/PassageNoteTagEditorForm';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';

export default {
  name: 'PassageNoteTagEditorModal',
  components: {
    AppModal,
    PassageNoteTagEditorForm,
  },
  computed: {
    passageNoteTagEditorStore() {
      return usePassageNoteTagEditorStore();
    },
    open() {
      return this.passageNoteTagEditorStore.open;
    },
    isValid() {
      return this.passageNoteTagEditorStore.isValid;
    },
    submitting() {
      return this.passageNoteTagEditorStore.submitting;
    },
    modalTitle() {
      // Check if we're editing an existing tag or creating a new one
      const passageNoteTag = this.passageNoteTagEditorStore.passageNoteTag;
      if (passageNoteTag && passageNoteTag.id) {
        return this.$t('tag_editor.edit_tag');
      }
      return this.$t('tag_editor.add_tag');
    },
  },
  methods: {
    handleClose() {
      this.passageNoteTagEditorStore.closeEditor({
        confirmMessage: this.$t('messaging.are_you_sure_close_tag_editor'),
      });
    },
    handleSave() {
      // Trigger form submission
      this.passageNoteTagEditorStore.savePassageNoteTag();
    },
  },
};
</script>

<i18n lang="json">
{
  "en": {
    "tag_editor": {
      "edit_tag": "Edit Tag",
      "add_tag": "Add Tag",
      "save": "Save",
      "close": "Close"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "Are you sure you want to close the tag editor? All unsaved changes will be lost."
    }
  },
  "de": {
    "tag_editor": {
      "edit_tag": "Tag bearbeiten",
      "add_tag": "Tag hinzufügen",
      "save": "Speichern",
      "close": "Schließen"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "Möchten Sie den Tag-Editor wirklich schließen? Alle ungespeicherten Änderungen gehen verloren."
    }
  },
  "es": {
    "tag_editor": {
      "edit_tag": "Editar Etiqueta",
      "add_tag": "Añadir Etiqueta",
      "save": "Guardar",
      "close": "Cerrar"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "¿Estás seguro de que quieres cerrar el editor de etiquetas? Todas las modificaciones no guardadas se perderán."
    }
  },
  "fr": {
    "tag_editor": {
      "edit_tag": "Éditer le tag",
      "add_tag": "Ajouter un tag",
      "save": "Enregistrer",
      "close": "Fermer"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "Êtes-vous sûr de vouloir fermer l'éditeur de tags? Toutes les modifications non enregistrées seront perdues."
    }
  },
  "ko": {
    "tag_editor": {
      "edit_tag": "태그 편집",
      "add_tag": "태그 추가",
      "save": "저장",
      "close": "닫기"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "태그 편집창을 닫을까요? 저장하지 않은 변경 내용이 사라집니다."
    }
  },
  "pt": {
    "tag_editor": {
      "edit_tag": "Editar Tag",
      "add_tag": "Adicionar Tag",
      "save": "Salvar",
      "close": "Fechar"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "Tem certeza de que deseja fechar o editor de tags? Todas as modificações não salvas serão perdidas."
    }
  },
  "uk": {
    "tag_editor": {
      "edit_tag": "Редагувати Тег",
      "add_tag": "Додати Тег",
      "save": "Зберегти",
      "close": "Закрити"
    },
    "messaging": {
      "are_you_sure_close_tag_editor": "Ви впевнені, що хочете закрити редактор тегів? Всі незбережені зміни будуть втрачені."
    }
  }
}
</i18n>
