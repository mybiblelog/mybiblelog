<template>
  <div class="notes-page">
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
          <div class="notes-page__results-bar">
            <div class="notes-page__results-summary">
              {{ querySummary }}
            </div>

            <div v-if="pagerTotalPages > 1" class="notes-page__results-pager">
              <div class="mbl-field mbl-field--addons mbl-field--flush" role="group" :aria-label="t('pagination.label')">
                <p class="mbl-control">
                  <button
                    class="mbl-button mbl-button--sm mbl-button--light"
                    type="button"
                    :disabled="pagerPage <= 1"
                    :aria-label="t('pagination.prev')"
                    @click="onPageChanged(pagerPage - 1)"
                  >
                    <caret-left-icon width="10px" height="18px" fill="currentColor" />
                  </button>
                </p>

                <div class="mbl-control">
                  <div class="mbl-select mbl-select--sm">
                    <select
                      :value="pagerPage"
                      :aria-label="t('pagination.page')"
                      @change="onPageChanged(Number(($event.target as HTMLSelectElement).value))"
                    >
                      <option v-for="p in pagerTotalPages" :key="p" :value="p">
                        {{ t('pagination.page') }} {{ p }}
                      </option>
                    </select>
                  </div>
                </div>

                <p class="mbl-control">
                  <button
                    class="mbl-button mbl-button--sm mbl-button--light"
                    type="button"
                    :disabled="pagerPage >= pagerTotalPages"
                    :aria-label="t('pagination.next')"
                    @click="onPageChanged(pagerPage + 1)"
                  >
                    <caret-right-icon width="10px" height="18px" fill="currentColor" />
                  </button>
                </p>
              </div>
            </div>
          </div>

          <passage-note
            v-for="note in passageNotesStore.passageNotes"
            :key="note.id"
            :note="note"
            :actions="actionsForNote(note)"
            :get-reading-url="getReadingUrl"
          />
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
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { decodePassageNotesRouteQuery, encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import type { PassageNoteListItem } from '~/stores/passage-notes';

definePageMeta({ middleware: ['auth'] });
const { t, n } = useI18n();
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

const querySummary = computed(() => {
  const pagination = passageNotesStore.pagination || {};
  const q = passageNotesStore.query || {};

  const total = Number(pagination.size || 0);
  const page = Number(pagination.page || 1);
  const limit = Number(pagination.limit || q.limit || 10);
  const pageLength = passageNotesStore.passageNotes?.length || 0;

  const noun = hasAppliedViewOptions.value ? 'results' : 'notes';

  if (!total) {
    return t(`query_summary.none.${noun}`);
  }

  if (total <= limit) {
    return t(`query_summary.showing_all.${noun}`, { total: n(total, 'grouped') }, total);
  }

  const first = (page - 1) * limit + 1;
  const last = Math.min(first + Math.max(pageLength, 1) - 1, total);
  return t(`query_summary.showing_range.${noun}`, {
    first: n(first, 'grouped'),
    last: n(last, 'grouped'),
    total: n(total, 'grouped'),
  }, total);
});

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

// The note editor itself is a global modal mounted in the default layout; pages
// just drive it through the store.
function openNewNoteEditor() {
  passageNoteEditorStore.openEditor(null);
}

function openEditNoteEditor(note: PassageNoteListItem) {
  passageNoteEditorStore.openEditor(note as Parameters<typeof passageNoteEditorStore.openEditor>[0]);
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
.notes-page__results-bar {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem - 1px);
  z-index: 10;

  background: var(--mbl-app-canvas-bg);
  padding: 0.5rem 1rem;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  border-bottom: 1px solid var(--mbl-border-soft);

  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem;
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
    "loading": "Loading...",
    "no_results": "No Results",
    "edit": "Edit",
    "delete": "Delete",
    "are_you_sure_delete": "Are you sure you want to delete this note?",
    "could_not_delete": "The note could not be deleted.",
    "query_manager": {
      "title": "View Options",
      "open": "Search · Filter · Sort",
      "reset": "Reset",
      "reset_button": "Reset"
    },
    "pagination": {
      "label": "Pagination",
      "prev": "Prev",
      "next": "Next",
      "page": "Page"
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
    "loading": "Laden...",
    "no_results": "Keine Ergebnisse",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "are_you_sure_delete": "Möchten Sie diese Notiz wirklich löschen?",
    "could_not_delete": "Die Notiz konnte nicht gelöscht werden.",
    "query_manager": {
      "title": "Ansichtsoptionen",
      "open": "Suche · Filter · Sortieren",
      "reset": "Zurücksetzen",
      "reset_button": "Zurücksetzen"
    },
    "pagination": {
      "label": "Seitennavigation",
      "prev": "Zurück",
      "next": "Weiter",
      "page": "Seite"
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
    "loading": "Cargando...",
    "no_results": "Sin resultados",
    "edit": "Editar",
    "delete": "Eliminar",
    "are_you_sure_delete": "¿Estás seguro de que quieres eliminar esta nota?",
    "could_not_delete": "La nota no se pudo eliminar.",
    "query_manager": {
      "title": "Opciones de vista",
      "open": "Buscar · Filtrar · Ordenar",
      "reset": "Restablecer",
      "reset_button": "Restablecer"
    },
    "pagination": {
      "label": "Paginación",
      "prev": "Anterior",
      "next": "Siguiente",
      "page": "Página"
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
    "new": "Nouveau",
    "loading": "Chargement...",
    "no_results": "Aucun résultat",
    "edit": "Éditer",
    "delete": "Supprimer",
    "are_you_sure_delete": "Êtes-vous sûr de vouloir supprimer cette note ?",
    "could_not_delete": "La note n'a pas pu être supprimée.",
    "query_manager": {
      "title": "Options d’affichage",
      "open": "Rechercher · Filtrer · Trier",
      "reset": "Réinitialiser",
      "reset_button": "Réinitialiser"
    },
    "pagination": {
      "label": "Pagination",
      "prev": "Précédent",
      "next": "Suivant",
      "page": "Page"
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
    "new": "새 노트",
    "loading": "불러오는 중…",
    "no_results": "결과 없음",
    "edit": "편집",
    "delete": "삭제",
    "are_you_sure_delete": "이 노트를 삭제할까요?",
    "could_not_delete": "노트를 삭제할 수 없습니다.",
    "query_manager": {
      "title": "보기 옵션",
      "open": "검색 · 필터 · 정렬",
      "reset": "초기화",
      "reset_button": "초기화"
    },
    "pagination": {
      "label": "페이지",
      "prev": "이전",
      "next": "다음",
      "page": "페이지"
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
    "loading": "Carregando...",
    "no_results": "Sem resultados",
    "edit": "Editar",
    "delete": "Apagar",
    "are_you_sure_delete": "Tem certeza de que deseja excluir esta nota?",
    "could_not_delete": "A nota não pôde ser excluída.",
    "query_manager": {
      "title": "Opções de visualização",
      "open": "Buscar · Filtrar · Ordenar",
      "reset": "Reiniciar",
      "reset_button": "Reiniciar"
    },
    "pagination": {
      "label": "Paginação",
      "prev": "Anterior",
      "next": "Próximo",
      "page": "Página"
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
    "loading": "Завантаження...",
    "no_results": "Немає результатів",
    "edit": "Редагувати",
    "delete": "Видалити",
    "are_you_sure_delete": "Ви впевнені, що хочете видалити цю нотатку?",
    "could_not_delete": "Не вдалося видалити нотатку.",
    "query_manager": {
      "title": "Параметри перегляду",
      "open": "Пошук · Фільтр · Сортування",
      "reset": "Скинути",
      "reset_button": "Скинути"
    },
    "pagination": {
      "label": "Навігація сторінками",
      "prev": "Попередня",
      "next": "Наступна",
      "page": "Сторінка"
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
