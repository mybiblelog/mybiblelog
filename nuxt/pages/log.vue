<template>
  <main>
    <div class="log-page" :style="pageCssVars">
      <header class="page-header">
        <h2 class="mbl-title">
          {{ $t('log') }}
        </h2>
        <div class="mbl-button-group mbl-button-group--start">
          <button class="mbl-button mbl-button--primary" type="button" @click="openAddEntryForm">
            {{ $t('add_entry') }}
          </button>
        </div>
      </header>

      <div class="log-page__mobile-query-button">
        <button class="mbl-button mbl-button--light mbl-button--sm log-page__query-button" type="button" @click="openQueryManagerModal">
          {{ $t('query_manager.open') }}
          <span v-if="hasAppliedViewOptions" class="log-page__query-badge" aria-hidden="true" />
        </button>
        <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" @click="resetViewOptions">
          {{ $t('query_manager.reset_button') }}
        </button>
      </div>

      <div class="log-page__layout">
        <aside class="log-page__sidebar">
          <div class="mbl-box log-page__query-manager-box">
            <div class="log-page__query-manager-actions">
              <button v-if="hasAppliedViewOptions" class="mbl-button mbl-button--light mbl-button--sm" type="button" @click="resetViewOptions">
                {{ $t('query_manager.reset') }}
              </button>
            </div>
            <log-entries-query-manager
              ref="sidebarQueryManager"
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
                  {{ $t('results.no_results') }}
                </div>
              </div>
            </template>
            <template v-else>
              <div ref="resultsBar" class="log-page__results-bar">
                <div class="log-page__results-summary">
                  {{ querySummary }}
                </div>

                <div v-if="pagerTotalPages > 1" class="log-page__results-pager">
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

              <div class="log-page__entries" role="list" data-testid="log-entries">
                <client-only>
                  <div
                    v-for="group of pagedLogEntryGroups"
                    :key="'group-' + group.date"
                    class="log-page__date-group"
                    role="group"
                  >
                    <div class="log-page__date-heading" role="heading" aria-level="3" data-testid="log-date-heading">
                      {{ displayDate(group.date) }}
                    </div>
                    <log-entry
                      v-for="entry of group.entries"
                      :key="entry.id"
                      role="listitem"
                      :passage="entry"
                      :actions="actionsForLogEntry(entry)"
                    />
                  </div>
                </client-only>
              </div>
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

<script>
import { Bible, displayDate } from '@mybiblelog/shared';
import { decodeLogEntriesRouteQuery, encodeLogEntriesQueryToRoute, defaultLogEntriesQuery } from '@/helpers/log-entries-route-query';
import { encodePassageNotesQueryToRoute } from '@/helpers/passage-notes-route-query';
import LogEntry from '@/components/log/LogEntry';
import LogEntriesQueryManager from '@/components/log/LogEntriesQueryManager';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AppModal from '@/components/popups/AppModal';
import CaretLeftIcon from '@/components/svg/CaretLeftIcon';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useLogEntriesStore } from '~/stores/log-entries';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';

function stableCompare(a, b) {
  if (a === b) { return 0; }
  return a < b ? -1 : 1;
}

