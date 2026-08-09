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
    <testament-toggle v-model="testamentFilter" />
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
        <span v-if="anyBooksHaveNotes" class="progress-card-note-count-badge">
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
import type { LogEntry, TestamentFilter } from '@mybiblelog/shared';
import { usePassageNotesStore } from '~/stores/passage-notes';
import SegmentBar from '~/components/bible/SegmentBar.vue';
import TestamentToggle from '~/components/bible/TestamentToggle.vue';
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

const testamentFilter = ref<TestamentFilter>('all');

function navigateToBook(bookIndex: number) {
  emit('view-book-report', bookIndex);
  router.push(localePath('/books/' + bookIndex));
}
const bookNotesCounts = computed(() => passageNotesStore.bookNoteCounts);
const anyBooksHaveNotes = computed(() => passageNotesStore.anyBooksHaveNotes);

const visibleBookIndices = computed(() => {
  return Bible.getBooks()
    .filter((book) => {
      if (testamentFilter.value === 'old') { return !Bible.isNewTestament(book.bibleOrder); }
      if (testamentFilter.value === 'new') { return Bible.isNewTestament(book.bibleOrder); }
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

onMounted(() => {
  passageNotesStore.loadBookNoteCounts();
});
</script>

<style>
.bible-report {
  user-select: none;
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
  border-radius: var(--mbl-radius-lg);
  box-shadow: var(--mbl-shadow-card);
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
  box-shadow: var(--mbl-shadow-card-raised);
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
    "note": "Note | Notes"
  },
  "de": {
    "bible_books": "Bücher der Bibel",
    "progress": "Fortschritt",
    "note": "Notiz | Notizen"
  },
  "es": {
    "bible_books": "Libros de la Biblia",
    "progress": "Progreso",
    "note": "Nota | Notas"
  },
  "fr": {
    "bible_books": "Livres de la Bible",
    "progress": "Progrès",
    "note": "Note | Notes"
  },
  "ko": {
    "bible_books": "성경 일람",
    "progress": "진도",
    "note": "노트 | 노트"
  },
  "pt": {
    "bible_books": "Livros da Bíblia",
    "progress": "Progresso",
    "note": "Nota | Notas"
  },
  "uk": {
    "bible_books": "Книги Біблії",
    "progress": "Прогрес",
    "note": "Примітка | Примітки"
  }
}
</i18n>
