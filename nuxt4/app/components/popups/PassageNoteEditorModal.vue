<template>
  <app-modal :open="store.open" :title="store.passageNote.id ? t('edit_note') : t('new_note')" @close="handleClose">
    <template #content>
      <form data-testid="note-editor" @submit.prevent="handleSave">
        <div v-if="formError" class="mbl-help mbl-help--danger">
          {{ formError }}
        </div>

        <div class="mbl-field passages-title">
          <label class="mbl-label">{{ t('passages') }}</label>
          <button
            class="mbl-button mbl-button--primary mbl-button--sm"
            type="button"
            data-testid="note-editor-add-passage"
            :disabled="editingPassage > -1"
            @click.prevent="addPassage"
          >
            {{ t('add_passage') }}
          </button>
        </div>
        <div class="passage-list">
          <div v-for="(passage, index) in store.passageNote.passages" :key="index" class="passage-line">
            <div class="passage">
              <template v-if="editingPassage === index">
                <passage-selector :populate-with="passage" @change="(updatedPassage) => passageSelectorChange(index, updatedPassage)" />
              </template>
              <template v-else>
                <button
                  class="mbl-button"
                  type="button"
                  :disabled="editingPassage > -1 || editingNewPassage"
                  @click.prevent="startEditPassage(index)"
                >
                  {{ displayVerseRange(passage) }}
                </button>
              </template>
            </div>
            <div class="mbl-button-group">
              <template v-if="editingPassage === index">
                <button
                  class="mbl-button mbl-button--primary mbl-button--sm"
                  type="button"
                  :disabled="!editingPassageIsDirty"
                  @click.prevent="saveAndStopEditPassage(index)"
                >
                  {{ t('done') }}
                </button>
                <button
                  class="mbl-button mbl-button--sm"
                  type="button"
                  :disabled="editingPassage > -1 && editingPassage !== index"
                  @click.prevent="cancelAndStopEditPassage(index)"
                >
                  {{ t('cancel') }}
                </button>
              </template>
              <template v-else>
                <button
                  class="mbl-button mbl-button--danger mbl-button--sm"
                  type="button"
                  :disabled="editingPassage > -1 && editingPassage !== index"
                  @click.prevent="removePassage(index)"
                >
                  {{ t('remove') }}
                </button>
              </template>
            </div>
          </div>
          <div v-if="!store.passageNote.passages.length" class="passage-line">
            <div>{{ t('no_passages') }}</div>
          </div>
        </div>

        <div class="mbl-field">
          <label class="mbl-label">{{ t('content') }}</label>
          <div class="mbl-control">
            <textarea
              class="mbl-textarea"
              data-testid="note-editor-content"
              :value="store.passageNote.content"
              :disabled="editingPassage > -1"
              maxlength="3000"
              rows="6"
              @input="onContentInput"
            />
            <p class="mbl-help">
              {{ store.passageNote.content.length }}/3000 {{ t('characters') }}
            </p>
          </div>
        </div>

        <div class="mbl-field">
          <label class="mbl-label">{{ t('tags') }}</label>
          <div class="passage-note-editor-tags">
            <div class="passage-note-editor-tags__selected">
              <passage-note-tag-pill v-for="tag in selectedTags" :key="tag.id" :tag="tag" />
              <em v-if="!selectedTags.length" class="passage-note-editor-tags__none">
                {{ t('no_tags_selected') }}
              </em>
            </div>
            <div class="passage-note-editor-tags__actions">
              <button
                class="mbl-button mbl-button--sm"
                type="button"
                data-testid="note-editor-manage-tags"
                @click.prevent="openManageTags"
              >
                {{ t('manage_tags') }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </template>
    <template #footer>
      <button
        class="mbl-button mbl-button--primary"
        type="button"
        data-testid="note-editor-submit"
        :disabled="!isValid || store.submitting"
        @click="handleSave"
      >
        {{ store.passageNote.id ? t('save') : t('add') }}
      </button>
      <button class="mbl-button mbl-button--light" type="button" @click="handleClose">
        {{ t('close') }}
      </button>
    </template>
  </app-modal>

  <passage-note-manage-tags-modal
    :open="showManageTagsModal"
    :passage-note-tags="allTags"
    :selected-tag-ids="draftSelectedTagIds"
    @change="draftSelectedTagIds = $event"
    @done="applyManageTags"
    @cancel="closeManageTags"
  />
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import PassageSelector from '~/components/forms/PassageSelector.vue';
import PassageNoteTagPill from '~/components/notes/PassageNoteTagPill.vue';
import PassageNoteManageTagsModal from '~/components/popups/PassageNoteManageTagsModal.vue';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { useDialogStore } from '~/stores/dialog';

const { t, locale } = useI18n();
const store = usePassageNoteEditorStore();
const passageNoteTagsStore = usePassageNoteTagsStore();

const formError = ref('');
const editingPassage = ref(-1);
const editingPassageOriginalValue = ref<string | null>(null);
const editingNewPassage = ref(false);
const showManageTagsModal = ref(false);
const draftSelectedTagIds = ref<Array<string | number>>([]);

const allTags = computed(() => passageNoteTagsStore.passageNoteTags ?? []);

const selectedTags = computed(() => {
  const tagIds = store.passageNote.tags ?? [];
  const tags = allTags.value;
  if (!tags.length) {
    return tagIds.map(id => ({ id, label: t('loading'), color: 'var(--mbl-text-strong)' }));
  }
  return tagIds
    .map(id => tags.find(tag => tag.id === id))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
    .map(tag => ({ id: tag.id as string | number, label: tag.label ?? '', color: tag.color ?? 'var(--mbl-text-strong)' }));
});

const isValid = computed(() => {
  if (editingPassage.value > -1) { return false; }
  // A note requires at least passages OR content to be populated.
  return Boolean(store.passageNote.content.length || store.passageNote.passages.length);
});

const editingPassageIsDirty = computed(() => {
  if (editingPassage.value === -1) { return false; }
  const passage = store.passageNote.passages[editingPassage.value] as { startVerseId?: number; endVerseId?: number };
  if (editingNewPassage.value) {
    return Bible.validateRange(passage?.startVerseId as number, passage?.endVerseId as number);
  }
  return JSON.stringify(passage) !== editingPassageOriginalValue.value;
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function displayVerseRange(passage: { startVerseId?: number; endVerseId?: number; empty?: boolean }) {
  if (!passage?.startVerseId || !passage?.endVerseId) { return ''; }
  return Bible.displayVerseRange(passage.startVerseId, passage.endVerseId, locale.value);
}

function passageSelectorChange(index: number, { startVerseId, endVerseId }: { startVerseId: number; endVerseId: number }) {
  const updated = clone(store.passageNote);
  updated.passages.splice(index, 1, { startVerseId, endVerseId });
  store.updatePassageNote(updated);
}

function addPassage() {
  const updated = clone(store.passageNote);
  updated.passages.push({ empty: true });
  store.updatePassageNote(updated);
  editingPassage.value = updated.passages.length - 1;
  editingNewPassage.value = true;
}

function startEditPassage(index: number) {
  if (editingNewPassage.value || editingPassage.value > -1) { return; }
  editingPassageOriginalValue.value = JSON.stringify(store.passageNote.passages[index]);
  editingPassage.value = index;
}

function saveAndStopEditPassage(index: number) {
  const passage = store.passageNote.passages[index] as { startVerseId?: number; endVerseId?: number };
  if (Bible.validateRange(passage?.startVerseId as number, passage?.endVerseId as number)) {
    editingPassage.value = -1;
    editingNewPassage.value = false;
    editingPassageOriginalValue.value = null;
  }
}

function cancelAndStopEditPassage(index: number) {
  if (editingNewPassage.value) {
    removePassage(editingPassage.value);
  }
  else {
    const updated = clone(store.passageNote);
    updated.passages.splice(index, 1, JSON.parse(editingPassageOriginalValue.value as string));
    store.updatePassageNote(updated);
  }
  editingPassage.value = -1;
  editingNewPassage.value = false;
  editingPassageOriginalValue.value = null;
}

async function removePassage(index: number) {
  if (!editingNewPassage.value) {
    const confirmed = await useDialogStore().confirm({
      message: t('are_you_sure'),
      confirmButtonType: 'danger',
    });
    if (!confirmed) { return; }
  }
  if (editingPassage.value === index) {
    editingPassage.value = -1;
  }
  const updated = clone(store.passageNote);
  updated.passages.splice(index, 1);
  store.updatePassageNote(updated);
  editingNewPassage.value = false;
  editingPassageOriginalValue.value = null;
}

function onContentInput(e: Event) {
  const updated = clone(store.passageNote);
  updated.content = (e.target as HTMLTextAreaElement).value;
  store.updatePassageNote(updated);
}

function updateSelectedTags(tagIds: Array<string | number>) {
  const updated = clone(store.passageNote);
  updated.tags = tagIds;
  store.updatePassageNote(updated);
}

function openManageTags() {
  draftSelectedTagIds.value = clone(store.passageNote.tags ?? []);
  showManageTagsModal.value = true;
}

function closeManageTags() {
  showManageTagsModal.value = false;
}

function applyManageTags(tagIds: Array<string | number>) {
  updateSelectedTags(tagIds);
  closeManageTags();
}

async function handleSave() {
  if (!isValid.value) { return; }
  formError.value = '';
  const result = await store.savePassageNote();
  if (!result) {
    formError.value = String((store.errors as Record<string, unknown>)?._form ?? t('could_not_save'));
  }
}

async function handleClose() {
  await store.closeEditor();
}

// Reset transient editing state whenever the editor opens or closes.
watch(() => store.open, () => {
  editingPassage.value = -1;
  editingPassageOriginalValue.value = null;
  editingNewPassage.value = false;
  showManageTagsModal.value = false;
  formError.value = '';
});

// Ensure the global tags list is available for rendering selected tag pills.
onMounted(() => {
  if (!passageNoteTagsStore.passageNoteTags?.length) {
    passageNoteTagsStore.loadPassageNoteTags();
  }
});
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

.passage-line .passage {
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
    "new_note": "New Note",
    "edit_note": "Edit Note",
    "passages": "Passages",
    "add_passage": "Add Passage",
    "done": "Done",
    "cancel": "Cancel",
    "remove": "Remove",
    "no_passages": "No passages added yet",
    "content": "Content",
    "characters": "characters",
    "tags": "Tags",
    "manage_tags": "Choose Tags",
    "no_tags_selected": "No tags selected",
    "loading": "Loading",
    "save": "Save",
    "add": "Save",
    "close": "Close",
    "could_not_save": "The note could not be saved.",
    "are_you_sure": "Are you sure you want to remove this passage?"
  },
  "de": {
    "new_note": "Neue Notiz",
    "edit_note": "Notiz bearbeiten",
    "passages": "Passagen",
    "add_passage": "Passage hinzufügen",
    "done": "Fertig",
    "cancel": "Abbrechen",
    "remove": "Entfernen",
    "no_passages": "Noch keine Passagen hinzugefügt",
    "content": "Inhalt",
    "characters": "Zeichen",
    "tags": "Tags",
    "manage_tags": "Tags auswählen",
    "no_tags_selected": "Keine Tags ausgewählt",
    "loading": "Laden",
    "save": "Speichern",
    "add": "Speichern",
    "close": "Schließen",
    "could_not_save": "Die Notiz konnte nicht gespeichert werden.",
    "are_you_sure": "Sind Sie sicher, dass Sie diese Passage entfernen möchten?"
  },
  "es": {
    "new_note": "Nueva nota",
    "edit_note": "Editar nota",
    "passages": "Pasajes",
    "add_passage": "Añadir Pasaje",
    "done": "Hecho",
    "cancel": "Cancelar",
    "remove": "Eliminar",
    "no_passages": "No hay pasajes",
    "content": "Contenido",
    "characters": "caracteres",
    "tags": "Etiquetas",
    "manage_tags": "Elegir etiquetas",
    "no_tags_selected": "No hay etiquetas seleccionadas",
    "loading": "Cargando",
    "save": "Guardar",
    "add": "Guardar",
    "close": "Cerrar",
    "could_not_save": "La nota no se pudo guardar.",
    "are_you_sure": "¿Estás seguro de que quieres eliminar este pasaje?"
  },
  "fr": {
    "new_note": "Nouvelle note",
    "edit_note": "Modifier la note",
    "passages": "Passages",
    "add_passage": "Ajouter un passage",
    "done": "Terminé",
    "cancel": "Annuler",
    "remove": "Supprimer",
    "no_passages": "Aucun passage",
    "content": "Contenu",
    "characters": "caractères",
    "tags": "Tags",
    "manage_tags": "Choisir des tags",
    "no_tags_selected": "Aucune étiquette sélectionnée",
    "loading": "Chargement",
    "save": "Sauvegarder",
    "add": "Sauvegarder",
    "close": "Fermer",
    "could_not_save": "La note n'a pas pu être sauvegardée.",
    "are_you_sure": "Êtes-vous sûr de vouloir supprimer ce passage ?"
  },
  "ko": {
    "new_note": "새 노트",
    "edit_note": "노트 편집",
    "passages": "구절",
    "add_passage": "구절 추가",
    "done": "완료",
    "cancel": "취소",
    "remove": "삭제",
    "no_passages": "아직 추가된 구절이 없습니다",
    "content": "내용",
    "characters": "자",
    "tags": "태그",
    "manage_tags": "태그 선택",
    "no_tags_selected": "선택된 태그 없음",
    "loading": "불러오는 중",
    "save": "저장",
    "add": "저장",
    "close": "닫기",
    "could_not_save": "노트를 저장할 수 없습니다.",
    "are_you_sure": "해당 구절을 삭제할까요?"
  },
  "pt": {
    "new_note": "Nova nota",
    "edit_note": "Editar nota",
    "passages": "Passagens",
    "add_passage": "Adicionar Passagem",
    "done": "Concluído",
    "cancel": "Cancelar",
    "remove": "Remover",
    "no_passages": "Nenhuma passagem adicionada ainda",
    "content": "Conteúdo",
    "characters": "caracteres",
    "tags": "Tags",
    "manage_tags": "Escolher tags",
    "no_tags_selected": "Nenhuma tag selecionada",
    "loading": "Carregando",
    "save": "Salvar",
    "add": "Salvar",
    "close": "Fechar",
    "could_not_save": "A nota não pôde ser salva.",
    "are_you_sure": "Tem certeza de que deseja remover esta passagem?"
  },
  "uk": {
    "new_note": "Нова нотатка",
    "edit_note": "Редагувати нотатку",
    "passages": "Пасажі",
    "add_passage": "Додати пасаж",
    "done": "Готово",
    "cancel": "Скасувати",
    "remove": "Видалити",
    "no_passages": "Немає пасажів",
    "content": "Зміст",
    "characters": "символи",
    "tags": "Теги",
    "manage_tags": "Вибрати теги",
    "no_tags_selected": "Теги не вибрані",
    "loading": "Завантаження",
    "save": "Зберегти",
    "add": "Зберегти",
    "close": "Закрити",
    "could_not_save": "Не вдалося зберегти нотатку.",
    "are_you_sure": "Ви впевнені, що хочете видалити цей пасаж?"
  }
}
</i18n>
