<template>
  <div class="book-report">
    <header class="book-report-header mbl-hidden-mobile">
      <button class="mbl-button mbl-button--sm book-report-header__back" @click="$emit('exit-book-report')">
        <caret-left-icon />
      </button>
      <h2 class="mbl-title book-report-header__title">
        <span>{{ bookName }}</span>
      </h2>
      <button class="mbl-button mbl-button--sm book-report-header__notes" @click="$emit('view-book-notes')">
        {{ $t('book_notes') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </button>
      <button class="mbl-button mbl-button--sm book-report-header__reading" @click="$emit('view-book-log')">
        {{ $t('book_reading') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </button>
    </header>
    <header class="book-report-header mbl-hidden-tablet">
      <button class="mbl-button mbl-button--sm book-report-header__back" @click="$emit('exit-book-report')">
        <caret-left-icon />
      </button>
      <h2 class="mbl-title mbl-title--5 book-report-header__title">
        <span>{{ bookName }}</span>
      </h2>
      <button class="mbl-button mbl-button--sm book-report-header__notes" @click="$emit('view-book-notes')">
        {{ $t('book_notes') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </button>
      <button class="mbl-button mbl-button--sm book-report-header__reading" @click="$emit('view-book-log')">
        {{ $t('book_reading') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </button>
    </header>
    <div class="plaque" data-testid="book-report-progress" :data-percentage="percentageRead">
      <p>
        <span>{{ $n(percentageRead / 100, 'percent') }}</span>
      </p>
      <segment-bar thick="thick" :segments="bookReadingSegments(book.bibleOrder)" />
    </div>
    <div class="chapter-report-grid">
      <template v-for="report in allChapterReports">
        <chapter-report
          :key="report.chapterIndex"
          :report="report"
          @createLogEntry="openAddEntryForm"
          @takeNoteOnChapter="takeNoteOnChapter"
          @viewNotesForChapter="viewNotesForChapter"
          @viewReadingLogForChapter="viewReadingLogForChapter"
        />
      </template>
    </div>
  </div>
</template>

<script>
import * as dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '@/helpers/passage-notes-route-query';
import { encodeLogEntriesQueryToRoute } from '@/helpers/log-entries-route-query';
import ChapterReport from '@/components/bible/ChapterReport';
import SegmentBar from '@/components/bible/SegmentBar';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
import CaretLeftIcon from '@/components/svg/CaretLeftIcon';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';

const calcPercent = (numerator, denominator) => {
  return Math.floor(numerator / denominator * 100);
};

export default {
  name: 'BookReport',
  components: {
    ChapterReport,
    SegmentBar,
    CaretRightIcon,
    CaretLeftIcon,
  },
  props: {
    logEntries: {
      type: Array,
      default: () => [],
    },
    bookIndex: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
    };
  },
  computed: {
    book() {
      return Bible.getBooks().find(b => b.bibleOrder === this.bookIndex);
    },
    bookName() {
      return Bible.getBookName(this.bookIndex, this.$i18n.locale);
    },
    totalBookVerses() {
      return Bible.getBookVerseCount(this.bookIndex);
    },
    totalVersesRead() {
      return Bible.countUniqueBookRangeVerses(this.bookIndex, this.logEntries);
    },
    percentageRead() {
      return calcPercent(this.totalVersesRead, this.totalBookVerses);
    },
    allChapterReports() {
      const reports = [];
      for (let i = 1, l = Bible.getBookChapterCount(this.bookIndex); i <= l; i++) {
        reports.push(this.chapterReport(i));
      }
      return reports;
    },
  },
  methods: {
    chapterReport(chapterIndex) {
      const totalVerses = Bible.getChapterVerseCount(this.bookIndex, chapterIndex);
      const versesRead = Bible.countUniqueBookChapterRangeVerses(this.bookIndex, chapterIndex, this.logEntries);
      const percentage = calcPercent(versesRead, totalVerses);
      const segments = this.chapterReadingSegments(this.bookIndex, chapterIndex);
      return { totalVerses, versesRead, percentage, bookIndex: this.bookIndex, chapterIndex, segments };
    },
    bookReadingSegments(bookIndex) {
      const totalBookVerses = Bible.getBookVerseCount(bookIndex);

      const segments = Bible.generateBookSegments(bookIndex, this.logEntries);

      segments.forEach((segment) => {
        segment.percentage = segment.verseCount * 100 / totalBookVerses;
        return segment;
      });

      return segments;
    },
    chapterReadingSegments(bookIndex, chapterIndex) {
      const totalChapterVerses = Bible.getChapterVerseCount(bookIndex, chapterIndex);

      const segments = Bible.generateBookChapterSegments(bookIndex, chapterIndex, this.logEntries);

      segments.forEach((segment) => {
        segment.percentage = segment.verseCount * 100 / totalChapterVerses;
        return segment;
      });

      return segments;
    },
    openAddEntryForm(bookIndex, chapterIndex) {
      const logEntryEditorStore = useLogEntryEditorStore();
      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      logEntryEditorStore.openEditor({
        id: null,
        date: dayjs().format('YYYY-MM-DD'),
        startVerseId: Bible.makeVerseId(bookIndex, chapterIndex, 1),
        endVerseId: Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount),
      });
    },
    takeNoteOnChapter(bookIndex, chapterIndex) {
      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
      const endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);
      usePassageNoteEditorStore().openEditor({
        passages: [{ startVerseId, endVerseId }],
        content: '',
      });
    },
    viewNotesForChapter(bookIndex, chapterIndex) {
      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
      const endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);

      const query = encodePassageNotesQueryToRoute({
        filterPassageStartVerseId: startVerseId,
        filterPassageEndVerseId: endVerseId,
        offset: 0,
      });
      this.$router.push({ path: this.localePath('/notes'), query });
    },
    viewReadingLogForChapter(bookIndex, chapterIndex) {
      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
      const endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);

      const query = encodeLogEntriesQueryToRoute({
        filterPassageStartVerseId: startVerseId,
        filterPassageEndVerseId: endVerseId,
        offset: 0,
      });
      this.$router.push({ path: this.localePath('/log'), query });
    },
  },
};
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

.plaque {
  margin-bottom: 2rem;
  p {
    text-align: right;
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
  "en": {
    "book_notes": "Book Notes",
    "book_reading": "Book Reading"
  },
  "de": {
    "book_notes": "Buch Notizen",
    "book_reading": "Buch Lesen"
  },
  "es": {
    "book_notes": "Notas del libro",
    "book_reading": "Lectura del libro"
  },
  "fr": {
    "book_notes": "Notes du livre",
    "book_reading": "Lecture du livre"
  },
  "ko": {
    "book_notes": "권별 노트",
    "book_reading": "권별 기록"
  },
  "pt": {
    "book_notes": "Notas do livro",
    "book_reading": "Leitura do livro"
  },
  "uk": {
    "book_notes": "Нотатки книги",
    "book_reading": "Читання книги"
  }
}
</i18n>
