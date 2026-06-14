<template>
  <form data-testid="note-editor" @submit.prevent="handleSubmit">
    <div v-if="errors._form" class="mbl-help mbl-help--danger">
      <div class="mbl-help mbl-help--danger">
        {{ $terr(errors._form) }}
      </div>
    </div>
    <div class="mbl-field passages-title">
      <label class="mbl-label">{{ $t('passages') }}</label>
      <button class="mbl-button mbl-button--primary mbl-button--sm" data-testid="note-editor-add-passage" :disabled="editingPassage > -1" @click.prevent="addPassage">
        {{ $t('add_passage') }}
      </button>
    </div>
    <div class="passage-list">
      <div v-for="(passage, index) in passageNote.passages" :key="index" class="passage-line">
        <div class="passage">
          <template v-if="editingPassage === index">
            <passage-selector :populate-with="passage" @change="(updatedPassage) => passageSelectorChange(index, updatedPassage)" />
          </template>
          <template v-else>
            <button class="mbl-button" :disabled="editingPassage > -1 || editingNewPassage" @click.prevent="startEditPassage(index)">
              {{ displayVerseRange(passage.startVerseId, passage.endVerseId) }}
            </button>
          </template>
        </div>
        <div class="mbl-button-group">
          <template v-if="editingPassage === index">
            <button class="mbl-button mbl-button--primary mbl-button--sm" :disabled="!editingPassageIsDirty" @click.prevent="saveAndStopEditPassage(index)">
              {{ $t('done') }}
            </button>
            <button class="mbl-button mbl-button--sm" :disabled="editingPassage > -1 && editingPassage !== index" @click.prevent="cancelAndStopEditPassage(index)">
              {{ $t('cancel') }}
            </button>
          </template>
          <template v-else>
            <button class="mbl-button mbl-button--danger mbl-button--sm" :disabled="editingPassage > -1 && editingPassage !== index" @click.prevent="removePassage(index)">
              {{ $t('remove') }}
            </button>
          </template>
        </div>
      </div>
      <div v-if="!passageNote.passages.length" class="passage-line">
        <div>{{ $t('no_passages') }}</div>
      </div>
    </div>
    <div class="mbl-field">
      <label class="mbl-label">{{ $t('content') }}</label>
      <div class="mbl-control">
        <textarea
          :value="passageNote.content"
          class="mbl-textarea"
          data-testid="note-editor-content"
          :disabled="editingPassage > -1"
          maxlength="3000"
          @input="updateContent"
        />
        <p v-if="errors.content" class="mbl-help mbl-help--danger">
          {{ errors.content }}
        </p>
        <p class="mbl-help">
          {{ passageNote.content.length }}/3000 {{ $t('characters') }}
        </p>
      </div>
    </div>
    <div class="mbl-field">
      <label class="mbl-label">{{ $t('tags') }}</label>
      <div class="passage-note-editor-tags">
        <div class="passage-note-editor-tags__selected">
          <passage-note-tag-pill
            v-for="tag in selectedTags"
            :key="tag.id"
            :tag="tag"
          />
          <em v-if="!selectedTags.length" class="passage-note-editor-tags__none">
            {{ $t('no_tags_selected') }}
          </em>
        </div>
        <div class="passage-note-editor-tags__actions">
          <button class="mbl-button mbl-button--sm" type="button" data-testid="note-editor-manage-tags" @click.prevent="openManageTags">
            {{ $t('manage_tags') }}
          </button>
        </div>
      </div>
      <passage-note-manage-tags-modal
        :open="showManageTagsModal"
        :passage-note-tags="passageNoteTags"
        :selected-tag-ids="draftSelectedTagIds"
        @change="draftSelectedTagIds = $event"
        @done="applyManageTags"
        @cancel="closeManageTags"
      />
    </div>
    <!-- ensures property will be computed because it is accessed-->
    <p hidden="hidden">
      {{ isValid }}
    </p>
  </form>
</template>

<script>
import { Bible } from '@mybiblelog/shared';
import PassageSelector from '@/components/forms/PassageSelector';
import PassageNoteTagPill from '@/components/notes/PassageNoteTagPill';
import PassageNoteManageTagsModal from '@/components/popups/PassageNoteManageTagsModal';
import { useDialogStore } from '~/stores/dialog';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';

