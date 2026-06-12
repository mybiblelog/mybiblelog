<template>
  <div class="content-column">
    <busy-bar :busy="busy" />
    <header class="page-header">
      <h2 class="mbl-title">
        {{ $t('chapter_checklist') }}
        <info-link :to="localePath('/about/page-features--chapter-checklist')" />
      </h2>
    </header>
    <br>
    <client-only>
      <reading-tracker-reset-card />
    </client-only>
    <div>
      <div v-if="!bookReports.length" class="loading-card">
        <strong>{{ $t('loading') }}</strong>
      </div>
      <div
        v-for="bookReport in bookReports"
        :key="bookReport.bookIndex"
        class="book-card"
        data-testid="book-card"
        :data-book-index="bookReport.bookIndex"
        :data-complete="bookReport.complete"
      >
        <div class="book-card--header">
          <div class="book-card--completion-indicator">
            <check-mark-icon width="100%" height="100%" :fill="bookReport.complete ? 'var(--mbl-success-bright)' : 'transparent'" />
          </div>
          <div class="book-card--book-name">
            {{ bookReport.bookName }}
          </div>
          <div class="book-card--completion-fraction" data-testid="book-card-fraction">
            {{ bookReport.chaptersRead }} / {{ bookReport.totalChapters }}
          </div>
          <div class="book-card--chapter-toggle" data-testid="book-card-toggle" :class="{ flipped: expandedBooks[bookReport.bookIndex] }" @click="toggleBook(bookReport.bookIndex)">
            <caret-down-icon width="2rem" height="2rem" fill="var(--mbl-border-strong)" />
          </div>
          <div class="book-card--completion-bar">
            <completion-bar :percentage="bookReport.percentage" foreground-color="var(--mbl-success-bright)" />
          </div>
        </div>
        <div v-if="expandedBooks[bookReport.bookIndex]" class="book-card--chapters">
          <div
            v-for="chapterReport in bookReport.chapterReports"
            :key="chapterReport.chapterIndex"
            class="chapter-card"
            data-testid="chapter-card"
            :data-chapter="chapterReport.chapterIndex"
            :data-complete="Boolean(chapterReport.complete)"
            @click="toggleChapter(chapterReport.bookIndex, chapterReport.chapterIndex)"
          >
            <div class="chapter-card--chapter-number">
              {{ chapterReport.chapterIndex }}
            </div>
            <div class="chapter-card--completion-indicator">
              <spinner-icon v-if="busyChapter === `${bookReport.bookIndex}.${chapterReport.chapterIndex}`" width="100%" height="100%" :fill="chapterReport.complete ? 'var(--neutral-150)' : 'var(--mbl-success-bright)'" />
              <check-mark-icon v-else width="100%" height="100%" :fill="chapterReport.complete ? 'var(--mbl-success-bright)' : 'transparent'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as dayjs from 'dayjs';
import { Bible, BrowserCache } from '@mybiblelog/shared';
import BusyBar from '@/components/BusyBar';
import CompletionBar from '@/components/CompletionBar';
import CheckMarkIcon from '@/components/svg/CheckMarkIcon';
import CaretDownIcon from '@/components/svg/CaretDownIcon';
import SpinnerIcon from '@/components/svg/SpinnerIcon';
import InfoLink from '@/components/InfoLink';
import { useToastStore } from '~/stores/toast';
import { useLogEntriesStore } from '~/stores/log-entries';
import ReadingTrackerResetCard from '@/components/ReadingTrackerResetCard';
const CHAPTER_CHECKLIST_CACHE_KEY = 'chapterChecklist';
const CHAPTER_CHECKLIST_CACHE_MINUTES = 60;

const calcPercent = (numerator, denominator) => {
  return Math.floor(numerator / denominator * 100);
};

