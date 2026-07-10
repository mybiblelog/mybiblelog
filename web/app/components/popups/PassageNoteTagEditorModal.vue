<template>
  <app-modal
    :open="tagEditorStore.open"
    :title="tagEditorStore.passageNoteTag.id ? t('edit_tag') : t('add_tag')"
    @close="handleEditorClose"
  >
    <template #content>
      <div v-if="editorError" class="mbl-help mbl-help--danger">
        {{ editorError }}
      </div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('label') }}</label>
        <div class="mbl-control">
          <input
            class="mbl-input"
            data-testid="tag-editor-label"
            type="text"
            :value="tagEditorStore.passageNoteTag.label"
            @input="onLabelInput"
          >
        </div>
      </div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('color') }}</label>
        <div class="mbl-control">
          <input
            class="mbl-input"
            data-testid="tag-editor-color"
            type="color"
            :value="tagEditorStore.passageNoteTag.color"
            @input="onColorInput"
          >
        </div>
      </div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('description') }}</label>
        <div class="mbl-control">
          <textarea
            class="mbl-textarea"
            data-testid="tag-editor-description"
            :value="tagEditorStore.passageNoteTag.description"
            @input="onDescriptionInput"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <button
        class="mbl-button mbl-button--primary"
        data-testid="tag-editor-submit"
        :disabled="!tagEditorStore.passageNoteTag.label.trim() || tagEditorStore.submitting"
        @click="handleEditorSave"
      >
        {{ t('save') }}
      </button>
      <button class="mbl-button mbl-button--light" @click="handleEditorClose">
        {{ t('close') }}
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';

const { t } = useI18n();
const tagEditorStore = usePassageNoteTagEditorStore();

const editorError = ref('');

watch(() => tagEditorStore.open, (isOpen) => {
  if (isOpen) { editorError.value = ''; }
});

function onLabelInput(e: Event) {
  const target = e.target as HTMLInputElement;
  tagEditorStore.updatePassageNoteTag({ ...tagEditorStore.passageNoteTag, label: target.value });
}

function onColorInput(e: Event) {
  const target = e.target as HTMLInputElement;
  tagEditorStore.updatePassageNoteTag({ ...tagEditorStore.passageNoteTag, color: target.value });
}

function onDescriptionInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  tagEditorStore.updatePassageNoteTag({ ...tagEditorStore.passageNoteTag, description: target.value });
}

async function handleEditorSave() {
  editorError.value = '';
  const result = await tagEditorStore.savePassageNoteTag();
  if (!result) {
    editorError.value = String(tagEditorStore.errors?._form ?? t('unknown_error'));
  }
}

async function handleEditorClose() {
  await tagEditorStore.closeEditor();
}
</script>

<i18n lang="json">
{
  "en": {
    "label": "Label",
    "color": "Color",
    "description": "Description",
    "save": "Save",
    "close": "Close",
    "edit_tag": "Edit Tag",
    "add_tag": "Add Tag",
    "unknown_error": "An unknown error occurred."
  },
  "de": {
    "label": "Label",
    "color": "Farbe",
    "description": "Beschreibung",
    "save": "Speichern",
    "close": "Schließen",
    "edit_tag": "Tag bearbeiten",
    "add_tag": "Tag hinzufügen",
    "unknown_error": "Unbekannter Fehler."
  },
  "es": {
    "label": "Etiqueta",
    "color": "Color",
    "description": "Descripción",
    "save": "Guardar",
    "close": "Cerrar",
    "edit_tag": "Editar etiqueta",
    "add_tag": "Nueva etiqueta",
    "unknown_error": "Error desconocido."
  },
  "fr": {
    "label": "Étiquette",
    "color": "Couleur",
    "description": "Description",
    "save": "Enregistrer",
    "close": "Fermer",
    "edit_tag": "Éditer",
    "add_tag": "Ajouter",
    "unknown_error": "Erreur inconnue."
  },
  "ko": {
    "label": "태그 이름",
    "color": "색상",
    "description": "설명",
    "save": "저장",
    "close": "닫기",
    "edit_tag": "편집",
    "add_tag": "추가",
    "unknown_error": "오류."
  },
  "pt": {
    "label": "Nome",
    "color": "Cor",
    "description": "Descrição",
    "save": "Salvar",
    "close": "Fechar",
    "edit_tag": "Editar",
    "add_tag": "Adicionar",
    "unknown_error": "Erro desconhecido."
  },
  "uk": {
    "label": "Мітка",
    "color": "Колір",
    "description": "Опис",
    "save": "Зберегти",
    "close": "Закрити",
    "edit_tag": "Редагувати",
    "add_tag": "Додати",
    "unknown_error": "Помилка."
  }
}
</i18n>
