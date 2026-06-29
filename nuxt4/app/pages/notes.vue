<template>
  <div class="notes-page">
    <app-modal
      :open="passageNoteEditorStore.open"
      :title="passageNoteEditorStore.passageNote.id ? t('edit_note') : t('new_note')"
      @close="handleEditorClose"
    >
      <template #content>
        <form data-testid="note-editor" @submit.prevent="handleEditorSave">
          <div v-if="editorFormError" class="mbl-help mbl-help--danger">
            {{ editorFormError }}
          </div>
          <div class="mbl-field">
            <label class="mbl-label">{{ t('content_label') }}</label>
            <div class="mbl-control">
              <textarea
                class="mbl-textarea"
                data-testid="note-editor-content"
                :value="passageNoteEditorStore.passageNote.content"
                maxlength="3000"
                rows="6"
                @input="onEditorContentInput"
              />
            </div>
          </div>
          <div class="mbl-field">
            <label class="mbl-label">{{ t('tags_label') }}</label>
            <div class="note-editor-tags">
              <span
                v-for="tag in editorSelectedTags"
                :key="tag.id"
                class="note-editor-tag-pill"
                :style="{ backgroundColor: tag.color }"
              >{{ tag.label }}</span>
            </div>
            <button class="mbl-button mbl-button--sm" type="button" @click.prevent="openTagPickerModal">
              {{ t('manage_tags') }}
            </button>
          </div>
        </form>
      </template>
      <template #footer>
        <button
          class="mbl-button mbl-button--primary"
          data-testid="note-editor-submit"
          :disabled="!passageNoteEditorStore.passageNote.content.trim() || passageNoteEditorStore.submitting"
          @click="handleEditorSave"
        >
          {{ passageNoteEditorStore.passageNote.id ? t('save') : t('save') }}
        </button>
        <button class="mbl-button mbl-button--light" @click="handleEditorClose">
          {{ t('close') }}
        </button>
      </template>
    </app-modal>

    <app-modal :open="tagPickerOpen" :title="t('choose_tags')" @close="closeTagPickerModal">
      <template #content>
        <div class="tag-picker">
          <div
            v-for="tag in passageNoteTagsStore.passageNoteTags"
            :key="tag.id"
            class="tag-picker-item"
            :class="{ selected: editorDraftTags.includes(String(tag.id)) }"
            @click="toggleEditorTag(String(tag.id))"
          >
            <span class="tag-pill" :style="{ backgroundColor: tag.color }">{{ tag.label }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="mbl-button mbl-button--primary" @click="applyTagPickerModal">
          {{ t('done') }}
        </button>
        <button class="mbl-button mbl-button--light" @click="closeTagPickerModal">
          {{ t('cancel') }}
        </button>
      </template>
    </app-modal>

    <header class="page-header">
      <h2 class="mbl-title">
        {{ t('notes') }}
      </h2>
      <div class="mbl-button-group mbl-button-group--start">
        <NuxtLink class="mbl-button" to="/tags">
          {{ t('tags') }}
        </NuxtLink>
        <button class="mbl-button mbl-button--primary" :disabled="!hydrated" @click="openNewNoteEditor">
          {{ t('new') }}
        </button>
      </div>
    </header>

    <div class="notes-page__mobile-query-button">
      <button class="mbl-button mbl-button--light mbl-button--sm notes-page__query-button" type="button" data-testid="notes-mobile-query-open" @click="openQueryManagerModal">
        {{ t('query_manager.open') }}
        <span v-if="hasAppliedViewOptions" class="notes-page__query-badge" aria-hidden="true" />
      </button>
      <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" data-testid="notes-query-reset" @click="resetViewOptions">
        {{ t('query_manager.reset_button') }}
      </button>
    </div>

    <div class="notes-page__layout">
      <aside class="notes-page__sidebar">
        <div class="mbl-box notes-page__query-manager-box">
          <div v-if="hasAppliedViewOptions" class="notes-page__query-manager-actions">
            <button class="mbl-button mbl-button--light mbl-button--sm" type="button" data-testid="notes-query-reset-sidebar" @click="resetViewOptions">
              {{ t('query_manager.reset') }}
            </button>
          </div>
          <passage-notes-query-manager
            :applied-query="passageNotesStore.query"
            :passage-note-tags="passageNoteTagsStore.passageNoteTags"
            @apply="applyQueryManager"
          />
        </div>
      </aside>

      <section class="notes-page__content">
        <template v-if="passageNotesStore.loading">
          <div class="passage-note">
            <div class="mbl-text-center">
              {{ t('loading') }}
            </div>
          </div>
        </template>
        <template v-else-if="!passageNotesStore.passageNotes.length">
          <div class="mbl-empty-state">
            <div class="mbl-text-center">
              {{ t('no_results') }}
            </div>
          </div>
        </template>
        <template v-else>
          <div v-if="pagerTotalPages > 1" class="notes-page__results-pager">
            <button
              class="mbl-button mbl-button--sm mbl-button--light"
              type="button"
              :disabled="pagerPage <= 1"
              @click="onPageChanged(pagerPage - 1)"
            >
              {{ t('prev') }}
            </button>
            <span class="notes-page__page-info">{{ t('page') }} {{ pagerPage }} / {{ pagerTotalPages }}</span>
            <button
              class="mbl-button mbl-button--sm mbl-button--light"
              type="button"
              :disabled="pagerPage >= pagerTotalPages"
              @click="onPageChanged(pagerPage + 1)"
            >
              {{ t('next') }}
            </button>
          </div>

          <passage-note
            v-for="note in passageNotesStore.passageNotes"
            :key="note.id"
            :note="note"
            :actions="actionsForNote(note)"
            :get-reading-url="getReadingUrl"
          />

          <div v-if="pagerTotalPages > 1" class="notes-page__results-pager">
            <button
              class="mbl-button mbl-button--sm mbl-button--light"
              type="button"
              :disabled="pagerPage <= 1"
              @click="onPageChanged(pagerPage - 1)"
            >
              {{ t('prev') }}
            </button>
            <span class="notes-page__page-info">{{ t('page') }} {{ pagerPage }} / {{ pagerTotalPages }}</span>
            <button
              class="mbl-button mbl-button--sm mbl-button--light"
              type="button"
              :disabled="pagerPage >= pagerTotalPages"
              @click="onPageChanged(pagerPage + 1)"
            >
              {{ t('next') }}
            </button>
          </div>
        </template>
      </section>
    </div>

    <app-modal :open="showQueryManagerModal" :title="t('query_manager.title')" @close="closeQueryManagerModal">
      <template #content>
        <passage-notes-query-manager
          :applied-query="passageNotesStore.query"
          :passage-note-tags="passageNoteTagsStore.passageNoteTags"
          @apply="applyQueryManager"
          @cancel="closeQueryManagerModal"
        />
      </template>
    </app-modal>
  </div>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import PassageNote from '~/components/notes/PassageNote.vue';
import PassageNotesQueryManager from '~/components/notes/PassageNotesQueryManager.vue';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { decodePassageNotesRouteQuery, encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import type { PassageNoteListItem } from '~/stores/passage-notes';

definePageMeta({ middleware: ['auth'] });
const { t } = useI18n();
useHead({ title: () => t('notes') });

const hydrated = ref(false);
onMounted(() => { hydrated.value = true; });

const route = useRoute();
const router = useRouter();

const passageNotesStore = usePassageNotesStore();
const passageNoteTagsStore = usePassageNoteTagsStore();
const passageNoteEditorStore = usePassageNoteEditorStore();

const pagerPage = computed(() => Number(passageNotesStore.pagination?.page || 1));
const pagerTotalPages = computed(() => Math.max(1, Number(passageNotesStore.pagination?.totalPages || 1)));

const showQueryManagerModal = ref(false);

const hasAppliedViewOptions = computed(() => {
  const q = passageNotesStore.query || {};
  const hasSearchText = Boolean(q.searchText && String(q.searchText).trim().length);
  const hasTagFilters = Array.isArray(q.filterTags) && q.filterTags.length > 0;
  const hasTagMatchingOverride = Boolean(q.filterTagMatching && q.filterTagMatching !== 'any');
  const hasPassageFilter = Boolean(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
  const hasSortOverride = (q.sortOn && q.sortOn !== 'createdAt') || (q.sortDirection && q.sortDirection !== 'descending');
  const hasPageSizeOverride = Number(q.limit || 10) !== 10;
  return hasSearchText || hasTagFilters || hasTagMatchingOverride || hasPassageFilter || hasSortOverride || hasPageSizeOverride;
});

function openQueryManagerModal() {
  showQueryManagerModal.value = true;
}

function closeQueryManagerModal() {
  showQueryManagerModal.value = false;
}

async function resetViewOptions() {
  closeQueryManagerModal();
  await router.push({ path: '/notes', query: {} });
}

function getReadingUrl(bookIndex: number, chapterIndex: number) {
  return useUserSettingsStore().getReadingUrl(bookIndex, chapterIndex);
}

function actionsForNote(note: PassageNoteListItem) {
  return [
    { label: t('edit'), callback: () => openEditNoteEditor(note) },
    { label: t('delete'), callback: () => deleteNote(note.id as string | number) },
  ];
}

// Note editor inline state
const editorFormError = ref('');
const tagPickerOpen = ref(false);
const editorDraftTags = ref<string[]>([]);

const editorSelectedTags = computed(() => {
  const tagIds = passageNoteEditorStore.passageNote.tags ?? [];
  const allTags = passageNoteTagsStore.passageNoteTags ?? [];
  return tagIds
    .map(id => allTags.find(t => String(t.id) === String(id)))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map(t => ({ id: t.id as string | number, label: t.label ?? '', color: t.color ?? 'var(--mbl-text-strong)' }));
});

function openNewNoteEditor() {
  editorFormError.value = '';
  passageNoteEditorStore.openEditor(null);
}

function openEditNoteEditor(note: PassageNoteListItem) {
  editorFormError.value = '';
  passageNoteEditorStore.openEditor(note as Parameters<typeof passageNoteEditorStore.openEditor>[0]);
}

function onEditorContentInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  passageNoteEditorStore.updatePassageNote({ ...passageNoteEditorStore.passageNote, content: target.value });
}

function openTagPickerModal() {
  editorDraftTags.value = (passageNoteEditorStore.passageNote.tags ?? []).map(String);
  tagPickerOpen.value = true;
}

function closeTagPickerModal() {
  tagPickerOpen.value = false;
}

function toggleEditorTag(id: string) {
  const idx = editorDraftTags.value.indexOf(id);
  if (idx >= 0) {
    editorDraftTags.value = editorDraftTags.value.filter(t => t !== id);
  }
  else {
    editorDraftTags.value = [...editorDraftTags.value, id];
  }
}

function applyTagPickerModal() {
  passageNoteEditorStore.updatePassageNote({ ...passageNoteEditorStore.passageNote, tags: editorDraftTags.value });
  closeTagPickerModal();
}

async function handleEditorSave() {
  editorFormError.value = '';
  const result = await passageNoteEditorStore.savePassageNote();
  if (!result) {
    editorFormError.value = String((passageNoteEditorStore.errors as Record<string, unknown>)?._form ?? t('could_not_save_note'));
  }
}

async function handleEditorClose() {
  await passageNoteEditorStore.closeEditor();
}

async function deleteNote(id: string | number) {
  const confirmed = await useDialogStore().confirm({
    message: t('are_you_sure_delete'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await passageNotesStore.deletePassageNote(id);
  if (!success) {
    useToastStore().add({ type: 'error', text: t('could_not_delete') });
  }
}

function pushNotesQuery(nextQuery: Record<string, unknown>, { replace = false } = {}) {
  const query = encodePassageNotesQueryToRoute(nextQuery as Parameters<typeof encodePassageNotesQueryToRoute>[0]);
  const nav = { path: '/notes', query };
  return replace ? router.replace(nav) : router.push(nav);
}

async function applyQueryManager(update: Record<string, unknown>) {
  closeQueryManagerModal();
  await pushNotesQuery({ ...passageNotesStore.query, ...update, offset: 0 });
}

function onPageChanged(newPage: number) {
  const clampedPage = Math.min(Math.max(Number(newPage || 1), 1), pagerTotalPages.value);
  if (clampedPage === pagerPage.value) { return; }
  const limit = passageNotesStore.pagination?.limit || passageNotesStore.query?.limit || 10;
  const offset = (clampedPage - 1) * limit;
  pushNotesQuery({ ...passageNotesStore.query, offset, limit });
}

const lastAppliedKey = ref<string | null>(null);

watch(() => route.query, async (routeQuery) => {
  const decoded = decodePassageNotesRouteQuery(routeQuery as Record<string, unknown>);
  const key = JSON.stringify(decoded);
  if (key === lastAppliedKey.value) { return; }
  lastAppliedKey.value = key;
  await passageNotesStore.resetQuery(decoded);
}, { deep: true, immediate: true });

onMounted(() => {
  passageNoteTagsStore.loadPassageNoteTags();
});
</script>

<style scoped>
.notes-page {
  max-width: 1100px;
  min-height: 70vh;
  margin: 0 auto;
  padding: 3rem 1rem 5rem;
}
.notes-page header.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  align-items: flex-start;
  padding: 0;
}
.notes-page__layout { display: flex; flex-wrap: wrap; gap: 1rem; }
.notes-page__mobile-query-button {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.notes-page__query-button { position: relative; }
.notes-page__query-badge {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-left: 0.35rem;
  border-radius: 999px;
  background: var(--mbl-success-bright);
  vertical-align: middle;
}
.notes-page__query-manager-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}
@media (min-width: 800px) {
  .notes-page__mobile-query-button { display: none; }
}
.notes-page__sidebar {
  display: none;
  width: 280px;
  flex-shrink: 0;
}
@media (min-width: 800px) {
  .notes-page__sidebar {
    display: block;
    position: sticky;
    top: calc(var(--header-height) + 1rem);
    align-self: flex-start;
  }
}
.notes-page__content { flex: 1; min-width: 0; }
.notes-page__query-manager-box { padding: 1rem; }
.notes-page__results-pager {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}
.notes-page__page-info { font-size: 0.9rem; color: var(--mbl-text-muted); }
.note-editor-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; min-height: 1.5rem; }
.note-editor-tag-pill { font-size: 0.8em; color: var(--mbl-on-accent); padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
.tag-picker { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; }
.tag-picker-item { cursor: pointer; }
.tag-pill {
  display: inline-block;
  font-size: 0.85em;
  color: var(--mbl-on-accent);
  text-shadow: 0 0 2px var(--mbl-text-stronger);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 2px solid transparent;
}
.tag-picker-item.selected .tag-pill { border-color: var(--mbl-text-stronger); }
</style>

<i18n lang="json">
{
  "en": {
    "notes": "Notes",
    "tags": "Tags",
    "new": "New",
    "loading": "Loading...",
    "no_results": "No Results",
    "edit": "Edit",
    "delete": "Delete",
    "prev": "Prev",
    "next": "Next",
    "page": "Page",
    "are_you_sure_delete": "Are you sure you want to delete this note?",
    "could_not_delete": "The note could not be deleted.",
    "new_note": "New Note",
    "edit_note": "Edit Note",
    "content_label": "Content",
    "tags_label": "Tags",
    "manage_tags": "Choose Tags",
    "choose_tags": "Choose Tags",
    "done": "Done",
    "cancel": "Cancel",
    "save": "Save",
    "close": "Close",
    "could_not_save_note": "The note could not be saved.",
    "query_manager": { "title": "View Options", "open": "Search · Filter · Sort", "reset": "Reset", "reset_button": "Reset" }
  },
  "de": { "notes": "Notizen", "tags": "Tags", "new": "Neu", "loading": "Laden...", "no_results": "Keine Ergebnisse", "edit": "Bearbeiten", "delete": "Löschen", "prev": "Zurück", "next": "Weiter", "page": "Seite", "are_you_sure_delete": "Möchten Sie diese Notiz wirklich löschen?", "could_not_delete": "Die Notiz konnte nicht gelöscht werden.", "query_manager": { "title": "Ansichtsoptionen", "open": "Suche · Filter · Sortieren", "reset": "Zurücksetzen", "reset_button": "Zurücksetzen" } },
  "es": { "notes": "Notas", "tags": "Etiquetas", "new": "Nuevo", "loading": "Cargando...", "no_results": "Sin resultados", "edit": "Editar", "delete": "Eliminar", "prev": "Anterior", "next": "Siguiente", "page": "Página", "are_you_sure_delete": "¿Estás seguro de que quieres eliminar esta nota?", "could_not_delete": "La nota no se pudo eliminar.", "query_manager": { "title": "Opciones de vista", "open": "Buscar · Filtrar · Ordenar", "reset": "Restablecer", "reset_button": "Restablecer" } },
  "fr": { "notes": "Notes", "tags": "Tags", "new": "Nouveau", "loading": "Chargement...", "no_results": "Aucun résultat", "edit": "Éditer", "delete": "Supprimer", "prev": "Précédent", "next": "Suivant", "page": "Page", "are_you_sure_delete": "Êtes-vous sûr de vouloir supprimer cette note ?", "could_not_delete": "La note n'a pas pu être supprimée.", "query_manager": { "title": "Options d’affichage", "open": "Rechercher · Filtrer · Trier", "reset": "Réinitialiser", "reset_button": "Réinitialiser" } },
  "ko": { "notes": "노트", "tags": "태그", "new": "새 노트", "loading": "불러오는 중…", "no_results": "결과 없음", "edit": "편집", "delete": "삭제", "prev": "이전", "next": "다음", "page": "페이지", "are_you_sure_delete": "이 노트를 삭제할까요?", "could_not_delete": "노트를 삭제할 수 없습니다.", "query_manager": { "title": "보기 옵션", "open": "검색 · 필터 · 정렬", "reset": "초기화", "reset_button": "초기화" } },
  "pt": { "notes": "Notas", "tags": "Tags", "new": "Novo", "loading": "Carregando...", "no_results": "Sem resultados", "edit": "Editar", "delete": "Apagar", "prev": "Anterior", "next": "Próximo", "page": "Página", "are_you_sure_delete": "Tem certeza de que deseja excluir esta nota?", "could_not_delete": "A nota não pôde ser excluída.", "query_manager": { "title": "Opções de visualização", "open": "Buscar · Filtrar · Ordenar", "reset": "Reiniciar", "reset_button": "Reiniciar" } },
  "uk": { "notes": "Нотатки", "tags": "Теги", "new": "Нове", "loading": "Завантаження...", "no_results": "Немає результатів", "edit": "Редагувати", "delete": "Видалити", "prev": "Попередня", "next": "Наступна", "page": "Сторінка", "are_you_sure_delete": "Ви впевнені, що хочете видалити цю нотатку?", "could_not_delete": "Не вдалося видалити нотатку.", "query_manager": { "title": "Параметри перегляду", "open": "Пошук · Фільтр · Сортування", "reset": "Скинути", "reset_button": "Скинути" } }
}
</i18n>
