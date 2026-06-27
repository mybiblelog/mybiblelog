<template>
  <AppModal :open="store.open" :title="store.passageNote.id ? t('edit_note') : t('new_note')" @close="handleClose">
    <template #content>
      <form data-testid="note-editor" @submit.prevent="handleSave">
        <div v-if="formError" class="mbl-help mbl-help--danger">{{ formError }}</div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('content') }}</label>
          <div class="mbl-control">
            <textarea
              class="mbl-textarea"
              data-testid="note-editor-content"
              :value="store.passageNote.content"
              maxlength="3000"
              rows="6"
              @input="onContentInput"
            />
          </div>
        </div>
        <div class="mbl-field">
          <label class="mbl-label">{{ t('tags') }}</label>
          <div class="note-editor-tags">
            <PassageNoteTagPill v-for="tag in selectedTags" :key="tag.id" :tag="tag" />
            <em v-if="!selectedTags.length">{{ t('no_tags_selected') }}</em>
          </div>
          <button class="mbl-button mbl-button--sm" type="button" @click="openTagPicker">{{ t('manage_tags') }}</button>
        </div>
      </form>
    </template>
    <template #footer>
      <button
        class="mbl-button mbl-button--primary"
        data-testid="note-editor-submit"
        :disabled="!store.passageNote.content.trim()"
        @click="handleSave"
      >
        {{ store.passageNote.id ? t('save') : t('add') }}
      </button>
      <button class="mbl-button mbl-button--light" @click="handleClose">{{ t('close') }}</button>
    </template>
  </AppModal>

  <AppModal :open="tagPickerOpen" :title="t('choose_tags')" @close="closeTagPicker">
    <template #content>
      <div class="tag-picker">
        <label
          v-for="tag in allTags"
          :key="tag.id"
          class="tag-picker-item"
          :class="{ selected: draftTags.includes(String(tag.id)) }"
          @click="toggleTag(String(tag.id))"
        >
          <span class="tag-pill" :style="{ backgroundColor: tag.color }">{{ tag.label }}</span>
        </label>
      </div>
    </template>
    <template #footer>
      <button class="mbl-button mbl-button--primary" @click="applyTagPicker">{{ t('done') }}</button>
      <button class="mbl-button mbl-button--light" @click="closeTagPicker">{{ t('cancel') }}</button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import PassageNoteTagPill from '~/components/notes/PassageNoteTagPill.vue';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

const { t } = useI18n();
const store = usePassageNoteEditorStore();
const passageNoteTagsStore = usePassageNoteTagsStore();

const formError = ref('');
const tagPickerOpen = ref(false);
const draftTags = ref<string[]>([]);

const allTags = computed(() => passageNoteTagsStore.passageNoteTags ?? []);

const selectedTags = computed(() => {
  const tagIds = store.passageNote.tags ?? [];
  return tagIds
    .map(id => allTags.value.find(t => String(t.id) === String(id)))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map(t => ({ id: t.id as string | number, label: t.label ?? '', color: t.color ?? 'var(--mbl-text-strong)' }));
});

function onContentInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  store.updatePassageNote({ ...store.passageNote, content: target.value });
}

function openTagPicker() {
  draftTags.value = (store.passageNote.tags ?? []).map(String);
  tagPickerOpen.value = true;
}

function closeTagPicker() {
  tagPickerOpen.value = false;
}

function toggleTag(id: string) {
  const idx = draftTags.value.indexOf(id);
  if (idx >= 0) {
    draftTags.value = draftTags.value.filter(t => t !== id);
  }
  else {
    draftTags.value = [...draftTags.value, id];
  }
}

function applyTagPicker() {
  store.updatePassageNote({ ...store.passageNote, tags: draftTags.value });
  closeTagPicker();
}

async function handleSave() {
  formError.value = '';
  const result = await store.savePassageNote();
  if (!result) {
    formError.value = String((store.errors as Record<string, unknown>)?._form ?? t('could_not_save'));
  }
}

async function handleClose() {
  await store.closeEditor();
}
</script>

<style scoped>
.note-editor-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; min-height: 1.5rem; }
.tag-picker { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; }
.tag-picker-item { cursor: pointer; }
.tag-pill {
  display: inline-block;
  font-size: 0.85em;
  color: var(--mbl-on-accent);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 2px solid transparent;
}
.tag-picker-item.selected .tag-pill { border-color: var(--mbl-text-stronger); }
</style>

<i18n lang="json">
{
  "en": {
    "new_note": "New Note",
    "edit_note": "Edit Note",
    "content": "Content",
    "tags": "Tags",
    "manage_tags": "Choose Tags",
    "no_tags_selected": "No tags selected",
    "choose_tags": "Choose Tags",
    "done": "Done",
    "cancel": "Cancel",
    "save": "Save",
    "add": "Save",
    "close": "Close",
    "could_not_save": "The note could not be saved."
  },
  "de": { "new_note": "Neue Notiz", "edit_note": "Notiz bearbeiten", "content": "Inhalt", "tags": "Tags", "manage_tags": "Tags auswählen", "no_tags_selected": "Keine Tags ausgewählt", "choose_tags": "Tags auswählen", "done": "Fertig", "cancel": "Abbrechen", "save": "Speichern", "add": "Speichern", "close": "Schließen", "could_not_save": "Die Notiz konnte nicht gespeichert werden." },
  "es": { "new_note": "Nueva nota", "edit_note": "Editar nota", "content": "Contenido", "tags": "Etiquetas", "manage_tags": "Elegir etiquetas", "no_tags_selected": "No hay etiquetas seleccionadas", "choose_tags": "Elegir etiquetas", "done": "Hecho", "cancel": "Cancelar", "save": "Guardar", "add": "Guardar", "close": "Cerrar", "could_not_save": "La nota no se pudo guardar." },
  "fr": { "new_note": "Nouvelle note", "edit_note": "Modifier la note", "content": "Contenu", "tags": "Tags", "manage_tags": "Choisir des tags", "no_tags_selected": "Aucune étiquette sélectionnée", "choose_tags": "Choisir des tags", "done": "Terminé", "cancel": "Annuler", "save": "Sauvegarder", "add": "Sauvegarder", "close": "Fermer", "could_not_save": "La note n'a pas pu être sauvegardée." },
  "ko": { "new_note": "새 노트", "edit_note": "노트 편집", "content": "내용", "tags": "태그", "manage_tags": "태그 선택", "no_tags_selected": "선택된 태그 없음", "choose_tags": "태그 선택", "done": "완료", "cancel": "취소", "save": "저장", "add": "저장", "close": "닫기", "could_not_save": "노트를 저장할 수 없습니다." },
  "pt": { "new_note": "Nova nota", "edit_note": "Editar nota", "content": "Conteúdo", "tags": "Tags", "manage_tags": "Escolher tags", "no_tags_selected": "Nenhuma tag selecionada", "choose_tags": "Escolher tags", "done": "Concluído", "cancel": "Cancelar", "save": "Salvar", "add": "Salvar", "close": "Fechar", "could_not_save": "A nota não pôde ser salva." },
  "uk": { "new_note": "Нова нотатка", "edit_note": "Редагувати нотатку", "content": "Зміст", "tags": "Теги", "manage_tags": "Вибрати теги", "no_tags_selected": "Теги не вибрані", "choose_tags": "Вибрати теги", "done": "Готово", "cancel": "Скасувати", "save": "Зберегти", "add": "Зберегти", "close": "Закрити", "could_not_save": "Не вдалося зберегти нотатку." }
}
</i18n>
