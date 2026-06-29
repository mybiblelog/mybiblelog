<template>
  <div class="content-column">
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

    <header class="page-header">
      <h2 class="mbl-title">
        {{ t('note_tags') }}
      </h2>
      <div class="mbl-button-group mbl-button-group--start">
        <NuxtLink class="mbl-button" to="/notes">
          {{ t('notes') }}
        </NuxtLink>
        <button class="mbl-button mbl-button--primary" :disabled="!hydrated" data-testid="tag-new" @click="openNewTagEditor">
          {{ t('new') }}
        </button>
      </div>
    </header>

    <div class="tag-sort-row">
      <div class="mbl-field mbl-field--addons">
        <div class="mbl-control">
          <span class="mbl-button mbl-button--static">{{ t('sort_by') }}</span>
        </div>
        <div class="mbl-control">
          <div class="mbl-select">
            <select :value="passageNoteTagsStore.sortOrder" data-testid="tag-sort-order" @change="onSortOrderChange">
              <option value="label:ascending">
                {{ t('sort_az') }}
              </option>
              <option value="createdAt:descending">
                {{ t('sort_newest_first') }}
              </option>
              <option value="createdAt:ascending">
                {{ t('sort_oldest_first') }}
              </option>
              <option value="noteCount:descending">
                {{ t('sort_most_notes') }}
              </option>
              <option value="noteCount:ascending">
                {{ t('sort_fewest_notes') }}
              </option>
              <option value="color:hue">
                {{ t('sort_color') }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div
        v-for="tag in passageNoteTagsStore.passageNoteTags"
        :key="tag.id"
        class="tag-line"
        data-testid="tag-line"
      >
        <div>
          <div class="passage-note-tag" data-testid="tag-label" :style="{ backgroundColor: tag.color }">
            {{ tag.label }}
          </div>
          <div v-if="tag.description" class="tag-description">
            {{ tag.description }}
          </div>
        </div>
        <div class="tag-footer">
          <div class="mbl-button-group mbl-button-group--end tag-footer--buttons">
            <button
              class="mbl-button mbl-button--sm"
              data-testid="tag-notes-count"
              :data-note-count="tag.noteCount ?? 0"
              @click="viewTagNotes(tag)"
            >
              {{ t('notes_count', { count: tag.noteCount ?? 0 }) }}
            </button>
            <button class="mbl-button mbl-button--sm" data-testid="tag-edit" @click="openEditTagEditor(tag)">
              {{ t('edit') }}
            </button>
            <button class="mbl-button mbl-button--sm" data-testid="tag-delete" @click="deleteTag(tag.id)">
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="!passageNoteTagsStore.passageNoteTags.length" class="tag-line">
        <div class="mbl-text-center">
          {{ t('no_tags') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';

definePageMeta({ middleware: ['auth'] });
const { t } = useI18n();
useHead({ title: () => t('note_tags') });

const router = useRouter();
const passageNoteTagsStore = usePassageNoteTagsStore();
const tagEditorStore = usePassageNoteTagEditorStore();

const hydrated = ref(false);
const editorError = ref('');

onMounted(() => {
  hydrated.value = true;
  passageNoteTagsStore.loadPassageNoteTags();
});

function onSortOrderChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  passageNoteTagsStore.setPassageNoteTagSortOrder({ sortOrder: value, persist: true });
}

function openNewTagEditor() {
  editorError.value = '';
  tagEditorStore.openEditor(null);
}

function openEditTagEditor(tag: { id: string | number; label?: string; color?: string; description?: string }) {
  editorError.value = '';
  tagEditorStore.openEditor(tag as Parameters<typeof tagEditorStore.openEditor>[0]);
}

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
    editorError.value = String((tagEditorStore.errors as Record<string, unknown>)?._form ?? t('unknown_error'));
  }
}

async function handleEditorClose() {
  await tagEditorStore.closeEditor();
}