export default {
  name: 'LogListPage',
  components: {
    LogEntry,
    LogEntriesQueryManager,
    SkeletonLoader,
    AppModal,
    CaretLeftIcon,
    CaretRightIcon,
  },
  middleware: ['auth'],
  data() {
    return {
      loading: true,
      showQueryManagerModal: false,
      lastAppliedLogRouteQueryKey: null,
      query: defaultLogEntriesQuery(),
      resultsBarHeightPx: 0,
      resultsBarEl: null,
      resultsBarObserver: null,
    };
  },
  head() {
    return {
      title: this.$t('log'),
    };
  },
  computed: {
    logEntriesStore() {
      return useLogEntriesStore();
    },
    logEntries() {
      return this.logEntriesStore.logEntries;
    },
    hasAppliedViewOptions() {
      const q = this.query || {};
      const hasDateFilters = !!(q.startDate || q.endDate);
      const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
      const hasSortOverride = q.sortDirection && q.sortDirection !== 'descending';
      const hasPageSizeOverride = Number(q.limit || 10) !== 10;
      return hasDateFilters || hasPassageFilter || hasSortOverride || hasPageSizeOverride;
    },
    hasAppliedFilters() {
      const q = this.query || {};
      const hasDateFilters = !!(q.startDate || q.endDate);
      const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
      return hasDateFilters || hasPassageFilter;
    },
    filteredSortedLogEntries() {
      const q = this.query || {};
      const startDate = `${q.startDate || ''}`.trim();
      const endDate = `${q.endDate || ''}`.trim();
      const hasPassageFilter = !!(q.filterPassageStartVerseId && q.filterPassageEndVerseId);
      const filterRange = hasPassageFilter
        ? { startVerseId: Number(q.filterPassageStartVerseId), endVerseId: Number(q.filterPassageEndVerseId) }
        : null;

      const filtered = (Array.isArray(this.logEntries) ? this.logEntries : []).filter((entry) => {
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
    },
    resultsSize() {
      return Array.isArray(this.filteredSortedLogEntries) ? this.filteredSortedLogEntries.length : 0;
    },
    pageCssVars() {
      return {
        '--logResultsBarHeight': `${Number(this.resultsBarHeightPx || 0)}px`,
      };
    },
    effectiveLimit() {
      return Math.max(1, Number((this.query && this.query.limit) || 10));
    },
    pageStartOffsets() {
      const entries = Array.isArray(this.filteredSortedLogEntries) ? this.filteredSortedLogEntries : [];
      const limit = Math.max(1, Number(this.effectiveLimit || 10));

      if (!entries.length) { return [0]; }

      // Contiguous same-date runs (sort order is already by date).
      const dayGroups = [];
      let i = 0;
      while (i < entries.length) {
        const date = entries[i].date;
        let j = i + 1;
        while (j < entries.length && entries[j].date === date) { j += 1; }
        dayGroups.push({ start: i, count: j - i });
        i = j;
      }

      // Pack whole days per page: each page (except the last) has at least `limit`
      // entries. A single day never spans two pages.
      const starts = [0];
      let g = 0;
      while (g < dayGroups.length) {
        let pageCount = 0;
        while (g < dayGroups.length && pageCount < limit) {
          pageCount += dayGroups[g].count;
          g += 1;
        }
        if (g < dayGroups.length) {
          starts.push(dayGroups[g].start);
        }
      }

      return starts;
    },
    pagerPageIndex() {
      const starts = Array.isArray(this.pageStartOffsets) ? this.pageStartOffsets : [0];
      const requested = Math.max(0, Number((this.query && this.query.offset) || 0));

      let idx = 0;
      for (let i = 0; i < starts.length; i += 1) {
        if (starts[i] <= requested) { idx = i; }
        else { break; }
      }
      return Math.max(0, Math.min(idx, starts.length - 1));
    },
    pagerTotalPages() {
      const starts = Array.isArray(this.pageStartOffsets) ? this.pageStartOffsets : [0];
      return Math.max(1, starts.length);
    },
    effectiveOffset() {
      const starts = Array.isArray(this.pageStartOffsets) ? this.pageStartOffsets : [0];
      return Number(starts[this.pagerPageIndex] || 0);
    },
    pagerPage() {
      return Number(this.pagerPageIndex) + 1;
    },
    pagedLogEntries() {
      const entries = Array.isArray(this.filteredSortedLogEntries) ? this.filteredSortedLogEntries : [];
      const starts = Array.isArray(this.pageStartOffsets) ? this.pageStartOffsets : [0];
      const start = Number(starts[this.pagerPageIndex] || 0);
      const end = Number(starts[this.pagerPageIndex + 1] ?? entries.length);
      return entries.slice(start, end);
    },
    pagedLogEntryGroups() {
      const entries = Array.isArray(this.pagedLogEntries) ? this.pagedLogEntries : [];
      if (!entries.length) { return []; }

      const groups = [];
      let current = null;
      for (const entry of entries) {
        const date = entry.date;
        if (!current || current.date !== date) {
          current = { date, entries: [] };
          groups.push(current);
        }
        current.entries.push(entry);
      }
      return groups;
    },
    querySummary() {
      const total = Number(this.resultsSize || 0);
      const offset = Number(this.effectiveOffset || 0);
      const limit = Number(this.effectiveLimit || 10);
      const pageLength = Array.isArray(this.pagedLogEntries) ? this.pagedLogEntries.length : 0;

      const noun = this.hasAppliedFilters ? 'results' : 'entries';

      if (!total) {
        return this.$t(`query_summary.none.${noun}`);
      }

      if (total <= limit) {
        return this.$tc(`query_summary.showing_all.${noun}`, total, {
          total: this.$n(total, 'grouped'),
        });
      }

      const first = offset + 1;
      const last = offset + pageLength;
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
        const decoded = decodeLogEntriesRouteQuery(this.$route.query);
        const key = JSON.stringify(decoded);
        if (key === this.lastAppliedLogRouteQueryKey) { return; }
        this.lastAppliedLogRouteQueryKey = key;

        this.query = decoded;

        if (!this.loading) { return; }
        await this.loadPageData();
      },
    },
    effectiveOffset(nextOffset) {
      if (!this.query) { return; }
      if (Number(this.query.offset || 0) === Number(nextOffset || 0)) { return; }
      this.pushLogQuery({ ...this.query, offset: nextOffset }, { replace: true });
    },
    pagerPage() {
      if (!process.client) { return; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    loading(nextLoading) {
      if (nextLoading) { return; }
      this.$nextTick(() => this.attachResultsBarObserver());
    },
  },
  async mounted() {
    if (this.loading) {
      await this.loadPageData();
    }
    this.$nextTick(() => this.attachResultsBarObserver());
  },
  beforeDestroy() {
    this.detachResultsBarObserver();
  },
  methods: {
    detachResultsBarObserver() {
      if (this.resultsBarObserver) {
        try { this.resultsBarObserver.disconnect(); }
        catch { /* ignore */ }
      }
      this.resultsBarObserver = null;
      this.resultsBarEl = null;
      this.resultsBarHeightPx = 0;
    },
    attachResultsBarObserver() {
      if (!process.client) { return; }
      if (typeof ResizeObserver === 'undefined') { return; }

      const el = this.$refs.resultsBar;
      if (!el) {
        this.detachResultsBarObserver();
        return;
      }

      if (this.resultsBarObserver && this.resultsBarEl === el) { return; }

      this.detachResultsBarObserver();
      this.resultsBarEl = el;

      this.resultsBarObserver = new ResizeObserver((entries) => {
        const entry = entries && entries[0];
        const target = entry && entry.target ? entry.target : null;
        const height = target ? target.getBoundingClientRect().height : 0;
        this.resultsBarHeightPx = Math.max(0, Math.ceil(height || 0));
      });

      this.resultsBarObserver.observe(el);
      this.resultsBarHeightPx = Math.max(0, Math.ceil(el.getBoundingClientRect().height || 0));
    },
    displayDate(date) {
      return displayDate(date, this.$i18n.locale);
    },
    async loadPageData() {
      try {
        await useAppInitStore().loadUserData();
      }
      finally {
        this.loading = false;
      }
    },
    pushLogQuery(nextQuery, { replace = false } = {}) {
      const path = this.localePath('/log');
      const query = encodeLogEntriesQueryToRoute(nextQuery);
      const nav = { path, query };
      return replace ? this.$router.replace(nav) : this.$router.push(nav);
    },
    openQueryManagerModal() {
      this.showQueryManagerModal = true;
    },
    closeQueryManagerModal() {
      this.showQueryManagerModal = false;
    },
    resetViewOptions() {
      if (!this.hasAppliedViewOptions) { return; }
      const mgr = this.$refs.sidebarQueryManager;
      if (!mgr || typeof mgr.confirmAndReset !== 'function') { return; }
      mgr.confirmAndReset();
    },
    async applyQueryManager(update) {
      await this.pushLogQuery({ ...this.query, ...update, offset: 0 });
      if (this.showQueryManagerModal) {
        this.closeQueryManagerModal();
      }
    },
    onPageChanged(newPage) {
      const clampedPage = Math.min(Math.max(Number(newPage || 1), 1), this.pagerTotalPages);
      if (clampedPage === this.pagerPage) { return; }
      const starts = Array.isArray(this.pageStartOffsets) ? this.pageStartOffsets : [0];
      const offset = Number(starts[clampedPage - 1] || 0);
      this.pushLogQuery({ ...this.query, offset, limit: this.effectiveLimit });
    },
    openAddEntryForm() {
      const logEntryEditorStore = useLogEntryEditorStore();
      logEntryEditorStore.openEditor({ empty: true });
    },
    actionsForLogEntry(entry) {
      return [
        { label: this.$t('open_bible'), callback: () => this.openPassageInBible(entry) },
        { label: this.$t('take_note'), callback: () => this.takeNoteOnPassage(entry) },
        { label: this.$t('view_notes'), callback: () => this.viewNotesForPassage(entry) },
        { label: this.$t('edit'), callback: () => this.openEditEntryForm(entry.id) },
        { label: this.$t('delete'), callback: () => this.deleteEntry(entry.id) },
      ];
    },
    getReadingUrl(bookIndex, chapterIndex) {
      return useUserSettingsStore().getReadingUrl(bookIndex, chapterIndex);
    },
    openPassageInBible(passage) {
      const start = Bible.parseVerseId(passage.startVerseId);
      const url = this.getReadingUrl(start.book, start.chapter);
      window.open(url, '_blank');
    },
    takeNoteOnPassage(passage) {
      const { startVerseId, endVerseId } = passage;
      usePassageNoteEditorStore().openEditor({
        passages: [{ startVerseId, endVerseId }],
        content: '',
      });
    },
    viewNotesForPassage(passage) {
      const { startVerseId, endVerseId } = passage;
      const query = encodePassageNotesQueryToRoute({
        filterPassageStartVerseId: startVerseId,
        filterPassageEndVerseId: endVerseId,
        offset: 0,
      });
      this.$router.push({ path: this.localePath('/notes'), query });
    },
    openEditEntryForm(id) {
      const logEntryEditorStore = useLogEntryEditorStore();
      const targetEntry = (this.logEntries || []).find(e => e.id === id);
      if (!targetEntry) { return; }
      const { date, startVerseId, endVerseId } = targetEntry;
      logEntryEditorStore.openEditor({
        id,
        date,
        startVerseId,
        endVerseId,
      });
    },
    async deleteEntry(id) {
      const dialogStore = useDialogStore();
      const toastStore = useToastStore();
      const confirmed = await dialogStore.confirm({
        message: this.$t('messaging.are_you_sure_delete_entry'),
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }
      const success = await this.logEntriesStore.deleteLogEntry(id);
      if (!success) {
        toastStore.add({
          type: 'error',
          text: this.$t('messaging.log_entry_could_not_be_deleted'),
        });
      }
    },
  },
};
</script>

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

  padding: 0; /* match global content-column header behavior */
}

.log-page__mobile-query-button {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (min-width: 800px) {
  .log-page__mobile-query-button {
    display: none;
  }
}

.log-page__query-button {
  position: relative;
  padding-right: 1.25rem; /* room for badge */
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

.log-page__layout:last-child {
  margin-bottom: -0.75rem;
}

.log-page__layout:not(:last-child) {
  margin-bottom: 0.75rem;
}

.log-page__layout > * {
  display: block;
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 1;
}

.log-page__layout > *:first-child {
  flex: none;
  width: 100%;
}

@media (min-width: 769px) {
  .log-page__layout > *:first-child {
    width: 33.333333%;
  }
}

.log-page__sidebar {
  display: none;
}

@media (min-width: 800px) {
  .log-page__sidebar {
    display: block;
    position: sticky;
    top: calc(var(--header-height) + 1rem);
    align-self: flex-start;
  }
}

@media (min-width: 800px) {
  .log-page__content {
    padding-left: 1rem;
  }
}

.log-page__query-manager-box {
  padding: 0.85rem 1rem 1rem;
}

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
  gap: 0.25rem; /* tighter row gap on small screens */
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
  .log-page__results-pager {
    justify-content: flex-end;
  }
}

.log-page__date-heading {
  position: sticky;
  top: calc(var(--header-height) + 0.5rem + var(--logResultsBarHeight, 0px) - 2px);
  z-index: 9;

  background: var(--mbl-app-canvas-bg);
  border-bottom: 1px solid var(--mbl-border-soft);

  padding: 0.5rem 0.5rem;
  margin: 0.75rem -0.5rem 0.25rem;

  font-size: 0.9rem;
  font-weight: 700;
  color: var(--mbl-text-90);
}
</style>

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
        "entries": "Zeige {total} Eintrag | Zeige {total} Einträge",
        "results": "Zeige {total} Ergebnis | Zeige {total} Ergebnisse"
      },
      "showing_range": {
        "entries": "Zeige {first}–{last} von {total} gesamten Eintrag | Zeige {first}–{last} von {total} gesamten Einträgen",
        "results": "Zeige {first}–{last} von {total} gesamten Ergebnis | Zeige {first}–{last} von {total} gesamten Ergebnissen"
      }
    }
  },
  "es": {
    "log": "Registro de lectura",
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
      "reset_button": "Restablecer opciones"
    },
    "results": {
      "loading": "Cargando...",
      "no_results": "Sin resultados"
    },
    "open_bible": "Abrir en la Biblia",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "edit": "Editar",
    "delete": "Borrar",
    "messaging": {
      "are_you_sure_delete_entry": "¿Estás seguro de que quieres borrar esta entrada?",
      "log_entry_could_not_be_deleted": "No se pudo borrar la entrada."
    },
    "query_summary": {
      "none": {
        "entries": "Sin registros",
        "results": "Sin resultados"
      },
      "showing_all": {
        "entries": "Mostrando {total} registro | Mostrando {total} registros",
        "results": "Mostrando {total} resultado | Mostrando {total} resultados"
      },
      "showing_range": {
        "entries": "Mostrando {first}–{last} de {total} registro total | Mostrando {first}–{last} de {total} registros totales",
        "results": "Mostrando {first}–{last} de {total} resultado total | Mostrando {first}–{last} de {total} resultados totales"
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
      "title": "Options d’affichage",
      "reset": "Réinitialiser",
      "reset_button": "Réinitialiser les options"
    },
    "results": {
      "loading": "Chargement...",
      "no_results": "Aucun résultat"
    },
    "open_bible": "Ouvrir dans la Bible",
    "take_note": "Prendre note",
    "view_notes": "Voir les notes",
    "edit": "Modifier",
    "delete": "Supprimer",
    "messaging": {
      "are_you_sure_delete_entry": "Êtes-vous sûr de vouloir supprimer cette entrée?",
      "log_entry_could_not_be_deleted": "L’entrée n’a pas pu être supprimée."
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
        "entries": "Affichage de {first}–{last} sur {total} entrée au total | Affichage de {first}–{last} sur {total} entrées au total",
        "results": "Affichage de {first}–{last} sur {total} résultat au total | Affichage de {first}–{last} sur {total} résultats au total"
      }
    }
  },
  "ko": {
    "log": "읽기 기록",
    "add_entry": "추가",
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
    "open_bible": "성경 열기",
    "take_note": "노트 작성",
    "view_notes": "노트 보기",
    "edit": "편집",
    "delete": "삭제",
    "messaging": {
      "are_you_sure_delete_entry": "해당 기록을 삭제할까요?",
      "log_entry_could_not_be_deleted": "해당 기록을 삭제할 수 없습니다."
    },
    "query_summary": {
      "none": {
        "entries": "읽기 기록 없음",
        "results": "결과 없음"
      },
      "showing_all": {
        "entries": "항목 {total}개 표시 | 항목 {total}개 표시",
        "results": "결과 {total}개 표시 | 결과 {total}개 표시"
      },
      "showing_range": {
        "entries": "전체 {total}개 중 {first}–{last} | 전체 {total}개 중 {first}–{last}",
        "results": "전체 {total}개 중 {first}–{last} | 전체 {total}개 중 {first}–{last}"
      }
    }
  },
  "pt": {
    "log": "Registro de leitura",
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
      "reset_button": "Reiniciar opções"
    },
    "results": {
      "loading": "Carregando...",
      "no_results": "Sem resultados"
    },
    "open_bible": "Ler na Biblia",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "edit": "Editar",
    "delete": "Apagar",
    "messaging": {
      "are_you_sure_delete_entry": "Tem certeza de que deseja apagar este registro?",
      "log_entry_could_not_be_deleted": "Não foi possível apagar este registro."
    },
    "query_summary": {
      "none": {
        "entries": "Nenhum registro",
        "results": "Sem resultados"
      },
      "showing_all": {
        "entries": "Mostrando {total} registro | Mostrando {total} registros",
        "results": "Mostrando {total} resultado | Mostrando {total} resultados"
      },
      "showing_range": {
        "entries": "Mostrando {first}–{last} de {total} registro total | Mostrando {first}–{last} de {total} registros totais",
        "results": "Mostrando {first}–{last} de {total} resultado total | Mostrando {first}–{last} de {total} resultados totais"
      }
    }
  },
  "uk": {
    "log": "Журнал читання",
    "add_entry": "Додати",
    "pagination": {
      "label": "Пагінація",
      "prev": "Назад",
      "next": "Далі",
      "page": "Сторінка"
    },
    "query_manager": {
      "open": "Пошук | Фільтр | Сортування",
      "title": "Параметри перегляду",
      "reset": "Скинути",
      "reset_button": "Скинути параметри"
    },
    "results": {
      "loading": "Завантаження...",
      "no_results": "Немає результатів"
    },
    "open_bible": "Читати в Біблії",
    "take_note": "Записати",
    "view_notes": "Переглянути нотатки",
    "edit": "Редагувати",
    "delete": "Видалити",
    "messaging": {
      "are_you_sure_delete_entry": "Ви впевнені, що хочете видалити цей запис?",
      "log_entry_could_not_be_deleted": "Не вдалося видалити запис."
    },
    "query_summary": {
      "none": {
        "entries": "Немає записів",
        "results": "Немає результатів"
      },
      "showing_all": {
        "entries": "Показано {total} запис | Показано {total} записів",
        "results": "Показано {total} результат | Показано {total} результатів"
      },
      "showing_range": {
        "entries": "Показано {first}–{last} з {total} запису | Показано {first}–{last} з {total} записів",
        "results": "Показано {first}–{last} з {total} результату | Показано {first}–{last} з {total} результатів"
      }
    }
  }
}
</i18n>
