<template>
  <main>
    <div class="log-page" :style="pageCssVars">
      <header class="page-header">
        <h2 class="mbl-title">
          {{ t('log') }}
        </h2>
        <div class="mbl-button-group mbl-button-group--start">
          <button class="mbl-button mbl-button--primary" type="button" @click="openAddEntryForm">
            {{ t('add_entry') }}
          </button>
        </div>
      </header>

      <div class="log-page__mobile-query-button">
        <button class="mbl-button mbl-button--light mbl-button--sm log-page__query-button" type="button" @click="openQueryManagerModal">
          {{ t('query_manager.open') }}
          <span v-if="hasAppliedViewOptions" class="log-page__query-badge" aria-hidden="true" />
        </button>
        <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" @click="resetViewOptions">
          {{ t('query_manager.reset_button') }}
        </button>
      </div>

      <div class="log-page__layout">
        <aside class="log-page__sidebar">
          <div class="mbl-box log-page__query-manager-box">
            <div class="log-page__query-manager-actions">
              <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" @click="resetViewOptions">
                {{ t('query_manager.reset') }}
              </button>
            </div>
            <log-entries-query-manager
              ref="sidebarQueryManagerRef"
              :applied-query="query"
              @apply="applyQueryManager"
            />
          </div>
        </aside>

        <section class="log-page__content">
          <div>
            <template v-if="loading">
              <skeleton-loader :count="5" />
            </template>
            <template v-else-if="!pagedLogEntries.length">
              <div class="mbl-empty-state">
                <div class="mbl-text-center">
                  {{ t('results.no_results') }}
                </div>
              </div>
            </template>
            <template v-else>
              <div ref="resultsBarRef" class="log-page__results-bar">
                <div class="log-page__results-summary">
                  {{ querySummary }}
                </div>

                <div v-if="pagerTotalPages > 1" class="log-page__results-pager">
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

              <div class="log-page__entries" role="list" data-testid="log-entries">
                <ClientOnly>
                  <div
                    v-for="group of pagedLogEntryGroups"
                    :key="'group-' + group.date"
                    class="log-page__date-group"
                    role="group"
                  >
                    <div class="log-page__date-heading" role="heading" aria-level="3" data-testid="log-date-heading">
                      {{ formatDisplayDate(group.date) }}
                    </div>
                    <log-entry
                      v-for="entry of group.entries"
                      :key="entry.id"
                      role="listitem"
                      :passage="entry"
                      :actions="actionsForLogEntry(entry)"
                    />
                  </div>
                </ClientOnly>
              </div>
            </template>
          </div>
        </section>
      </div>

      <app-modal :open="showQueryManagerModal" :title="t('query_manager.title')" @close="closeQueryManagerModal">
        <template #content>
          <log-entries-query-manager
            :applied-query="query"
            @apply="applyQueryManager"
            @cancel="closeQueryManagerModal"
          />
        </template>
      </app-modal>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Bible, displayDate as sharedDisplayDate } from '@mybiblelog/shared';
import { decodeLogEntriesRouteQuery, encodeLogEntriesQueryToRoute, defaultLogEntriesQuery } from '~/helpers/log-entries-route-query';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import type { LogEntriesQuery } from '~/helpers/log-entries-route-query';
import LogEntry from '~/components/log/LogEntry.vue';
import LogEntriesQueryManager from '~/components/log/LogEntriesQueryManager.vue';
import AppModal from '~/components/popups/AppModal.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useLogEntriesStore } from '~/stores/log-entries';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';

definePageMeta({ middleware: ['auth'] });