export default {
  name: 'PassageNoteEditorForm',
  components: {
    PassageSelector,
    PassageNoteTagPill,
    PassageNoteManageTagsModal,
  },
  props: {
    passageNoteTags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      editingPassage: -1, // index of passage being edited
      editingPassageOriginalValue: null, // original value of passage being edited
      editingNewPassage: false, // if editor passage has not been saved yet
      showManageTagsModal: false,
      draftSelectedTagIds: [],
    };
  },
  computed: {
    passageNoteEditorStore() {
      return usePassageNoteEditorStore();
    },
    passageNote() {
      return this.passageNoteEditorStore.passageNote;
    },
    errors() {
      return this.passageNoteEditorStore.errors;
    },
    selectedTags() {
      const tagIds = this.passageNote?.tags ?? [];
      if (!this.passageNoteTags?.length) {
        return tagIds.map(id => ({ id, label: this.$t('loading'), color: 'var(--mbl-text-strong)' }));
      }
      return tagIds.map(id => this.passageNoteTags.find(tag => tag.id === id)).filter(Boolean);
    },
    isValid() {
      let valid = true;
      if (this.editingPassage > -1) {
        valid = false;
      }
      // notes require at least `passages` OR `content` to be populated
      if (!this.passageNote.content.length && !this.passageNote.passages.length) {
        valid = false;
      }
      this.passageNoteEditorStore.setValid(valid);
      return valid;
    },
    editingPassageIsDirty() {
      // If no passage is being edited, it can't be dirty
      if (this.editingPassage === -1) {
        return false;
      }
      const passage = this.passageNote.passages[this.editingPassage];
      // If we are editing a new passage, check if it is valid yet
      if (this.editingNewPassage) {
        // Check if the passage being edited is valid
        const { startVerseId, endVerseId } = passage;
        const valid = Bible.validateRange(startVerseId, endVerseId);
        return valid;
      }
      // If we are editing an existing passage, check if it has changed
      return JSON.stringify(passage) !== this.editingPassageOriginalValue;
    },
  },
  methods: {
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    passageSelectorChange(index, { startVerseId, endVerseId }) {
      const updatedPassageNote = JSON.parse(JSON.stringify(this.passageNote));
      this.$set(updatedPassageNote.passages, index, { startVerseId, endVerseId });
      this.passageNoteEditorStore.updatePassageNote(updatedPassageNote);
    },
    addPassage() {
      const updatedPassageNote = JSON.parse(JSON.stringify(this.passageNote));
      updatedPassageNote.passages.push({ empty: true });
      this.passageNoteEditorStore.updatePassageNote(updatedPassageNote);
      this.editingPassage = updatedPassageNote.passages.length - 1;
      this.editingNewPassage = true;
    },
    startEditPassage(index) {
      // Prevent editing existing passages when a new passage is being added
      // or when another passage is already being edited
      if (this.editingNewPassage || this.editingPassage > -1) {
        return;
      }
      this.editingPassageOriginalValue = JSON.stringify(this.passageNote.passages[index]);
      this.editingPassage = index;
    },
    saveAndStopEditPassage(index) {
      // Only allow a valid passage to be "saved" to the passageNote
      const { startVerseId, endVerseId } = this.passageNote.passages[index];
      if (Bible.validateRange(startVerseId, endVerseId)) {
        this.editingPassage = -1;
        this.editingNewPassage = false;
        this.editingPassageOriginalValue = null;
      }
    },
    cancelAndStopEditPassage(index) {
      // if a new passage, remove it
      if (this.editingNewPassage) {
        this.removePassage(this.editingPassage);
      }
      // if an existing passage, return to original value
      else {
        const updatedPassageNote = JSON.parse(JSON.stringify(this.passageNote));
        const originalValue = JSON.parse(this.editingPassageOriginalValue);
        this.$set(updatedPassageNote.passages, index, originalValue);
        this.passageNoteEditorStore.updatePassageNote(updatedPassageNote);
      }
      this.editingPassage = -1;
      this.editingNewPassage = false;
      this.editingPassageOriginalValue = null;
    },
    async removePassage(index) {
      // only require confirmation if the passage is already valid (new or existing)
      if (!this.editingNewPassage) {
        const dialogStore = useDialogStore();
        const confirmed = await dialogStore.confirm({
          message: this.$t('are_you_sure'),
          confirmButtonType: 'danger',
        });
        if (!confirmed) {
          return;
        }
      }
      if (this.editingPassage === index) {
        this.editingPassage = -1;
      }
      const updatedPassageNote = JSON.parse(JSON.stringify(this.passageNote));
      updatedPassageNote.passages.splice(index, 1);
      this.passageNoteEditorStore.updatePassageNote(updatedPassageNote);
      this.editingNewPassage = false;
      this.editingPassageOriginalValue = null;
    },
    updateContent(event) {
      const updatedPassageNote = JSON.parse(JSON.stringify(this.passageNote));
      updatedPassageNote.content = event.target.value;
      this.passageNoteEditorStore.updatePassageNote(updatedPassageNote);
    },
    updateSelectedTags(tags) {
      const updatedPassageNote = JSON.parse(JSON.stringify(this.passageNote));
      updatedPassageNote.tags = tags;
      this.passageNoteEditorStore.updatePassageNote(updatedPassageNote);
    },
    openManageTags() {
      this.draftSelectedTagIds = JSON.parse(JSON.stringify(this.passageNote?.tags ?? []));
      this.showManageTagsModal = true;
    },
    closeManageTags() {
      this.showManageTagsModal = false;
    },
    applyManageTags(tagIds) {
      this.updateSelectedTags(tagIds);
      this.closeManageTags();
    },
    handleSubmit() {
      this.passageNoteEditorStore.savePassageNote();
    },
  },
};
</script>

