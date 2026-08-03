<template>
  <div class="bible-report">
    <header class="page-header">
      <h2 class="mbl-title">
        {{ t('bible_books') }}
      </h2>
      <NuxtLink class="mbl-button" :to="localePath('/progress')">
        {{ t('progress') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </NuxtLink>
    </header>
    <div class="testament-toggle">
      <div class="testament-toggle--track" :data-active="testamentFilter">
        <span class="testament-toggle--thumb" aria-hidden="true" />
        <button
          type="button"
          class="testament-toggle--button"
          :class="{ active: testamentFilter === 'all' }"
          :disabled="!hydrated"
          data-testid="testament-toggle-all"
          @click="setTestamentFilter('all')"
        >
          {{ t('whole_bible') }}
        </button>
        <button
          type="button"
          class="testament-toggle--button"
          :class="{ active: testamentFilter === 'old' }"
          :disabled="!hydrated"
          data-testid="testament-toggle-old"
          @click="setTestamentFilter('old')"
        >
          {{ t('old_testament_short') }}
        </button>
        <button
          type="button"
          class="testament-toggle--button"
          :class="{ active: testamentFilter === 'new' }"
          :disabled="!hydrated"
          data-testid="testament-toggle-new"
          @click="setTestamentFilter('new')"
        >
          {{ t('new_testament_short') }}
        </button>
      </div>
    </div>
    <div class="plaque" data-testid="bible-report-progress" :data-percentage="percentageRead">
      <p><span>{{ n(percentageRead / 100, 'percent') }}</span></p>
      <segment-bar :thick="true" :segments="bibleReadingSegments" />
    </div>
    <div class="progress-list">
      <button
        v-for="report in allBookReports"
        :key="report.bookIndex"
        type="button"
        class="progress-card"
        :disabled="!hydrated"
        data-testid="bible-report-book"
        :data-book-index="report.bookIndex"
        :data-percentage="report.percentage"
        @click="navigateToBook(report.bookIndex)"
      >
        <span class="progress-card-icon">
          <star-icon :fill="report.percentage === 100 ? 'var(--mbl-star-earned)' : 'var(--mbl-star-unearned)'" />
        </span>
        <span class="progress-card-book">{{ report.bookName }}</span>
        <span v-if="anyBooksHaveNotes" class="progress-card-note-count-badge" @click.stop="viewBookNotes(report.bookIndex)">
          {{ report.notesCount }} {{ t('note', report.notesCount) }}
        </span>
        <span class="progress-card-percentage">{{ n(report.percentage / 100, 'percent') }}</span>
        <div class="progress-card-progress">
          <segment-bar :segments="bookReadingSegments(report.bookIndex)" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bible, withSegmentPercentages } from '@mybiblelog/shared';
import type { LogEntry } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import { usePassageNotesStore } from '~/stores/passage-notes';
import SegmentBar from '~/components/bible/SegmentBar.vue';
import StarIcon from '~/components/svg/StarIcon.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';

const props = withDefaults(defineProps<{
  logEntries?: Array<LogEntry>;
}>(), {
  logEntries: () => [],
});

const emit = defineEmits<{ 'view-book-report': [bookIndex: number] }>();

const { t, n, locale } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

const passageNotesStore = usePassageNotesStore();

const hydrated = ref(false);
onMounted(() => { hydrated.value = true; });

const testamentFilter = ref<'all' | 'old' | 'new'>('all');

function setTestamentFilter(filter: 'all' | 'old' | 'new') {
  testamentFilter.value = filter;
}

function navigateToBook(bookIndex: number) {
  emit('view-book-report', bookIndex);
  router.push(localePath('/books/' + bookIndex));
}
const bookNotesCounts = computed(() => passageNotesStore.bookNoteCounts);
const anyBooksHaveNotes = computed(() => passageNotesStore.anyBooksHaveNotes);

const visibleBookIndices = computed(() => {
  return Bible.getBooks()
    .filter((book) => {
      if (testamentFilter.value === 'old') { return !book.newTestament; }
      if (testamentFilter.value === 'new') { return book.newTestament; }
      return true;
    })
    .map(book => book.bibleOrder);
});

const totalVisibleVerses = computed(() =>
  visibleBookIndices.value.reduce((sum, bookIndex) => sum + Bible.getBookVerseCount(bookIndex), 0),
);

const totalVersesRead = computed(() =>
  visibleBookIndices.value.reduce((sum, bookIndex) => sum + Bible.countUniqueBookRangeVerses(bookIndex, props.logEntries), 0),
);

const percentageRead = computed(() =>
  Math.floor(totalVersesRead.value / totalVisibleVerses.value * 100),
);

const allBookReports = computed(() =>
  visibleBookIndices.value.map(bookIndex => bookReport(bookIndex)),
);

const bibleReadingSegments = computed(() => {
  const segments = [];
  for (const bookIndex of visibleBookIndices.value) {
    segments.push(...Bible.generateBookSegments(bookIndex, props.logEntries));
  }
  return withSegmentPercentages(segments, totalVisibleVerses.value);
});

function bookReport(bookIndex: number) {
  const bookName = Bible.getBookName(bookIndex, locale.value);
  const totalVerses = Bible.getBookVerseCount(bookIndex);
  const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, props.logEntries);
  const percentage = Math.floor(versesRead / totalVerses * 100);
  const notesCount = bookNotesCounts.value[bookIndex] || 0;
  return { bookIndex, bookName, totalVerses, versesRead, percentage, notesCount };
}

function bookReadingSegments(bookIndex: number) {
  const totalBookVerses = Bible.getBookVerseCount(bookIndex);
  const segments = Bible.generateBookSegments(bookIndex, props.logEntries);
  return withSegmentPercentages(segments, totalBookVerses);
}