const { t, n, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();

useHead({ title: () => t('log') });

const logEntriesStore = useLogEntriesStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();
const logEntryEditorStore = useLogEntryEditorStore();
const userSettingsStore = useUserSettingsStore();

const loading = ref(true);
const showQueryManagerModal = ref(false);
const lastAppliedLogRouteQueryKey = ref<string | null>(null);
const query = ref<LogEntriesQuery>(defaultLogEntriesQuery());
const resultsBarHeightPx = ref(0);
const resultsBarRef = ref<HTMLElement | null>(null);
const sidebarQueryManagerRef = ref<{ confirmAndReset:() => Promise<void> } | null>(null);

let resultsBarObserver: ResizeObserver | null = null;

type LogEntryLike = {
  id: number | string;
  date: string;
  startVerseId: number;
  endVerseId: number;
  [key: string]: unknown;
};

const logEntries = computed(() => logEntriesStore.logEntries as LogEntryLike[]);

const hasAppliedViewOptions = computed(() => {
  const q = query.value || {};
  const hasDateFilters = !!(q.startDate || q.endDate);
  const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
  const hasSortOverride = q.sortDirection && q.sortDirection !== 'descending';
  const hasPageSizeOverride = Number(q.limit || 10) !== 10;
  return hasDateFilters || hasPassageFilter || hasSortOverride || hasPageSizeOverride;
});

const hasAppliedFilters = computed(() => {
  const q = query.value || {};
  return !!(q.startDate || q.endDate || (q.filterPassageStartVerseId && q.filterPassageEndVerseId));
});

function stableCompare(a: string | number, b: string | number): number {
  if (a === b) { return 0; }
  return a < b ? -1 : 1;
}

const filteredSortedLogEntries = computed(() => {
  const q = query.value || {};
  const startDate = `${q.startDate || ''}`.trim();
  const endDate = `${q.endDate || ''}`.trim();
  const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
  const filterRange = hasPassageFilter
    ? { startVerseId: Number(q.filterPassageStartVerseId), endVerseId: Number(q.filterPassageEndVerseId) }
    : null;

  const filtered = (Array.isArray(logEntries.value) ? logEntries.value : []).filter((entry) => {
    if (startDate && entry.date < startDate) { return false; }
    if (endDate && entry.date > endDate) { return false; }
    if (filterRange) {
      const entryRange = { startVerseId: entry.startVerseId, endVerseId: entry.endVerseId };
      if (!Bible.checkRangeOverlap(entryRange, filterRange)) { return false; }
    }
    return true;
  });

  const direction = q.sortDirection === 'ascending' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const cmpDate = stableCompare(a.date, b.date) * direction;
    if (cmpDate !== 0) { return cmpDate; }
    const cmpStart = stableCompare(Number(a.startVerseId), Number(b.startVerseId));
    if (cmpStart !== 0) { return cmpStart; }
    const cmpEnd = stableCompare(Number(a.endVerseId), Number(b.endVerseId));
    if (cmpEnd !== 0) { return cmpEnd; }
    return stableCompare(`${a.id}`, `${b.id}`);
  });
});

const resultsSize = computed(() => filteredSortedLogEntries.value.length);

const pageCssVars = computed(() => ({
  '--logResultsBarHeight': `${Number(resultsBarHeightPx.value || 0)}px`,
}));

const effectiveLimit = computed(() => Math.max(1, Number((query.value && query.value.limit) || 10)));

const pageStartOffsets = computed(() => {
  const entries = filteredSortedLogEntries.value;
  const limit = Math.max(1, Number(effectiveLimit.value || 10));

  if (!entries.length) { return [0]; }

  const dayGroups: Array<{ start: number; count: number }> = [];
  let i = 0;
  while (i < entries.length) {
    const date = entries[i]!.date;
    let j = i + 1;
    while (j < entries.length && entries[j]!.date === date) { j += 1; }
    dayGroups.push({ start: i, count: j - i });
    i = j;
  }

  const starts = [0];
  let g = 0;
  while (g < dayGroups.length) {
    let pageCount = 0;
    while (g < dayGroups.length && pageCount < limit) {
      pageCount += dayGroups[g]!.count;
      g += 1;
    }
    if (g < dayGroups.length) {
      starts.push(dayGroups[g]!.start);
    }
  }

  return starts;
});

const pagerPageIndex = computed(() => {
  const starts = pageStartOffsets.value;
  const requested = Math.max(0, Number((query.value && query.value.offset) || 0));
  let idx = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i]! <= requested) { idx = i; }
    else { break; }
  }
  return Math.max(0, Math.min(idx, starts.length - 1));
});

const pagerTotalPages = computed(() => Math.max(1, pageStartOffsets.value.length));

const effectiveOffset = computed(() => Number(pageStartOffsets.value[pagerPageIndex.value] || 0));

const pagerPage = computed(() => pagerPageIndex.value + 1);

