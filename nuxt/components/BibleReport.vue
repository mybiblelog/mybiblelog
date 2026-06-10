<template>
  <div class="bible-report">
    <header class="page-header">
      <h2 class="mbl-title">
        {{ $t('bible_books') }}
        <info-link :to="localePath('/about/page-features--bible-books')" />
      </h2>
      <nuxt-link class="mbl-button" :to="localePath('/progress')">
        {{ $t('progress') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </nuxt-link>
    </header>
    <div class="plaque" data-testid="bible-report-progress" :data-percentage="percentageRead">
      <p>
        <span>{{ $n(percentageRead / 100, 'percent') }}</span>
      </p>
      <segment-bar thick="thick" :segments="bibleReadingSegments" />
    </div>
    <div class="progress-list">
      <div
        v-for="report in allBookReports"
        :key="report.bookIndex"
        class="progress-card"
        data-testid="bible-report-book"
        :data-book-index="report.bookIndex"
        :data-percentage="report.percentage"
        @click="$emit('view-book-report', report.bookIndex)"
      >
        <span class="progress-card-icon">
          <star-icon :fill="report.percentage == 100 ? 'var(--mbl-star-earned)' : 'var(--mbl-star-unearned)'" />
        </span>
        <span class="progress-card-book">{{ report.bookName }}</span>
        <span v-if="anyBooksHaveNotes" class="progress-card-note-count-badge" @click="viewBookNotes(report.bookIndex)">
          {{ report.notesCount }} {{ $tc('note', report.notesCount) }}
        </span>
        <span class="progress-card-percentage">{{ $n(report.percentage / 100, 'percent') }}</span>
        <div class="progress-card-progress">
          <segment-bar :segments="bookReadingSegments(report.bookIndex)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Bible } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '@/helpers/passage-notes-route-query';
import SegmentBar from '@/components/SegmentBar';
import StarIcon from '@/components/svg/StarIcon';
import InfoLink from '@/components/InfoLink';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
const calcPercent = (numerator, denominator) => {
  return Math.floor(numerator / denominator * 100);
};

export default {
  name: 'BibleReport',
  components: {
    SegmentBar,
    StarIcon,
    InfoLink,
    CaretRightIcon,
  },
  props: {
    logEntries: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      bookNotesCounts: {},
      anyBooksHaveNotes: false,
    };
  },
  computed: {
    totalBibleVerses() {
      return Bible.getTotalVerseCount();
    },
    totalVersesRead() {
      return Bible.countUniqueRangeVerses(this.logEntries);
    },
    percentageRead() {
      return calcPercent(this.totalVersesRead, this.totalBibleVerses);
    },
    allBookReports() {
      const reports = [];
      for (let i = 1, l = Bible.getBookCount(); i <= l; i++) {
        reports.push(this.bookReport(i));
      }
      return reports;
    },
    bibleReadingSegments() {
      const totalBibleVerses = Bible.getTotalVerseCount();

      const segments = Bible.generateBibleSegments(this.logEntries);

      // let sum = 0;
      segments.forEach((segment) => {
        // sum += segment.verseCount;
        // segment.startPercentage = sum * 100 / totalBibleVerses;
        segment.percentage = segment.verseCount * 100 / totalBibleVerses;
        return segment;
      });
      // console.log(`Whole Bible verse count: ${sum}`);

      return segments;
    },
  },
  async mounted() {
    try {
      const { data: bookNotesCounts } = await this.$http.get('/api/passage-notes/count/books');
      this.bookNotesCounts = bookNotesCounts;
      for (let i = 1, l = Bible.getBookCount(); i <= l; i++) {
        if (this.bookNotesCounts[i] > 0) {
          this.anyBooksHaveNotes = true;
          break;
        }
      }
    }
    catch {
      // Leave bookNotesCounts as {} on error
    }
  },
  methods: {
    bookReport(bookIndex) {
      const bookName = Bible.getBookName(bookIndex, this.$i18n.locale);
      const totalVerses = Bible.getBookVerseCount(bookIndex);
      const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, this.logEntries);
      const percentage = calcPercent(versesRead, totalVerses);
      const notesCount = this.bookNotesCounts[bookIndex] || 0;
      return { bookIndex, bookName, totalVerses, versesRead, percentage, notesCount };
    },
    bookReadingSegments(bookIndex) {
      const totalBookVerses = Bible.getBookVerseCount(bookIndex);

      const segments = Bible.generateBookSegments(bookIndex, this.logEntries);

      // let sum = 0;
      segments.forEach((segment) => {
        segment.percentage = segment.verseCount * 100 / totalBookVerses;
        // sum += segment.verseCount;
        return segment;
      });
      // console.log(`Book ${bookIndex} verse count: ${sum}`);

      return segments;
    },
    viewBookNotes(bookIndex) {
      // Same as in _book.vue
      const bookStartVerseId = Bible.getFirstBookVerseId(bookIndex);
      const bookEndVerseId = Bible.getLastBookVerseId(bookIndex);
      const query = encodePassageNotesQueryToRoute({
        filterPassageStartVerseId: bookStartVerseId,
        filterPassageEndVerseId: bookEndVerseId,
        filterPassageMatching: 'exclusive',
        offset: 0,
      });
      this.$router.push({ path: this.localePath('/notes'), query });
    },
  },
};
</script>

<style>
.bible-report {
  user-select: none;
}

.plaque {
  margin-bottom: 2rem;
}

.plaque p {
  text-align: right;
}

.progress-list .progress-card {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: var(--mbl-bg-elevated);
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);

  display: grid;
  grid-template-columns: auto auto 1fr 3rem;
  grid-template-rows: auto auto;
  grid-template-areas:
    "icon title notes percentage"
    "icon bar   bar   bar";

  cursor: pointer;
  transition: 0.1s;
}

.progress-list .progress-card:hover {
  transition: 0.2s;
  box-shadow: var(--mbl-shadow-elev-2);
}

.progress-list .progress-card-icon {
  grid-area: icon;

  margin-right: 0.5rem;
  display: flex;
  align-items: center;
}

.progress-list .progress-card-book,
.progress-list .progress-card-percentage {
  font-size: 0.8rem;
  font-weight: bold;
  padding-bottom: 0.5rem;
}

.progress-list .progress-card-book {
  grid-area: title;
}

.progress-list .progress-card-note-count-badge {
  grid-area: notes;
  justify-self: end;
  align-self: baseline;
  width: fit-content;
  margin-right: 1rem;
  font-size: 0.8em;
  color: var(--mbl-text-subtle);
  background: var(--mbl-bg-hover-strong);
  margin-left: 1em;
  padding: 0 0.5em;
  border-radius: 0.5em;
  font-weight: normal;
  transition: 0.2s ease-in-out;
}

.progress-list .progress-card-note-count-badge:hover {
  background: var(--mbl-bg-disabled);
  color: var(--mbl-on-accent);
}

/* Make the badge easier to click on mobile */
@media screen and (max-width: 600px) {
  .progress-list .progress-card-note-count-badge {
    position: relative;
  }

  .progress-list .progress-card-note-count-badge::after {
    content: ' ';
    position: absolute;
    top: -1em;
    left: 0;
    right: 0;
    bottom: -1em;
  }
}

.progress-list .progress-card-percentage {
  grid-area: percentage;
  text-align: right;
}

.progress-list .progress-card-progress {
  grid-area: bar;
}
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