function viewTagNotes(tag: { id: string | number }) {
  const query = encodePassageNotesQueryToRoute({ filterTags: [String(tag.id)], offset: 0 });
  router.push({ path: '/notes', query });
}

async function deleteTag(id: string | number) {
  const dialogStore = useDialogStore();
  const toastStore = useToastStore();

  const tag = passageNoteTagsStore.passageNoteTags.find(t => t.id === id);
  if (tag && (tag.noteCount ?? 0) > 0) {
    await dialogStore.alert({ message: t('cannot_delete_tag_in_use') });
    return;
  }

  const confirmed = await dialogStore.confirm({
    message: t('confirm_delete_tag'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }

  const success = await passageNoteTagsStore.deletePassageNoteTag(id);
  if (!success) {
    toastStore.add({ type: 'error', text: t('tag_not_deleted') });
  }
}
</script>

<style scoped>
.tag-sort-row { margin: 0.25rem 0 1rem; }
.tag-line {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  margin: 1rem -0.5rem;
  background: var(--mbl-bg);
  border-radius: 0.25rem;
  box-shadow: var(--mbl-card-shadow);
}
.tag-footer {
  margin-top: 0.25rem;
  display: flex;
  justify-content: flex-end;
}
.passage-note-tag {
  color: var(--mbl-on-accent);
  text-shadow: 0 0 2px var(--mbl-text-stronger);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tag-description {
  white-space: pre-wrap;
  margin: 0.5rem 0;
  padding: 0 0.5rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "note_tags": "Note Tags",
    "notes": "Notes",
    "new": "New",
    "edit": "Edit",
    "delete": "Delete",
    "no_tags": "No Tags",
    "sort_by": "Sort",
    "sort_az": "A-Z",
    "sort_newest_first": "Newest First",
    "sort_oldest_first": "Oldest First",
    "sort_most_notes": "Most Notes",
    "sort_fewest_notes": "Fewest Notes",
    "sort_color": "Color",
    "label": "Label",
    "color": "Color",
    "description": "Description",
    "save": "Save",
    "close": "Close",
    "notes_count": "Notes: {count}",
    "edit_tag": "Edit Tag",
    "add_tag": "Add Tag",
    "confirm_delete_tag": "Are you sure you want to delete this tag?",
    "cannot_delete_tag_in_use": "Cannot delete a tag that is still being used by notes.",
    "tag_not_deleted": "The tag could not be deleted.",
    "unknown_error": "An unknown error occurred."
  },
  "de": { "note_tags": "Notiz-Tags", "notes": "Notizen", "new": "Neu", "edit": "Bearbeiten", "delete": "Löschen", "no_tags": "Keine Tags", "sort_by": "Sortieren", "sort_az": "A-Z", "sort_newest_first": "Neueste zuerst", "sort_oldest_first": "Älteste zuerst", "sort_most_notes": "Meiste Notizen", "sort_fewest_notes": "Wenigste Notizen", "sort_color": "Farbe", "label": "Label", "color": "Farbe", "description": "Beschreibung", "save": "Speichern", "close": "Schließen", "notes_count": "Notizen: {count}", "edit_tag": "Tag bearbeiten", "add_tag": "Tag hinzufügen", "confirm_delete_tag": "Sicher löschen?", "cannot_delete_tag_in_use": "Tag wird noch verwendet.", "tag_not_deleted": "Tag konnte nicht gelöscht werden.", "unknown_error": "Unbekannter Fehler." },
  "es": { "note_tags": "Etiquetas", "notes": "Notas", "new": "Nuevo", "edit": "Editar", "delete": "Eliminar", "no_tags": "Sin etiquetas", "sort_by": "Ordenar", "sort_az": "A-Z", "sort_newest_first": "Más nuevas", "sort_oldest_first": "Más antiguas", "sort_most_notes": "Más notas", "sort_fewest_notes": "Menos notas", "sort_color": "Color", "label": "Etiqueta", "color": "Color", "description": "Descripción", "save": "Guardar", "close": "Cerrar", "notes_count": "Notas: {count}", "edit_tag": "Editar etiqueta", "add_tag": "Nueva etiqueta", "confirm_delete_tag": "¿Eliminar?", "cannot_delete_tag_in_use": "Etiqueta en uso.", "tag_not_deleted": "No se pudo eliminar.", "unknown_error": "Error desconocido." },
  "fr": { "note_tags": "Étiquettes", "notes": "Notes", "new": "Nouveau", "edit": "Éditer", "delete": "Supprimer", "no_tags": "Pas d'étiquettes", "sort_by": "Trier", "sort_az": "A-Z", "sort_newest_first": "Plus récentes", "sort_oldest_first": "Plus anciennes", "sort_most_notes": "Plus de notes", "sort_fewest_notes": "Moins de notes", "sort_color": "Couleur", "label": "Étiquette", "color": "Couleur", "description": "Description", "save": "Enregistrer", "close": "Fermer", "notes_count": "Notes: {count}", "edit_tag": "Éditer", "add_tag": "Ajouter", "confirm_delete_tag": "Confirmer?", "cannot_delete_tag_in_use": "Tag utilisé.", "tag_not_deleted": "Impossible.", "unknown_error": "Erreur inconnue." },
  "ko": { "note_tags": "노트 태그", "notes": "노트", "new": "추가", "edit": "편집", "delete": "삭제", "no_tags": "태그 없음", "sort_by": "정렬", "sort_az": "가나다순", "sort_newest_first": "최신순", "sort_oldest_first": "오래된순", "sort_most_notes": "노트 많은 순", "sort_fewest_notes": "노트 적은 순", "sort_color": "색상", "label": "태그 이름", "color": "색상", "description": "설명", "save": "저장", "close": "닫기", "notes_count": "노트: {count}", "edit_tag": "편집", "add_tag": "추가", "confirm_delete_tag": "삭제?", "cannot_delete_tag_in_use": "사용 중입니다.", "tag_not_deleted": "삭제 불가.", "unknown_error": "오류." },
  "pt": { "note_tags": "Marcadores", "notes": "Notas", "new": "Novo", "edit": "Editar", "delete": "Apagar", "no_tags": "Sem marcadores", "sort_by": "Ordenar", "sort_az": "A-Z", "sort_newest_first": "Mais recentes", "sort_oldest_first": "Mais antigas", "sort_most_notes": "Mais notas", "sort_fewest_notes": "Menos notas", "sort_color": "Cor", "label": "Nome", "color": "Cor", "description": "Descrição", "save": "Salvar", "close": "Fechar", "notes_count": "Notas: {count}", "edit_tag": "Editar", "add_tag": "Adicionar", "confirm_delete_tag": "Confirmar?", "cannot_delete_tag_in_use": "Tag em uso.", "tag_not_deleted": "Não excluído.", "unknown_error": "Erro desconhecido." },
  "uk": { "note_tags": "Теги", "notes": "Нотатки", "new": "Новий", "edit": "Редагувати", "delete": "Видалити", "no_tags": "Немає тегів", "sort_by": "Сортувати", "sort_az": "A-Z", "sort_newest_first": "Найновіші", "sort_oldest_first": "Найстаріші", "sort_most_notes": "Найбільше нотаток", "sort_fewest_notes": "Найменше нотаток", "sort_color": "Колір", "label": "Мітка", "color": "Колір", "description": "Опис", "save": "Зберегти", "close": "Закрити", "notes_count": "Нотатки: {count}", "edit_tag": "Редагувати", "add_tag": "Додати", "confirm_delete_tag": "Видалити?", "cannot_delete_tag_in_use": "Тег використовується.", "tag_not_deleted": "Не видалено.", "unknown_error": "Помилка." }
}
</i18n>