export default {
  components: {
    BusyBar,
    CompletionBar,
    CheckMarkIcon,
    CaretDownIcon,
    SpinnerIcon,
    InfoLink,
    ReadingTrackerResetCard,
  },
  middleware: ['auth'],
  data() {
    const expandedBooks = {};
    const bookCount = Bible.getBookCount();
    for (let i = 1; i <= bookCount; i++) {
      expandedBooks[i] = false;
    }
    return {
      computeBusy: false,
      busyChapter: null,
      expandedBooks,
      readChapters: {},
      bookReports: [],
    };
  },
  head() {
    return {
      title: this.$t('chapter_checklist'),
    };
  },
  computed: {
    logEntriesStore() {
      return useLogEntriesStore();
    },
    logEntries() {
      return this.logEntriesStore.currentLogEntries;
    },
    busy() {
      return Boolean(this.busyChapter || this.computeBusy);
    },
  },
  mounted() {
    setTimeout(this.getBookReports);
  },
  methods: {
    async getReadChapters() {
      const ranges = Bible.consolidateRanges(this.logEntries);
      const readChapters = {}; // { [`${bookIndex}.${chapterIndex}`]: boolean }
      function markRead(bookIndex, chapterIndex) { readChapters[`${bookIndex}.${chapterIndex}`] = true; }

      for (const range of ranges) {
        const { book, chapter: startChapter, verse: startVerse } = Bible.parseVerseId(range.startVerseId);
        const { chapter: endChapter, verse: endVerse } = Bible.parseVerseId(range.endVerseId);

        if (startVerse === 1) {
          if (endChapter > startChapter || Bible.getChapterVerseCount(book, startChapter) === endVerse) {
            markRead(book, startChapter);
          }
        }
        if (endChapter > startChapter && Bible.getChapterVerseCount(book, endChapter) === endVerse) {
          markRead(book, endChapter);
        }
        if (endChapter > startChapter + 1) {
          for (let c = startChapter + 1; c < endChapter; c++) {
            markRead(book, c);
          }
        }

        // Give up the event loop to let other things happen
        await new Promise(resolve => setImmediate(resolve));
      }
      this.readChapters = readChapters;
    },
    getBookReport(bookIndex, readChapters) {
      const bookName = Bible.getBookName(bookIndex, this.$i18n.locale);
      const totalChapters = Bible.getBookChapterCount(bookIndex);
      const chapterReports = [];
      let chaptersRead = 0;
      for (let chapterIndex = 1, l = totalChapters; chapterIndex <= l; chapterIndex++) {
        const totalVerses = Bible.getChapterVerseCount(bookIndex, chapterIndex);
        const versesRead = Bible.countUniqueBookChapterRangeVerses(bookIndex, chapterIndex, this.logEntries);
        const complete = readChapters[`${bookIndex}.${chapterIndex}`];
        if (complete) {
          chaptersRead++;
        }
        chapterReports.push({ totalVerses, versesRead, bookIndex, chapterIndex, complete });
      }
      const percentage = calcPercent(chaptersRead, totalChapters);
      const complete = percentage === 100;
      return { bookIndex, bookName, totalChapters, chaptersRead, percentage, complete, chapterReports };
    },
    async getBookReports() {
      this.computeBusy = true;

      // Check for cached data to give an immediate visual response
      const cachedBookReports = BrowserCache.get(CHAPTER_CHECKLIST_CACHE_KEY);
      if (cachedBookReports) {
        this.bookReports = cachedBookReports;
      }

      await this.getReadChapters();
      const bookReports = [];
      for (let i = 1, l = Bible.getBookCount(); i <= l; i++) {
        bookReports.push(this.getBookReport(i, this.readChapters));

        // Give up the event loop to let other things happen
        await new Promise(resolve => setImmediate(resolve));
      }

      // Cache book reports
      BrowserCache.set(CHAPTER_CHECKLIST_CACHE_KEY, bookReports, CHAPTER_CHECKLIST_CACHE_MINUTES);

      this.bookReports = bookReports;
      this.computeBusy = false;
    },
    toggleBook(bookIndex) {
      if (this.expandedBooks[bookIndex]) {
        this.expandedBooks[bookIndex] = false;
      }
      else {
        this.expandedBooks[bookIndex] = true;
      }
    },
    async toggleChapter(bookIndex, chapterIndex) {
      if (this.busyChapter) {
        return;
      }
      const toastStore = useToastStore();
      this.busyChapter = `${bookIndex}.${chapterIndex}`;

      const date = dayjs().format('YYYY-MM-DD');
      const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
      const endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, Bible.getChapterVerseCount(bookIndex, chapterIndex));

      const isComplete = this.readChapters[`${bookIndex}.${chapterIndex}`] === true;
      if (isComplete) {
        const matchingLogEntry = this.logEntries.find(logEntry => (
          logEntry.date === date &&
          logEntry.startVerseId === startVerseId &&
          logEntry.endVerseId === endVerseId
        ));
        if (matchingLogEntry) {
          const success = await this.logEntriesStore.deleteLogEntry(matchingLogEntry.id);
          if (success) {
            await this.getBookReports();
          }
          else {
            toastStore.add({
              type: 'error',
              text: this.$t('unable_to_mark_incomplete'),
            });
          }
        }
        else {
          toastStore.add({
            type: 'info',
            text: this.$t('logged_before_today'),
          });
        }
      }
      else {
        const newLogEntry = { date, startVerseId, endVerseId };
        const createdEntry = await this.logEntriesStore.createLogEntry(newLogEntry);
        if (createdEntry) {
          await this.getBookReports();
        }
        else {
          toastStore.add({
            type: 'error',
            text: this.$t('unable_to_mark_complete'),
          });
        }
      }
      this.busyChapter = null;
    },
  },
};
</script>

<style scoped>
.loading-card {
  padding: 1rem 2rem;
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);
  margin: 0.5rem 0;
}

.book-card {
  user-select: none;
}

