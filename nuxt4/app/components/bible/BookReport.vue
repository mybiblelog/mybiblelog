<template>
  <div class="book-report">
    <header class="book-report-header mbl-hidden-mobile">
      <button class="mbl-button mbl-button--sm book-report-header__back" @click="emit('exit-book-report')">
        <CaretLeftIcon />
      </button>
      <h2 class="mbl-title book-report-header__title"><span>{{ bookName }}</span></h2>
      <button class="mbl-button mbl-button--sm book-report-header__notes" @click="emit('view-book-notes')">
        {{ t('book_notes') }}
        <CaretRightIcon style="margin-left: 0.2rem;" />
      </button>
      <button class="mbl-button mbl-button--sm book-report-header__reading" @click="emit('view-book-log')">
        {{ t('book_reading') }}
        <CaretRightIcon style="margin-left: 0.2rem;" />
      </button>
    </header>
    <header class="book-report-header mbl-hidden-tablet">
      <button class="mbl-button mbl-button--sm book-report-header__back" @click="emit('exit-book-report')">
        <CaretLeftIcon />
      </button>
      <h2 class="mbl-title mbl-title--5 book-report-header__title"><span>{{ bookName }}</span></h2>
      <button class="mbl-button mbl-button--sm book-report-header__notes" @click="emit('view-book-notes')">
        {{ t('book_notes') }}
        <CaretRightIcon style="margin-left: 0.2rem;" />
      </button>
      <button class="mbl-button mbl-button--sm book-report-header__reading" @click="emit('view-book-log')">
        {{ t('book_reading') }}
        <CaretRightIcon style="margin-left: 0.2rem;" />
      </button>
    </header>
    <div class="plaque" data-testid="book-report-progress" :data-percentage="percentageRead">
      <p><span>{{ n(percentageRead / 100, 'percent') }}</span></p>
      <SegmentBar :thick="true" :segments="bookReadingSegments(bookIndex)" />
    </div>
    <div class="chapter-report-grid">
      <ChapterReport
        v-for="report in allChapterReports"
        :key="report.chapterIndex"
        :report="report"
        @create-log-entry="openAddEntryForm"
        @take-note-on-chapter="takeNoteOnChapter"
        @view-notes-for-chapter="viewNotesForChapter"
        @view-reading-log-for-chapter="viewReadingLogForChapter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import { encodeLogEntriesQueryToRoute } from '~/helpers/log-entries-route-query';
import ChapterReport from '~/components/bible/ChapterReport.vue';
import SegmentBar from '~/components/bible/SegmentBar.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';

const props = withDefaults(defineProps<{
  logEntries?: Array<Record<string, unknown>>;
  bookIndex?: number;
}>(), {
  logEntries: () => [],
  bookIndex: 1,
});

const emit = defineEmits<{
  'exit-book-report': [];
  'view-book-notes': [];
  'view-book-log': [];
}>();

const { t, n, locale } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

const bookName = computed(() => Bible.getBookName(props.bookIndex, locale.value));

const totalBookVerses = computed(() => Bible.getBookVerseCount(props.bookIndex));

const totalVersesRead = computed(() =>
  Bible.countUniqueBookRangeVerses(props.bookIndex, props.logEntries),
);

const percentageRead = computed(() =>
  Math.floor(totalVersesRead.value / totalBookVerses.value * 100),
);

const allChapterReports = computed(() => {
  const reports = [];
  for (let i = 1, l = Bible.getBookChapterCount(props.bookIndex); i <= l; i++) {
    reports.push(chapterReport(i));
  }
  return reports;
});

function chapterReport(chapterIndex: number) {
  const totalVerses = Bible.getChapterVerseCount(props.bookIndex, chapterIndex);
  const versesRead = Bible.countUniqueBookChapterRangeVerses(props.bookIndex, chapterIndex, props.logEntries);
  const percentage = Math.floor(versesRead / totalVerses * 100);
  const segments = chapterReadingSegments(props.bookIndex, chapterIndex);
  return { totalVerses, versesRead, percentage, bookIndex: props.bookIndex, chapterIndex, segments };
}

function bookReadingSegments(bookIndex: number) {
  const totalVerses = Bible.getBookVerseCount(bookIndex);
  const segments = Bible.generateBookSegments(bookIndex, props.logEntries);
  segments.forEach((segment) => {
    segment.percentage = (segment.verseCount as number) * 100 / totalVerses;
  });
  return segments;
}

function chapterReadingSegments(bookIndex: number, chapterIndex: number) {
  const totalVerses = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  const segments = Bible.generateBookChapterSegments(bookIndex, chapterIndex, props.logEntries);
  segments.forEach((segment) => {
    segment.percentage = (segment.verseCount as number) * 100 / totalVerses;
  });
  return segments;
}

function openAddEntryForm(bookIndex: number, chapterIndex: number) {
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  useLogEntryEditorStore().openEditor({
    id: null,
    date: dayjs().format('YYYY-MM-DD'),
    startVerseId: Bible.makeVerseId(bookIndex, chapterIndex, 1),
    endVerseId: Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount),
  });
}

function takeNoteOnChapter(bookIndex: number, chapterIndex: number) {
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  usePassageNoteEditorStore().openEditor({
    passages: [{ startVerseId: Bible.makeVerseId(bookIndex, chapterIndex, 1), endVerseId: Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount) }],
    content: '',
  });
}

function viewNotesForChapter(bookIndex: number, chapterIndex: number) {
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  const query = encodePassageNotesQueryToRoute({
    filterPassageStartVerseId: Bible.makeVerseId(bookIndex, chapterIndex, 1),
    filterPassageEndVerseId: Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount),
    offset: 0,
  });
  router.push({ path: localePath('/notes'), query });
}

function viewReadingLogForChapter(bookIndex: number, chapterIndex: number) {
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  const query = encodeLogEntriesQueryToRoute({
    filterPassageStartVerseId: Bible.makeVerseId(bookIndex, chapterIndex, 1),
    filterPassageEndVerseId: Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount),
    offset: 0,
  });
  router.push({ path: localePath('/log'), query });
}
</script>

<style>
.book-report {
  user-select: none;
}

.book-report-header {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-areas: "back title notes reading";
  align-items: center;
  column-gap: 0.75rem;
  row-gap: 0.5rem;
  margin-bottom: 1rem;
}

.book-report-header__back { grid-area: back; }
.book-report-header__title { grid-area: title; margin-bottom: 0; }
.book-report-header__notes { grid-area: notes; }
.book-report-header__reading { grid-area: reading; }

@media (max-width: 900px) {
  .book-report-header {
    grid-template-areas:
      "back . notes reading"
      "title title title title";
  }
}

.chapter-report-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}
</style>

<i18n lang="json">
{
  "en": { "book_notes": "Book Notes", "book_reading": "Book Reading" },
  "de": { "book_notes": "Buch Notizen", "book_reading": "Buch Lesen" },
  "es": { "book_notes": "Notas del libro", "book_reading": "Lectura del libro" },
  "fr": { "book_notes": "Notes du livre", "book_reading": "Lecture du livre" },
  "ko": { "book_notes": "권별 노트", "book_reading": "권별 기록" },
  "pt": { "book_notes": "Notas do livro", "book_reading": "Leitura do livro" },
  "uk": { "book_notes": "Нотатки книги", "book_reading": "Читання книги" }
}
</i18n>