const pagedLogEntries = computed(() => {
  const entries = filteredSortedLogEntries.value;
  const starts = pageStartOffsets.value;
  const start = Number(starts[pagerPageIndex.value] || 0);
  const end = Number(starts[pagerPageIndex.value + 1] ?? entries.length);
  return entries.slice(start, end);
});

const pagedLogEntryGroups = computed(() => {
  const entries = pagedLogEntries.value;
  if (!entries.length) { return []; }

  const groups: Array<{ date: string; entries: LogEntryLike[] }> = [];
  let current: { date: string; entries: LogEntryLike[] } | null = null;
  for (const entry of entries) {
    if (!current || current.date !== entry.date) {
      current = { date: entry.date, entries: [] };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  return groups;
});

const querySummary = computed(() => {
  const total = resultsSize.value;
  const offset = effectiveOffset.value;
  const pageLength = pagedLogEntries.value.length;
  const noun = hasAppliedFilters.value ? 'results' : 'entries';

  if (!total) {
    return t(`query_summary.none.${noun}`);
  }

  if (total <= effectiveLimit.value) {
    return t(`query_summary.showing_all.${noun}`, { n: total, total: n(total, 'grouped') });
  }

  const first = offset + 1;
  const last = offset + pageLength;
  return t(`query_summary.showing_range.${noun}`, {
    n: total,
    first: n(first, 'grouped'),
    last: n(last, 'grouped'),
    total: n(total, 'grouped'),
  });
});

function formatDisplayDate(date: string): string {
  return sharedDisplayDate(date, locale.value);
}

async function loadPageData() {
  try {
    await useAppInitStore().loadUserData();
  }
  finally {
    loading.value = false;
  }
}

function pushLogQuery(nextQuery: Partial<LogEntriesQuery>, { replace = false } = {}) {
  const path = localePath('/log');
  const q = encodeLogEntriesQueryToRoute(nextQuery);
  const nav = { path, query: q };
  return replace ? router.replace(nav) : router.push(nav);
}

function openQueryManagerModal() { showQueryManagerModal.value = true; }
function closeQueryManagerModal() { showQueryManagerModal.value = false; }

function resetViewOptions() {
  if (!hasAppliedViewOptions.value) { return; }
  const mgr = sidebarQueryManagerRef.value;
  if (mgr && typeof mgr.confirmAndReset === 'function') {
    mgr.confirmAndReset();
  }
}

async function applyQueryManager(update: Partial<LogEntriesQuery>) {
  await pushLogQuery({ ...query.value, ...update, offset: 0 });
  if (showQueryManagerModal.value) {
    closeQueryManagerModal();
  }
}

function onPageChanged(newPage: number) {
  const clampedPage = Math.min(Math.max(Number(newPage || 1), 1), pagerTotalPages.value);
  if (clampedPage === pagerPage.value) { return; }
  const starts = pageStartOffsets.value;
  const offset = Number(starts[clampedPage - 1] || 0);
  pushLogQuery({ ...query.value, offset, limit: effectiveLimit.value });
}

function openAddEntryForm() {
  logEntryEditorStore.openEditor({ empty: true });
}

function actionsForLogEntry(entry: LogEntryLike) {
  return [
    { label: t('open_bible'), callback: () => openPassageInBible(entry) },
    { label: t('take_note'), callback: () => takeNoteOnPassage(entry) },
    { label: t('view_notes'), callback: () => viewNotesForPassage(entry) },
    { label: t('edit'), callback: () => openEditEntryForm(entry.id) },
    { label: t('delete'), callback: () => deleteEntry(entry.id) },
  ];
}

function openPassageInBible(passage: LogEntryLike) {
  const start = Bible.parseVerseId(passage.startVerseId);
  const url = userSettingsStore.getReadingUrl(start.book, start.chapter);
  window.open(url, '_blank');
}

function takeNoteOnPassage(passage: LogEntryLike) {
  const { startVerseId, endVerseId } = passage;
  usePassageNoteEditorStore().openEditor({ passages: [{ startVerseId, endVerseId }], content: '' });
}

function viewNotesForPassage(passage: LogEntryLike) {
  const { startVerseId, endVerseId } = passage;
  const q = encodePassageNotesQueryToRoute({
    filterPassageStartVerseId: startVerseId,
    filterPassageEndVerseId: endVerseId,
    offset: 0,
  });
  router.push({ path: localePath('/notes'), query: q as Record<string, string | string[]> });
}

function openEditEntryForm(id: number | string) {
  const targetEntry = logEntries.value.find(e => e.id === id);
  if (!targetEntry) { return; }
  const { date, startVerseId, endVerseId } = targetEntry;
  logEntryEditorStore.openEditor({ id, date, startVerseId, endVerseId });
}

async function deleteEntry(id: number | string) {
  const confirmed = await dialogStore.confirm({
    message: t('messaging.are_you_sure_delete_entry'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await logEntriesStore.deleteLogEntry(id);
  if (!success) {
    toastStore.add({ type: 'error', text: t('messaging.log_entry_could_not_be_deleted') });
  }
}

function detachResultsBarObserver() {
  if (resultsBarObserver) {
    try { resultsBarObserver.disconnect(); }
    catch { /* ignore */ }
  }
  resultsBarObserver = null;
  resultsBarHeightPx.value = 0;
}

function attachResultsBarObserver() {
  if (!import.meta.client) { return; }
  if (typeof ResizeObserver === 'undefined') { return; }

  const el = resultsBarRef.value;
  if (!el) {
    detachResultsBarObserver();
    return;
  }

  detachResultsBarObserver();
  resultsBarObserver = new ResizeObserver((entries) => {
    const entry = entries?.[0];
    const height = entry?.target ? entry.target.getBoundingClientRect().height : 0;
    resultsBarHeightPx.value = Math.max(0, Math.ceil(height || 0));
  });
  resultsBarObserver.observe(el);
  resultsBarHeightPx.value = Math.max(0, Math.ceil(el.getBoundingClientRect().height || 0));
}

watch(() => route.query, async (routeQuery) => {
  const decoded = decodeLogEntriesRouteQuery(routeQuery as Record<string, unknown>);
  const key = JSON.stringify(decoded);
  if (key === lastAppliedLogRouteQueryKey.value) { return; }
  lastAppliedLogRouteQueryKey.value = key;

  query.value = decoded;

  if (!loading.value) { return; }
  await loadPageData();
}, { deep: true, immediate: true });

watch(effectiveOffset, (nextOffset) => {
  if (!query.value) { return; }
  if (Number(query.value.offset || 0) === Number(nextOffset || 0)) { return; }
  pushLogQuery({ ...query.value, offset: nextOffset }, { replace: true });
});

watch(pagerPage, () => {
  if (!import.meta.client) { return; }
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

watch(loading, (nextLoading) => {
  if (nextLoading) { return; }
  nextTick(() => attachResultsBarObserver());
});

onMounted(async () => {
  if (loading.value) {
    await loadPageData();
  }
  nextTick(() => attachResultsBarObserver());
});

onBeforeUnmount(() => {
  detachResultsBarObserver();
});
</script>

<i18n lang="json">
{
  "en": {
    "log": "Reading Log",
    "add_entry": "Add",
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
    "open_bible": "Open Bible",
    "take_note": "Take Note",
    "view_notes": "View Notes",
    "edit": "Edit",
    "delete": "Delete",
    "messaging": {
      "are_you_sure_delete_entry": "Are you sure you want to delete this entry?",
      "log_entry_could_not_be_deleted": "The log entry could not be deleted."
    },
    "query_summary": {
      "none": {
        "entries": "No log entries",
        "results": "No results"
      },
      "showing_all": {
        "entries": "Showing {total} entry | Showing {total} entries",
        "results": "Showing {total} result | Showing {total} results"
      },
      "showing_range": {
        "entries": "Showing {first}–{last} of {total} total entry | Showing {first}–{last} of {total} total entries",
        "results": "Showing {first}–{last} of {total} total result | Showing {first}–{last} of {total} total results"
      }
    }
  },
  "de": {
    "log": "Lesejournal",
    "add_entry": "Hinzufügen",
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
    "open_bible": "Bibel öffnen",
    "take_note": "Notiz hinzufügen",
    "view_notes": "Notizen ansehen",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "messaging": {
      "are_you_sure_delete_entry": "Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?",
      "log_entry_could_not_be_deleted": "Der Eintrag konnte nicht gelöscht werden."
    },
    "query_summary": {
      "none": {
        "entries": "Keine Einträge",
        "results": "Keine Ergebnisse"
      },
      "showing_all": {
        "entries": "{total} Eintrag wird angezeigt | {total} Einträge werden angezeigt",
        "results": "{total} Ergebnis wird angezeigt | {total} Ergebnisse werden angezeigt"
      },
      "showing_range": {
        "entries": "{first}–{last} von {total} Eintrag | {first}–{last} von {total} Einträgen",
        "results": "{first}–{last} von {total} Ergebnis | {first}–{last} von {total} Ergebnissen"
      }
    }
  },
  "es": {
    "log": "Diario de Lectura",
    "add_entry": "Añadir",
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
    "open_bible": "Abrir Biblia",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "edit": "Editar",
    "delete": "Eliminar",
    "messaging": {
      "are_you_sure_delete_entry": "¿Está seguro de que desea eliminar esta entrada?",
      "log_entry_could_not_be_deleted": "La entrada del diario no se pudo eliminar."
    },
    "query_summary": {
      "none": {
        "entries": "Sin entradas",
        "results": "Sin resultados"
      },
      "showing_all": {
        "entries": "Mostrando {total} entrada | Mostrando {total} entradas",
        "results": "Mostrando {total} resultado | Mostrando {total} resultados"
      },
      "showing_range": {
        "entries": "Mostrando {first}–{last} de {total} entrada | Mostrando {first}–{last} de {total} entradas",
        "results": "Mostrando {first}–{last} de {total} resultado | Mostrando {first}–{last} de {total} resultados"
      }
    }
  },
  "fr": {
    "log": "Journal de lecture",
    "add_entry": "Ajouter",
    "pagination": {
      "label": "Pagination",
      "prev": "Précédent",
      "next": "Suivant",
      "page": "Page"
    },
    "query_manager": {
      "open": "Rechercher | Filtrer | Trier",
      "title": "Options d'affichage",
      "reset": "Réinitialiser",
      "reset_button": "Réinitialiser les options d'affichage"
    },
    "results": {
      "loading": "Chargement...",
      "no_results": "Aucun résultat"
    },
    "open_bible": "Ouvrir la Bible",
    "take_note": "Prendre une note",
    "view_notes": "Voir les notes",
    "edit": "Modifier",
    "delete": "Supprimer",
    "messaging": {
      "are_you_sure_delete_entry": "Êtes-vous sûr de vouloir supprimer cette entrée ?",
      "log_entry_could_not_be_deleted": "L'entrée du journal n'a pas pu être supprimée."
    },
    "query_summary": {
      "none": {
        "entries": "Aucune entrée",
        "results": "Aucun résultat"
      },
      "showing_all": {
        "entries": "Affichage de {total} entrée | Affichage de {total} entrées",
        "results": "Affichage de {total} résultat | Affichage de {total} résultats"
      },
      "showing_range": {
        "entries": "{first}–{last} sur {total} entrée | {first}–{last} sur {total} entrées",
        "results": "{first}–{last} sur {total} résultat | {first}–{last} sur {total} résultats"
      }
    }
  },
  "ko": {
    "log": "읽기 일지",
    "add_entry": "추가",
    "pagination": {
      "label": "페이지 이동",
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
      "loading": "불러오는 중...",
      "no_results": "결과 없음"
    },
    "open_bible": "성경 열기",
    "take_note": "노트 작성",
    "view_notes": "노트 보기",
    "edit": "편집",
    "delete": "삭제",
    "messaging": {
      "are_you_sure_delete_entry": "이 항목을 삭제하시겠습니까?",
      "log_entry_could_not_be_deleted": "일지 항목을 삭제할 수 없습니다."
    },
    "query_summary": {
      "none": {
        "entries": "일지 항목 없음",
        "results": "결과 없음"
      },
      "showing_all": {
        "entries": "{total}개 항목 표시",
        "results": "{total}개 결과 표시"
      },
      "showing_range": {
        "entries": "{total}개 중 {first}–{last} 표시",
        "results": "{total}개 중 {first}–{last} 표시"
      }
    }
  },
  "pt": {
    "log": "Diário de Leitura",
    "add_entry": "Adicionar",
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
      "no_results": "Nenhum resultado"
    },
    "open_bible": "Abrir Bíblia",
    "take_note": "Fazer anotação",
    "view_notes": "Ver anotações",
    "edit": "Editar",
    "delete": "Excluir",
    "messaging": {
      "are_you_sure_delete_entry": "Tem certeza de que deseja excluir esta entrada?",
      "log_entry_could_not_be_deleted": "A entrada do diário não pôde ser excluída."
    },
    "query_summary": {
      "none": {
        "entries": "Nenhuma entrada",
        "results": "Nenhum resultado"
      },
      "showing_all": {
        "entries": "Exibindo {total} entrada | Exibindo {total} entradas",
        "results": "Exibindo {total} resultado | Exibindo {total} resultados"
      },
      "showing_range": {
        "entries": "Exibindo {first}–{last} de {total} entrada | Exibindo {first}–{last} de {total} entradas",
        "results": "Exibindo {first}–{last} de {total} resultado | Exibindo {first}–{last} de {total} resultados"
      }
    }
  },
  "uk": {
    "log": "Журнал читання",
    "add_entry": "Додати",
    "pagination": {
      "label": "Сторінки",
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
    "open_bible": "Відкрити Біблію",
    "take_note": "Зробити нотатку",
    "view_notes": "Переглянути нотатки",
    "edit": "Редагувати",
    "delete": "Видалити",
    "messaging": {
      "are_you_sure_delete_entry": "Ви впевнені, що хочете видалити цей запис?",
      "log_entry_could_not_be_deleted": "Запис журналу не вдалося видалити."
    },
    "query_summary": {
      "none": {
        "entries": "Немає записів",
        "results": "Немає результатів"
      },
      "showing_all": {
        "entries": "Показано {total} запис | Показано {total} записи | Показано {total} записів",
        "results": "Показано {total} результат | Показано {total} результати | Показано {total} результатів"
      },
      "showing_range": {
        "entries": "Показано {first}–{last} із {total} запису | Показано {first}–{last} із {total} записів",
        "results": "Показано {first}–{last} із {total} результату | Показано {first}–{last} із {total} результатів"
      }
    }
  }
}
</i18n>

<style scoped>
.log-page {
  max-width: 1100px;
  min-height: 70vh;
  margin: 0 auto;
  padding: 3rem 1rem 5rem;
}

.log-page header.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  align-items: flex-start;
  padding: 0;
}

.log-page__mobile-query-button {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (min-width: 800px) {
  .log-page__mobile-query-button { display: none; }
}

.log-page__query-button {
  position: relative;
  padding-right: 1.25rem;
}

.log-page__query-badge {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--primary-color);
  box-shadow: 0 0 0 2px var(--mbl-bg);
}

.log-page__layout {
  display: flex;
  flex-wrap: wrap;
}

.log-page__layout:last-child { margin-bottom: -0.75rem; }
.log-page__layout:not(:last-child) { margin-bottom: 0.75rem; }

.log-page__layout > * {
  display: block;
  flex: 1 1 0;
}

.log-page__layout > *:first-child {
  flex: none;
  width: 100%;
}

@media (min-width: 769px) {
  .log-page__layout > *:first-child { width: 33.3333%; }
}

.log-page__sidebar { display: none; }

@media (min-width: 800px) {
  .log-page__sidebar {
    display: block;
    position: sticky;
    top: calc(var(--header-height) + 1rem);
    align-self: flex-start;
  }
}

@media (min-width: 800px) {
  .log-page__content { padding-left: 1rem; }
}

.log-page__query-manager-box { padding: 0.85rem 1rem 1rem; }

.log-page__query-manager-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.log-page__query-manager-actions:empty {
  display: none;
  margin-bottom: 0;
}

.log-page__results-bar {
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
  .log-page__results-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
}

.log-page__results-summary {
  font-size: 0.95rem;
  color: var(--mbl-text-85);
  white-space: normal;
  word-break: break-word;
}

.log-page__results-pager {
  display: flex;
  justify-content: flex-start;
}

@media (min-width: 600px) {
  .log-page__results-pager { justify-content: flex-end; }
}

.log-page__date-heading {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem + var(--logResultsBarHeight, 0px) - 2px);
  z-index: 9;
  background: var(--mbl-app-canvas-bg);
  border-bottom: 1px solid var(--mbl-border-soft);
  padding: 0.5rem;
  margin: 0.75rem -0.5rem 0.25rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--mbl-text-90);
}
</style>