.book-card--header {
  display: grid;
  grid-template-columns: 2rem 1fr 1fr 2rem;
  grid-template-rows: auto auto;

  padding: 0.5rem;
  background: var(--mbl-bg);
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);
  margin: 0.5rem 0;

  font-size: 0.8rem;
  font-weight: bold;
}

.book-card--completion-indicator {
  grid-area: 1 / 1 / 3 / 2;
  width: 1.5rem;
  margin-right: 0.5rem;
  display: flex;
}

.book-card--book-name {
  grid-area: 1 / 2 / 2 / 3;
}

.book-card--completion-fraction {
  grid-area: 1 / 3 / 2 / 4;
  text-align: right;
}

.book-card--completion-bar {
  grid-area: 2 / 2 / 3 / 4;
}

.book-card--chapter-toggle {
  grid-area: 1 / 4 / 3 / 5;
  display: flex;
  cursor: pointer;
}

.book-card--chapter-toggle.flipped {
  transform: rotate(180deg);
}

.book-card--chapters {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(5, 1fr);
}

@media screen and (min-width: 769px) {
  .book-card--chapters {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media screen and (min-width: 1024px) {
  .book-card--chapters {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media screen and (min-width: 1216px) {
  .book-card--chapters {
    grid-template-columns: repeat(10, 1fr);
  }
}

@media screen and (min-width: 1408px) {
  .book-card--chapters {
    grid-template-columns: repeat(12, 1fr);
  }
}

.chapter-card {
  padding: 0.5rem;
  background: var(--mbl-bg);
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);

  flex-basis: calc(25% - 1rem);
  position: relative;

  cursor: pointer;

  transition: 0.1s;
}

.chapter-card:hover {
  transition: 0.2s;
  box-shadow: var(--mbl-shadow-elev-2);
}

.chapter-card--chapter-number {
  text-align: center;
  font-weight: bold;
}
</style>

<i18n lang="json">
{
  "en": {
    "chapter_checklist": "Chapter Checklist",
    "loading": "Loading...",
    "logged_before_today": "This chapter was logged before today. You can edit previous log entries on the Calendar page.",
    "unable_to_mark_complete": "Unable to mark the chapter complete.",
    "unable_to_mark_incomplete": "Unable to mark the chapter incomplete."
  },
  "de": {
    "chapter_checklist": "Kapitelliste",
    "loading": "Laden...",
    "logged_before_today": "Dieses Kapitel wurde vor heute protokolliert. Sie können frühere Protokolleinträge auf der Kalenderseite bearbeiten.",
    "unable_to_mark_complete": "Kann das Kapitel nicht als abgeschlossen markieren.",
    "unable_to_mark_incomplete": "Kann das Kapitel nicht als unvollständig markieren."
  },
  "es": {
    "chapter_checklist": "Lista de capítulos",
    "loading": "Cargando...",
    "logged_before_today": "Este capítulo se registró antes de hoy. Puede editar las entradas de registro anteriores en la página del calendario.",
    "unable_to_mark_complete": "No se puede marcar el capítulo como completo.",
    "unable_to_mark_incomplete": "No se puede marcar el capítulo como incompleto."
  },
  "fr": {
    "chapter_checklist": "Liste de contrôle",
    "loading": "Chargement...",
    "logged_before_today": "Ce chapitre a été enregistré avant aujourd'hui. Vous pouvez modifier les entrées de journal précédentes sur la page du calendrier.",
    "unable_to_mark_complete": "Impossible de marquer le chapitre comme terminé.",
    "unable_to_mark_incomplete": "Impossible de marquer le chapitre comme incomplet."
  },
  "ko": {
    "chapter_checklist": "장별 체크",
    "loading": "불러오는 중…",
    "logged_before_today": "이 장은 오늘 이전에 기록되었습니다. 달력 페이지에서 이전 기록을 수정할 수 있습니다.",
    "unable_to_mark_complete": "해당 장을 읽기 완료로 표시할 수 없습니다.",
    "unable_to_mark_incomplete": "해당 장을 읽지 않음으로 표시할 수 없습니다."
  },
  "pt": {
    "chapter_checklist": "Lista de Capítulos",
    "loading": "Carregando...",
    "logged_before_today": "Este capítulo foi registrado antes de hoje. Você pode editar entradas de log anteriores na página do Calendário.",
    "unable_to_mark_complete": "Não é possível marcar o capítulo como completo.",
    "unable_to_mark_incomplete": "Não é possível marcar o capítulo como incompleto."
  },
  "uk": {
    "chapter_checklist": "Перелік розділів",
    "loading": "Завантаження...",
    "logged_before_today": "Цей розділ був зареєстрований до сьогодні. Ви можете редагувати попередні записи в календарній сторінці.",
    "unable_to_mark_complete": "Не вдалося позначити розділ як завершений.",
    "unable_to_mark_incomplete": "Не вдалося позначити розділ як незавершений."
  }
}
</i18n>
