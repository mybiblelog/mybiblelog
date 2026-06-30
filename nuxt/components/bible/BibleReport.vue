<template>
  <div class="bible-report">
    <header class="page-header">
      <h2 class="mbl-title">
        {{ $t('bible_books') }}
      </h2>
      <nuxt-link class="mbl-button" :to="localePath('/progress')">
        {{ $t('progress') }}
        <caret-right-icon style="margin-left: 0.2rem;" />
      </nuxt-link>
    </header>
    <div class="testament-toggle">
      <button
        type="button"
        class="testament-toggle--button"
        :class="{ active: testamentFilter === 'all' }"
        data-testid="testament-toggle-all"
        @click="testamentFilter = 'all'"
      >
        {{ $t('whole_bible') }}
      </button>
      <button
        type="button"
        class="testament-toggle--button"
        :class="{ active: testamentFilter === 'old' }"
        data-testid="testament-toggle-old"
        @click="testamentFilter = 'old'"
      >
        {{ $t('old_testament_short') }}
      </button>
      <button
        type="button"
        class="testament-toggle--button"
        :class="{ active: testamentFilter === 'new' }"
        data-testid="testament-toggle-new"
        @click="testamentFilter = 'new'"
      >
        {{ $t('new_testament_short') }}
      </button>
    </div>
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
import SegmentBar from '@/components/bible/SegmentBar';
import StarIcon from '@/components/svg/StarIcon';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
const calcPercent = (numerator, denominator) => {
  return Math.floor(numerator / denominator * 100);
};

export default {
  name: 'BibleReport',
  components: {
    SegmentBar,
    StarIcon,
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
      testamentFilter: 'all',
      bookNotesCounts: {},
      anyBooksHaveNotes: false,
    };
  },
  computed: {
    visibleBookIndices() {
      return Bible.getBooks()
        .filter((book) => {
          if (this.testamentFilter === 'old') { return !book.newTestament; }
          if (this.testamentFilter === 'new') { return book.newTestament; }
          return true;
        })
        .map(book => book.bibleOrder);
    },
    totalVisibleVerses() {
      return this.visibleBookIndices.reduce((sum, bookIndex) => sum + Bible.getBookVerseCount(bookIndex), 0);
    },
    totalVersesRead() {
      return this.visibleBookIndices.reduce((sum, bookIndex) => sum + Bible.countUniqueBookRangeVerses(bookIndex, this.logEntries), 0);
    },
    percentageRead() {
      return calcPercent(this.totalVersesRead, this.totalVisibleVerses);
    },
    allBookReports() {
      return this.visibleBookIndices.map(bookIndex => this.bookReport(bookIndex));
    },
    bibleReadingSegments() {
      const segments = [];
      for (const bookIndex of this.visibleBookIndices) {
        segments.push(...Bible.generateBookSegments(bookIndex, this.logEntries));
      }

      segments.forEach((segment) => {
        segment.percentage = segment.verseCount * 100 / this.totalVisibleVerses;
        return segment;
      });

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

.bible-report .testament-toggle {
  display: flex;
  margin-bottom: 1rem;
}

.bible-report .testament-toggle--button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--mbl-border-strong);
  background: var(--mbl-bg);
  cursor: pointer;
  transition: 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
}

.bible-report .testament-toggle--button:hover {
  border-color: var(--mbl-link-bright);
  background: var(--mbl-message-info-bg);
}

.bible-report .testament-toggle--button.active {
  background: var(--mbl-link-bright);
  color: var(--mbl-on-accent);
  border-color: var(--mbl-link-bright);
}

.bible-report .testament-toggle--button:first-child {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-right: none;
}

.bible-report .testament-toggle--button:last-child {
  border-left: none;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
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
