<template>
  <main>
    <div class="notes-page">
      <header class="page-header">
        <h2 class="mbl-title">
          {{ $t('notes') }}
          <info-link :to="localePath('/about/page-features--notes')" />
        </h2>
        <div class="mbl-button-group mbl-button-group--start">
          <nuxt-link class="mbl-button" :to="localePath('/tags')">
            {{ $t('tags') }}
            <caret-right-icon style="margin-left: 0.2rem;" />
          </nuxt-link>
          <button class="mbl-button mbl-button--primary" @click="openPassageNoteEditor({ empty: true })">
            {{ $t('new') }}
          </button>
        </div>
      </header>
      <div class="notes-page__mobile-query-button">
        <button class="mbl-button mbl-button--light mbl-button--sm notes-page__query-button" type="button" data-testid="notes-mobile-query-open" @click="openQueryManagerModal">
          {{ $t('query_manager.open') }}
          <span v-if="hasAppliedViewOptions" class="notes-page__query-badge" aria-hidden="true" />
        </button>
        <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" data-testid="notes-query-reset" @click="resetViewOptions">
          {{ $t('query_manager.reset_button') }}
        </button>
      </div>

      <div class="notes-page__layout">
        <aside class="notes-page__sidebar">
          <div class="mbl-box notes-page__query-manager-box">
            <div class="notes-page__query-manager-actions">
              <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" data-testid="notes-query-reset-sidebar" @click="resetViewOptions">
                {{ $t('query_manager.reset') }}
              </button>
            </div>
            <passage-notes-query-manager
              ref="sidebarQueryManager"
              :applied-query="query"
              :passage-note-tags="passageNoteTags"
              @apply="applyQueryManager"
            />
          </div>
        </aside>

        <section class="notes-page__content">
          <div>
            <template v-if="loading">
              <div class="passage-note">
                <div class="passage-note--content mbl-text-center">
                  {{ $t('results.loading') }}
                </div>
              </div>
            </template>
            <template v-else-if="!passageNotes.length">
              <div class="mbl-empty-state">
                <div class="mbl-text-center">
                  {{ $t('results.no_results') }}
                </div>
              </div>
            </template>
            <template v-else>
              <div class="notes-page__results-bar">
                <div class="notes-page__results-summary">
                  {{ querySummary }}
                </div>

                <div v-if="pagerTotalPages > 1" class="notes-page__results-pager">
                  <div class="mbl-field mbl-field--addons mbl-field--flush" role="group" :aria-label="$t('pagination.label')">
                    <p class="mbl-control">
                      <button
                        class="mbl-button mbl-button--sm mbl-button--light"
                        type="button"
                        :disabled="pagerPage <= 1"
                        :aria-label="$t('pagination.prev')"
                        @click="onPageChanged(pagerPage - 1)"
                      >
                        <caret-left-icon width="10px" height="18px" fill="currentColor" />
                      </button>
                    </p>

                    <div class="mbl-control">
                      <div class="mbl-select mbl-select--sm">
                        <select
                          :value="pagerPage"
                          :aria-label="$t('pagination.page')"
                          @change="onPageChanged(Number($event.target.value))"
                        >
                          <option v-for="p in pagerTotalPages" :key="p" :value="p">
                            {{ $t('pagination.page') }} {{ p }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <p class="mbl-control">
                      <button
                        class="mbl-button mbl-button--sm mbl-button--light"
                        type="button"
                        :disabled="pagerPage >= pagerTotalPages"
                        :aria-label="$t('pagination.next')"
                        @click="onPageChanged(pagerPage + 1)"
                      >
                        <caret-right-icon width="10px" height="18px" fill="currentColor" />
                      </button>
                    </p>
                  </div>
                </div>
              </div>
              <passage-note
                v-for="note in passageNotes"
                :key="note.id"
                :note="note"
                :actions="actionsForNote(note)"
                :get-reading-url="getReadingUrl"
              />
            </template>
          </div>
        </section>
      </div>

      <app-modal
        :open="showQueryManagerModal"
        :title="$t('query_manager.title')"
        @close="closeQueryManagerModal"
      >
        <template slot="content">
          <passage-notes-query-manager
            :applied-query="query"
            :passage-note-tags="passageNoteTags"
            @apply="applyQueryManager"
            @cancel="closeQueryManagerModal"
          />
        </template>
      </app-modal>
    </div>
  </main>
</template>

<script>
import { Bible } from '@mybiblelog/shared';
import { decodePassageNotesRouteQuery, encodePassageNotesQueryToRoute } from '@/helpers/passage-notes-route-query';
import PassageNote from '@/components/notes/PassageNote';
import PassageNotesQueryManager from '@/components/notes/PassageNotesQueryManager';
import AppModal from '@/components/popups/AppModal';
import InfoLink from '@/components/ui/InfoLink';
import CaretLeftIcon from '@/components/svg/CaretLeftIcon';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { useUserSettingsStore } from '~/stores/user-settings';

export default {
  name: 'NotesListPage',
  components: {
    PassageNote,
    PassageNotesQueryManager,
    AppModal,
    InfoLink,
    CaretLeftIcon,
    CaretRightIcon,
  },
  middleware: ['auth'],
  data() {
    return {
      showQueryManagerModal: false,
      lastAppliedNotesRouteQueryKey: null,
    };
  },
  head() {
    return {
      title: this.$t('notes'),
    };
  },
  computed: {
    passageNotesStore() {
      return usePassageNotesStore();
    },
    passageNoteTagsStore() {
      return usePassageNoteTagsStore();
    },
    passageNoteTags() {
      return this.passageNoteTagsStore.passageNoteTags;
    },
    loading() {
      return this.passageNotesStore.loading;
    },
    query() {
      return this.passageNotesStore.query;
    },
    passageNotes() {
      return this.passageNotesStore.passageNotes;
    },
    pagination() {
      return this.passageNotesStore.pagination;
    },
    pagerPage() {
      return Number((this.pagination && this.pagination.page) || 1);
    },
    pagerTotalPages() {
      return Math.max(1, Number((this.pagination && this.pagination.totalPages) || 1));
    },
    hasAppliedViewOptions() {
      const q = this.query || {};
      const hasSearchText = !!(q.searchText && String(q.searchText).trim().length);
      const hasTagFilters = Array.isArray(q.filterTags) && q.filterTags.length > 0;
      const hasTagMatchingOverride = q.filterTagMatching && q.filterTagMatching !== 'any';
      const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
      const hasSortOverride = (q.sortOn && q.sortOn !== 'createdAt') || (q.sortDirection && q.sortDirection !== 'descending');
      const hasPageSizeOverride = Number(q.limit || 10) !== 10;

      return hasSearchText || hasTagFilters || hasTagMatchingOverride || hasPassageFilter || hasSortOverride || hasPageSizeOverride;
    },
    hasAppliedFilters() {
      const q = this.query || {};
      const hasSearchText = !!(q.searchText && String(q.searchText).trim().length);
      const hasTagFilters = Array.isArray(q.filterTags) && q.filterTags.length > 0;
      const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
      const isOnlyUntagged = (q.filterTagMatching === 'exact') && (!Array.isArray(q.filterTags) || q.filterTags.length === 0);
      return hasSearchText || hasTagFilters || hasPassageFilter || isOnlyUntagged;
    },
    querySummary() {
      const pagination = this.pagination || {};
      const q = this.query || {};

      const total = Number(pagination.size || 0);
      const page = Number(pagination.page || 1);
      const limit = Number(pagination.limit || q.limit || 10);
      const pageLength = Array.isArray(this.passageNotes) ? this.passageNotes.length : 0;

      const noun = this.hasAppliedFilters ? 'results' : 'notes';

      if (!total) {
        return this.$t(`query_summary.none.${noun}`);
      }

      if (total <= limit) {
        return this.$tc(`query_summary.showing_all.${noun}`, total, {
          total: this.$n(total, 'grouped'),
        });
      }

      const first = (page - 1) * limit + 1;
      const last = Math.min(first + Math.max(pageLength, 1) - 1, total);
      return this.$tc(`query_summary.showing_range.${noun}`, total, {
        first: this.$n(first, 'grouped'),
        last: this.$n(last, 'grouped'),
        total: this.$n(total, 'grouped'),
      });
    },
  },
  watch: {
    '$route.query': {
      deep: true,
      immediate: true,
      async handler() {
        const decoded = decodePassageNotesRouteQuery(this.$route.query);
        const key = JSON.stringify(decoded);
        if (key === this.lastAppliedNotesRouteQueryKey) { return; }
        this.lastAppliedNotesRouteQueryKey = key;
        await this.passageNotesStore.resetQuery(decoded);
      },
    },
    pagination() {
      // AFTER new page data loads, causing a pagination update, smooth scroll to top
      // Avoids a jarring page length change from doing this too soon
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
  mounted() {
    this.passageNoteTagsStore.loadPassageNoteTags();
  },
  methods: {
    pushNotesQuery(nextQuery, { replace = false } = {}) {
      const path = this.localePath('/notes');
      const query = encodePassageNotesQueryToRoute(nextQuery);
      const nav = { path, query };
      return replace ? this.$router.replace(nav) : this.$router.push(nav);
    },
    getReadingUrl(bookIndex, chapterIndex) {
      return useUserSettingsStore().getReadingUrl(bookIndex, chapterIndex);
    },
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    actionsForNote(note) {
      return [
        { label: this.$t('note.edit'), callback: () => this.openPassageNoteEditor(note) },
        { label: this.$t('note.delete'), callback: () => this.deletePassageNote(note.id) },
      ];
    },
    openQueryManagerModal() {
      this.showQueryManagerModal = true;
    },
    closeQueryManagerModal() {
      this.showQueryManagerModal = false;
    },
    resetViewOptions() {
      if (!this.hasAppliedViewOptions) { return; }
      this.closeQueryManagerModal();
      this.pushNotesQuery({});
    },
    async applyQueryManager(update) {
      await this.pushNotesQuery({ ...this.query, ...update, offset: 0 });
      if (this.showQueryManagerModal) {
        this.closeQueryManagerModal();
      }
    },
    openPassageNoteEditor(passageNote) {
      // If passageNote has empty: true, open for creating new note
      // Otherwise, open for editing existing note
      const noteToEdit = passageNote.empty ? null : passageNote;
      usePassageNoteEditorStore().openEditor(noteToEdit);
    },
    async deletePassageNote(id) {
      const dialogStore = useDialogStore();
      const toastStore = useToastStore();
      const confirmed = await dialogStore.confirm({
        message: this.$t('messaging.are_you_sure_delete_note'),
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }

      const success = await this.passageNotesStore.deletePassageNote(id);
      if (!success) {
        toastStore.add({
          type: 'error',
          text: this.$t('messaging.note_could_not_be_deleted'),
        });
      }
    },
    onPageChanged(newPage) {
      const clampedPage = Math.min(Math.max(Number(newPage || 1), 1), this.pagerTotalPages);
      if (clampedPage === this.pagerPage) { return; }
      const limit = this.pagination.limit || (this.query && this.query.limit) || 10;
      const offset = (clampedPage - 1) * limit;
      this.pushNotesQuery({ ...this.query, offset, limit });
    },
  },
};
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

  padding: 0; /* match global content-column header behavior */
}

.notes-page__mobile-query-button {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (min-width: 800px) {
  .notes-page__mobile-query-button {
    display: none;
  }
}

.notes-page__query-button {
  position: relative;
  padding-right: 1.25rem; /* room for badge */
}

.notes-page__query-badge {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--primary-color);
  box-shadow: 0 0 0 2px var(--mbl-bg);
}

.notes-page__layout {
  display: flex;
  flex-wrap: wrap;
}

.notes-page__layout:last-child {
  margin-bottom: -0.75rem;
}

.notes-page__layout:not(:last-child) {
  margin-bottom: 0.75rem;
}

.notes-page__layout > * {
  display: block;
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 1;
}

.notes-page__layout > *:first-child {
  flex: none;
  width: 100%;
}

@media (min-width: 769px) {
  .notes-page__layout > *:first-child {
    width: 33.333333%;
  }
}

.notes-page__sidebar {
  display: none;
}

@media (min-width: 800px) {
  .notes-page__sidebar {
    display: block;
    position: sticky;
    top: calc(var(--header-height) + 1rem);
    align-self: flex-start;
  }
}

@media (min-width: 800px) {
  .notes-page__content {
    padding-left: 1rem;
  }
}

.notes-page__query-manager-box {
  padding: 1rem;
}

.notes-page__query-manager-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.notes-page__query-manager-actions:empty {
  display: none;
  margin-bottom: 0;
}

.notes-page__results-bar {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem - 1px);
  z-index: 10;

  background: var(--mbl-app-canvas-bg);
  padding: 0.5rem 1rem;
  margin-left:  -0.5rem;
  margin-right:  -0.5rem;
  border-bottom: 1px solid var(--mbl-border-soft);

  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem; /* tighter row gap on small screens */
}

@media (min-width: 600px) {
  .notes-page__results-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
}

.notes-page__results-summary {
  font-size: 0.95rem;
  color: var(--mbl-text-85);
  white-space: normal;
  word-break: break-word;
}

.notes-page__results-pager {
  display: flex;
  justify-content: flex-start;
}

@media (min-width: 600px) {
  .notes-page__results-pager {
    justify-content: flex-end;
  }
}

</style>

<i18n lang="json">
{
  "en": {
    "notes": "Notes",
    "tags": "Tags",
    "new": "New",
    "pagination": {
      "label": "Pagination",
      "prev": "Prev",
      "next": "Next",
      "page": "Page"
    },
    "query_manager": {
      "open": "Search | Filter | Sort",
      "title": "View Options",
      "reset": "Reset",
      "reset_button": "Reset View Options"
    },
    "results": {
      "loading": "Loading...",
      "no_results": "No Results"
    },
    "note": {
      "edit": "Edit",
      "delete": "Delete"
    },
    "messaging": {
      "are_you_sure_delete_note": "Are you sure you want to delete this note?",
      "note_could_not_be_deleted": "The note could not be deleted."
    },
    "query_summary": {
      "none": {
        "notes": "No notes",
        "results": "No results"
      },
      "showing_all": {
        "notes": "Showing {total} note | Showing {total} notes",
        "results": "Showing {total} result | Showing {total} results"
      },
      "showing_range": {
        "notes": "Showing {first}–{last} of {total} total note | Showing {first}–{last} of {total} total notes",
        "results": "Showing {first}–{last} of {total} total result | Showing {first}–{last} of {total} total results"
      }
    }
  },
  "de": {
    "notes": "Notizen",
    "tags": "Tags",
    "new": "Neu",
    "pagination": {
      "label": "Seitennavigation",
      "prev": "Zurück",
      "next": "Weiter",
      "page": "Seite"
    },
    "query_manager": {
      "open": "Suchen | Filtern | Sortieren",
      "title": "Ansichtsoptionen",
      "reset": "Zurücksetzen",
      "reset_button": "Ansichtsoptionen zurücksetzen"
    },
    "results": {
      "loading": "Laden...",
      "no_results": "Keine Ergebnisse"
    },
    "note": {
      "edit": "Bearbeiten",
      "delete": "Löschen"
    },
    "messaging": {
      "are_you_sure_delete_note": "Möchten Sie diese Notiz wirklich löschen?",
      "note_could_not_be_deleted": "Die Notiz konnte nicht gelöscht werden."
    },
    "query_summary": {
      "none": {
        "notes": "Keine Notizen",
        "results": "Keine Ergebnisse"
      },
      "showing_all": {
        "notes": "Zeige {total} Notiz | Zeige {total} Notizen",
        "results": "Zeige {total} Ergebnis | Zeige {total} Ergebnisse"
      },
      "showing_range": {
        "notes": "Zeige {first}–{last} von {total} gesamten Notiz | Zeige {first}–{last} von {total} gesamten Notizen",
        "results": "Zeige {first}–{last} von {total} gesamten Ergebnis | Zeige {first}–{last} von {total} gesamten Ergebnissen"
      }
    }
  },
  "es": {
    "notes": "Notas",
    "tags": "Etiquetas",
    "new": "Nuevo",
    "pagination": {
      "label": "Paginación",
      "prev": "Anterior",
      "next": "Siguiente",
      "page": "Página"
    },
    "query_manager": {
      "open": "Buscar | Filtrar | Ordenar",
      "title": "Opciones de vista",
      "reset": "Restablecer",
      "reset_button": "Restablecer opciones de vista"
    },
    "results": {
      "loading": "Cargando...",
      "no_results": "Sin resultados"
    },
    "note": {
      "edit": "Editar",
      "delete": "Eliminar"
    },
    "messaging": {
      "are_you_sure_delete_note": "¿Estás seguro de que quieres eliminar esta nota?",
      "note_could_not_be_deleted": "La nota no se pudo eliminar."
    },
    "query_summary": {
      "none": {
        "notes": "No hay notas",
        "results": "Sin resultados"
      },
      "showing_all": {
        "notes": "Mostrando {total} nota | Mostrando {total} notas",
        "results": "Mostrando {total} resultado | Mostrando {total} resultados"
      },
      "showing_range": {
        "notes": "Mostrando {first}–{last} de {total} nota en total | Mostrando {first}–{last} de {total} notas en total",
        "results": "Mostrando {first}–{last} de {total} resultado en total | Mostrando {first}–{last} de {total} resultados en total"
      }
    }
  },
  "fr": {
    "notes": "Notes",
    "tags": "Tags",
    "new": "New",
    "pagination": {
      "label": "Pagination",
      "prev": "Précédent",
      "next": "Suivant",
      "page": "Page"
    },
    "query_manager": {
      "open": "Rechercher | Filtrer | Trier",
      "title": "Options d’affichage",
      "reset": "Réinitialiser",
      "reset_button": "Réinitialiser les options d’affichage"
    },
    "results": {
      "loading": "Chargement...",
      "no_results": "Aucun résultat"
    },
    "note": {
      "edit": "Éditer",
      "delete": "Effacer"
    },
    "messaging": {
      "are_you_sure_delete_note": "Êtes-vous sûr de vouloir supprimer cette note ?",
      "note_could_not_be_deleted": "La note n'a pas pu être supprimée."
    },
    "query_summary": {
      "none": {
        "notes": "Aucune note",
        "results": "Aucun résultat"
      },
      "showing_all": {
        "notes": "{total} note affichée | {total} notes affichées",
        "results": "{total} résultat affiché | {total} résultats affichés"
      },
      "showing_range": {
        "notes": "{first}–{last} sur {total} note au total affichée | {first}–{last} sur {total} notes au total affichées",
        "results": "{first}–{last} sur {total} résultat au total affiché | {first}–{last} sur {total} résultats au total affichés"
      }
    }
  },
  "ko": {
    "notes": "노트",
    "tags": "태그",
    "new": "노트 작성",
    "pagination": {
      "label": "페이지",
      "prev": "이전",
      "next": "다음",
      "page": "페이지"
    },
    "query_manager": {
      "open": "검색 | 필터 | 정렬",
      "title": "보기 옵션",
      "reset": "초기화",
      "reset_button": "보기 옵션 초기화"
    },
    "results": {
      "loading": "불러오는 중…",
      "no_results": "결과 없음"
    },
    "note": {
      "edit": "편집",
      "delete": "삭제"
    },
    "messaging": {
      "are_you_sure_delete_note": "이 노트를 삭제할까요?",
      "note_could_not_be_deleted": "노트를 삭제할 수 없습니다."
    },
    "query_summary": {
      "none": {
        "notes": "노트 없음",
        "results": "결과 없음"
      },
      "showing_all": {
        "notes": "노트 {total}개 표시 | 노트 {total}개 표시",
        "results": "결과 {total}개 표시 | 결과 {total}개 표시"
      },
      "showing_range": {
        "notes": "전체 {total}개 중 {first}–{last} | 전체 {total}개 중 {first}–{last}",
        "results": "전체 {total}개 중 {first}–{last} | 전체 {total}개 중 {first}–{last}"
      }
    }
  },
  "pt": {
    "notes": "Notas",
    "tags": "Tags",
    "new": "Novo",
    "pagination": {
      "label": "Paginação",
      "prev": "Anterior",
      "next": "Próximo",
      "page": "Página"
    },
    "query_manager": {
      "open": "Buscar | Filtrar | Ordenar",
      "title": "Opções de visualização",
      "reset": "Reiniciar",
      "reset_button": "Reiniciar opções de visualização"
    },
    "results": {
      "loading": "Carregando...",
      "no_results": "Sem resultados"
    },
    "note": {
      "edit": "Editar",
      "delete": "Apagar"
    },
    "messaging": {
      "are_you_sure_delete_note": "Tem certeza de que deseja excluir esta nota?",
      "note_could_not_be_deleted": "A nota não pôde ser excluída."
    },
    "query_summary": {
      "none": {
        "notes": "Nenhuma nota",
        "results": "Nenhum resultado"
      },
      "showing_all": {
        "notes": "Mostrando {total} nota | Mostrando {total} notas",
        "results": "Mostrando {total} resultado | Mostrando {total} resultados"
      },
      "showing_range": {
        "notes": "Mostrando {first}–{last} de {total} nota no total | Mostrando {first}–{last} de {total} notas no total",
        "results": "Mostrando {first}–{last} de {total} resultado no total | Mostrando {first}–{last} de {total} resultados no total"
      }
    }
  },
  "uk": {
    "notes": "Нотатки",
    "tags": "Теги",
    "new": "Нове",
    "pagination": {
      "label": "Навігація сторінками",
      "prev": "Попередня",
      "next": "Наступна",
      "page": "Сторінка"
    },
    "query_manager": {
      "open": "Пошук | Фільтр | Сортування",
      "title": "Параметри перегляду",
      "reset": "Скинути",
      "reset_button": "Скинути параметри перегляду"
    },
    "results": {
      "loading": "Завантаження...",
      "no_results": "Немає результатів"
    },
    "note": {
      "edit": "Редагувати",
      "delete": "Видалити"
    },
    "messaging": {
      "are_you_sure_delete_note": "Ви впевнені, що хочете видалити цю нотатку?",
      "note_could_not_be_deleted": "Нотатку не вдалося видалити."
    },
    "query_summary": {
      "none": {
        "notes": "Немає нотаток",
        "results": "Немає результатів"
      },
      "showing_all": {
        "notes": "Показано {total} нотатку | Показано {total} нотатки | Показано {total} нотаток",
        "results": "Показано {total} результат | Показано {total} результати | Показано {total} результатів"
      },
      "showing_range": {
        "notes": "Показано {first}–{last} із {total} нотатки загалом | Показано {first}–{last} із {total} нотаток загалом | Показано {first}–{last} із {total} нотаток загалом",
        "results": "Показано {first}–{last} із {total} результату загалом | Показано {first}–{last} із {total} результатів загалом | Показано {first}–{last} із {total} результатів загалом"
      }
    }
  }
}
</i18n>