function viewBookNotes(bookIndex: number) {
  const bookStartVerseId = Bible.getFirstBookVerseId(bookIndex);
  const bookEndVerseId = Bible.getLastBookVerseId(bookIndex);
  const query = encodePassageNotesQueryToRoute({
    filterPassageStartVerseId: bookStartVerseId,
    filterPassageEndVerseId: bookEndVerseId,
    filterPassageMatching: 'exclusive',
    offset: 0,
  });
  router.push({ path: localePath('/notes'), query });
}

onMounted(() => {
  passageNotesStore.loadBookNoteCounts();
});
</script>

<style>
.bible-report {
  user-select: none;
}

.bible-report .testament-toggle {
  display: flex;
  justify-content: center;
}

.bible-report .testament-toggle--track {
  position: relative;
  display: flex;
  padding: var(--mbl-space-2xs);
  border: 1px solid var(--mbl-border-strong);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-bg-muted);
}

/* Sliding indicator: one third of the track's inner width, moved a full slot per position. */
.bible-report .testament-toggle--thumb {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  width: calc((100% - 0.5rem) / 3);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-link-bright);
  box-shadow: var(--mbl-shadow-soft);
  pointer-events: none;
  transition: transform 0.2s ease;
}

.bible-report .testament-toggle--track[data-active="old"] .testament-toggle--thumb {
  transform: translateX(100%);
}

.bible-report .testament-toggle--track[data-active="new"] .testament-toggle--thumb {
  transform: translateX(200%);
}

.bible-report .testament-toggle--button {
  position: relative;
  flex: 1 1 0;
  min-width: 5rem;
  padding: var(--mbl-space-xs) var(--mbl-space-md);
  border: none;
  border-radius: var(--mbl-radius-pill);
  background: none;
  color: var(--mbl-text-subtle);
  cursor: pointer;
  transition: color 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
}

.bible-report .testament-toggle--button:hover {
  color: var(--mbl-text);
}

.bible-report .testament-toggle--button.active {
  color: var(--mbl-on-accent);
}

@media (prefers-reduced-motion: reduce) {
  .bible-report .testament-toggle--thumb {
    transition: none;
  }
}

.plaque {
  margin-bottom: var(--mbl-space-2xl);
}

.plaque p {
  text-align: right;
}

.progress-list .progress-card {
  width: 100%;
  border: none;
  margin: var(--mbl-space-xs) 0;
  padding: var(--mbl-space-xs);
  background: var(--mbl-bg-elevated);
  border-radius: var(--mbl-radius-sm);
  box-shadow: var(--mbl-shadow-elev-1);
  display: grid;
  grid-template:
    "icon title notes percentage" auto
    "icon bar   bar   bar" auto
    / auto auto 1fr 3rem;
  cursor: pointer;
  transition: 0.1s;
}

.progress-list .progress-card:hover {
  transition: 0.2s;
  box-shadow: var(--mbl-shadow-elev-2);
}

.progress-list .progress-card-icon {
  grid-area: icon;
  margin-right: var(--mbl-space-xs);
  display: flex;
  align-items: center;
}

.progress-list .progress-card-book,
.progress-list .progress-card-percentage {
  font-size: 0.8rem;
  font-weight: bold;
  padding-bottom: var(--mbl-space-xs);
}

.progress-list .progress-card-book { grid-area: title; }

.progress-list .progress-card-note-count-badge {
  grid-area: notes;
  place-self: baseline end;
  width: fit-content;
  margin-right: var(--mbl-space-md);
  font-size: 0.8em;
  color: var(--mbl-text-subtle);
  background: var(--mbl-bg-hover-strong);
  margin-left: 1em;
  padding: 0 0.5em;
  border-radius: var(--mbl-radius-pill);
  font-weight: normal;
  transition: 0.2s ease-in-out;
}

.progress-list .progress-card-note-count-badge:hover {
  background: var(--mbl-bg-disabled);
  color: var(--mbl-on-accent);
}

.progress-list .progress-card-percentage {
  grid-area: percentage;
  text-align: right;
}

.progress-list .progress-card-progress { grid-area: bar; }
</style>

<i18n lang="json">
{
  "en": {
    "bible_books": "Bible Books",
    "progress": "Progress",
    "note": "Note | Notes",
    "whole_bible": "Bible",
    "old_testament_short": "OT",
    "new_testament_short": "NT"
  },
  "de": {
    "bible_books": "Bücher der Bibel",
    "progress": "Fortschritt",
    "note": "Notiz | Notizen",
    "whole_bible": "Bibel",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "es": {
    "bible_books": "Libros de la Biblia",
    "progress": "Progreso",
    "note": "Nota | Notas",
    "whole_bible": "Biblia",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "fr": {
    "bible_books": "Livres de la Bible",
    "progress": "Progrès",
    "note": "Note | Notes",
    "whole_bible": "Bible",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "ko": {
    "bible_books": "성경 일람",
    "progress": "진도",
    "note": "노트 | 노트",
    "whole_bible": "성경",
    "old_testament_short": "구약",
    "new_testament_short": "신약"
  },
  "pt": {
    "bible_books": "Livros da Bíblia",
    "progress": "Progresso",
    "note": "Nota | Notas",
    "whole_bible": "Bíblia",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "uk": {
    "bible_books": "Книги Біблії",
    "progress": "Прогрес",
    "note": "Примітка | Примітки",
    "whole_bible": "Біблія",
    "old_testament_short": "СТ",
    "new_testament_short": "НЗ"
  }
}
</i18n>