<style scoped>
.passages-title {
  display: flex;
  justify-content: space-between;
}
.passage-list {
  margin-bottom: 0.5rem;
}
.passage-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.25rem 0;
  border: 0 solid var(--mbl-border-strong);
  border-top-width: 1px;
}

.passage-line:first-child {
  border-top-style: solid;
}

.passage-line:last-child {
  border-bottom-width: 1px;
  border-bottom-style: solid;
}

.passage-line .passage,
.passage-line .controls {
  margin: 0.25rem 0;
}
.passage-note-editor-tags {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}
.passage-note-editor-tags__selected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
}
.passage-note-editor-tags__actions {
  flex-shrink: 0;
}
.passage-note-editor-tags__none {
  opacity: 0.8;
}
</style>

<i18n lang="json">
{
  "en": {
    "passages": "Passages",
    "add_passage": "Add Passage",
    "done": "Done",
    "cancel": "Cancel",
    "remove": "Remove",
    "no_passages": "No passages added yet",
    "content": "Content",
    "tags": "Tags",
    "manage_tags": "Choose Tags",
    "no_tags_selected": "No tags selected",
    "loading": "Loading",
    "characters": "characters",
    "are_you_sure": "Are you sure you want to remove this passage?"
  },
  "de": {
    "passages": "Passagen",
    "add_passage": "Passage hinzufügen",
    "done": "Fertig",
    "cancel": "Abbrechen",
    "remove": "Entfernen",
    "no_passages": "Noch keine Passagen hinzugefügt",
    "content": "Inhalt",
    "tags": "Tags",
    "manage_tags": "Tags auswählen",
    "no_tags_selected": "Keine Tags ausgewählt",
    "loading": "Laden",
    "characters": "Zeichen",
    "are_you_sure": "Sind Sie sicher, dass Sie diese Passage entfernen möchten?"
  },
  "es": {
    "passages": "Pasajes",
    "add_passage": "Añadir Pasaje",
    "done": "Hecho",
    "cancel": "Cancelar",
    "remove": "Eliminar",
    "no_passages": "No hay pasajes",
    "content": "Contenido",
    "tags": "Etiquetas",
    "manage_tags": "Elegir etiquetas",
    "no_tags_selected": "No hay etiquetas seleccionadas",
    "loading": "Cargando",
    "characters": "caracteres",
    "are_you_sure": "¿Estás seguro de que quieres eliminar este pasaje?"
  },
  "fr": {
    "passages": "Passages",
    "add_passage": "Ajouter un passage",
    "done": "Terminé",
    "cancel": "Annuler",
    "remove": "Supprimer",
    "no_passages": "Aucun passage",
    "content": "Contenu",
    "tags": "Étiquettes",
    "manage_tags": "Choisir des étiquettes",
    "no_tags_selected": "Aucune étiquette sélectionnée",
    "loading": "Chargement",
    "characters": "caractères",
    "are_you_sure": "Êtes-vous sûr de vouloir supprimer ce passage ?"
  },
  "ko": {
    "passages": "구절",
    "add_passage": "구절 추가",
    "done": "완료",
    "cancel": "취소",
    "remove": "삭제",
    "no_passages": "아직 추가된 구절이 없습니다",
    "content": "내용",
    "tags": "태그",
    "manage_tags": "태그 선택",
    "no_tags_selected": "선택된 태그가 없습니다",
    "loading": "불러오는 중",
    "characters": "자",
    "are_you_sure": "해당 구절을 삭제할까요?"
  },
  "pt": {
    "passages": "Passagens",
    "add_passage": "Adicionar Passagem",
    "done": "Concluído",
    "cancel": "Cancelar",
    "remove": "Remover",
    "no_passages": "Nenhuma passagem adicionada ainda",
    "content": "Conteúdo",
    "tags": "Tags",
    "manage_tags": "Escolher Tags",
    "no_tags_selected": "Nenhuma tag selecionada",
    "loading": "Carregando",
    "characters": "caracteres",
    "are_you_sure": "Tem certeza de que deseja remover esta passagem?"
  },
  "uk": {
    "passages": "Пасажі",
    "add_passage": "Додати пасаж",
    "done": "Готово",
    "cancel": "Скасувати",
    "remove": "Видалити",
    "no_passages": "Немає пасажів",
    "content": "Зміст",
    "tags": "Теги",
    "manage_tags": "Вибрати теги",
    "no_tags_selected": "Теги не вибрані",
    "loading": "Завантаження",
    "characters": "символи",
    "are_you_sure": "Ви впевнені, що хочете видалити цей пасаж?"
  }
}
</i18n>
