<template>
  <div class="content-column">
    <busy-bar :busy="busy" />
    <ClientOnly>
      <reading-tracker-reset-card />
    </ClientOnly>
    <header class="page-header">
      <h2 class="mbl-title">
        {{ t('chapter_checklist') }}
      </h2>
    </header>
    <br>
    <div>
      <div v-if="!bookReports.length" class="loading-card">
        <strong>{{ t('loading') }}</strong>
      </div>
      <div
        v-for="bookReport in bookReports"
        :key="bookReport.bookIndex"
        class="book-card"
        data-testid="book-card"
        :data-book-index="bookReport.bookIndex"
        :data-complete="bookReport.complete || undefined"
      >
        <div class="book-card--header">
          <div class="book-card--completion-indicator">
            <svg v-if="bookReport.complete" viewBox="0 0 24 24" width="100%" height="100%"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" :fill="bookReport.complete ? 'var(--mbl-success-bright)' : 'transparent'" /></svg>
          </div>
          <div class="book-card--book-name">
            {{ bookReport.bookName }}
          </div>
          <div class="book-card--completion-fraction" data-testid="book-card-fraction">
            {{ bookReport.chaptersRead }} / {{ bookReport.totalChapters }}
          </div>
          <div
            class="book-card--chapter-toggle"
            data-testid="book-card-toggle"
            :class="{ flipped: expandedBooks[bookReport.bookIndex] }"
            @click="toggleBook(bookReport.bookIndex)"
          >
            <svg viewBox="0 0 24 24" width="2rem" height="2rem"><path d="M7 10l5 5 5-5z" fill="var(--mbl-border-strong)" /></svg>
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
            :data-complete="chapterReport.complete || undefined"
            @click="toggleChapter(chapterReport.bookIndex, chapterReport.chapterIndex)"
          >
            <div class="chapter-card--chapter-number">
              {{ chapterReport.chapterIndex }}
            </div>
            <div class="chapter-card--completion-indicator">
              <svg v-if="busyChapter === `${bookReport.bookIndex}.${chapterReport.chapterIndex}`" viewBox="0 0 80 80" width="100%" height="100%">
                <path
                  :fill="chapterReport.complete ? 'var(--neutral-150)' : 'var(--mbl-success-bright)'"
                  d="M40,72C22.4,72,8,57.6,8,40C8,22.4,22.4,8,40,8c17.6,0,32,14.4,32,32c0,1.1-0.9,2-2,2s-2-0.9-2-2c0-15.4-12.6-28-28-28S12,24.6,12,40s12.6,28,28,28c1.1,0,2,0.9,2,2S41.1,72,40,72z"
                >
                  <animateTransform
                    attributeType="xml"
                    attributeName="transform"
                    type="rotate"
                    from="0 40 40"
                    to="360 40 40"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="100%" height="100%"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" :fill="chapterReport.complete ? 'var(--mbl-success-bright)' : 'transparent'" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible, BrowserCache } from '@mybiblelog/shared';
import BusyBar from '~/components/ui/BusyBar.vue';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import ReadingTrackerResetCard from '~/components/ui/ReadingTrackerResetCard.vue';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAppInitStore } from '~/stores/app-init';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });
const { t, locale } = useI18n();
useHead({ title: () => t('chapter_checklist') });

const CACHE_KEY = 'chapterChecklist';
const CACHE_MINUTES = 60;

type ChapterReport = { bookIndex: number; chapterIndex: number; complete: boolean };
type BookReport = {
  bookIndex: number;
  bookName: string;
  totalChapters: number;
  chaptersRead: number;
  percentage: number;
  complete: boolean;
  chapterReports: ChapterReport[];
};

const logEntriesStore = useLogEntriesStore();
const computeBusy = ref(false);
const busyChapter = ref<string | null>(null);
const readChapters = ref<Record<string, boolean>>({});
const bookReports = ref<BookReport[]>([]);

const bookCount = Bible.getBookCount();
const expandedBooks = ref<Record<number, boolean>>({});
for (let i = 1; i <= bookCount; i++) {
  expandedBooks.value[i] = false;
}

const busy = computed(() => Boolean(busyChapter.value || computeBusy.value));

async function getReadChapters() {
  const ranges = Bible.consolidateRanges(logEntriesStore.currentLogEntries);
  const result: Record<string, boolean> = {};

  for (const range of ranges) {
    const { book, chapter: startChapter, verse: startVerse } = Bible.parseVerseId(range.startVerseId);
    const { chapter: endChapter, verse: endVerse } = Bible.parseVerseId(range.endVerseId);

    if (startVerse === 1) {
      if (endChapter > startChapter || Bible.getChapterVerseCount(book, startChapter) === endVerse) {
        result[`${book}.${startChapter}`] = true;
      }
    }
    if (endChapter > startChapter && Bible.getChapterVerseCount(book, endChapter) === endVerse) {
      result[`${book}.${endChapter}`] = true;
    }
    if (endChapter > startChapter + 1) {
      for (let c = startChapter + 1; c < endChapter; c++) {
        result[`${book}.${c}`] = true;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  readChapters.value = result;
}

function getBookReport(bookIndex: number): BookReport {
  const bookName = Bible.getBookName(bookIndex, locale.value);
  const totalChapters = Bible.getBookChapterCount(bookIndex);
  const chapterReports: ChapterReport[] = [];
  let chaptersRead = 0;

  for (let chapterIndex = 1; chapterIndex <= totalChapters; chapterIndex++) {
    const complete = readChapters.value[`${bookIndex}.${chapterIndex}`] === true;
    if (complete) { chaptersRead++; }
    chapterReports.push({ bookIndex, chapterIndex, complete });
  }

  const percentage = Math.floor(chaptersRead / totalChapters * 100);
  const complete = chaptersRead === totalChapters;
  return { bookIndex, bookName, totalChapters, chaptersRead, percentage, complete, chapterReports };
}

async function getBookReports() {
  computeBusy.value = true;

  const cached = BrowserCache.get(CACHE_KEY);
  if (cached) {
    bookReports.value = cached as BookReport[];
  }

  await getReadChapters();
  const reports: BookReport[] = [];
  for (let i = 1; i <= bookCount; i++) {
    reports.push(getBookReport(i));
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  BrowserCache.set(CACHE_KEY, reports, CACHE_MINUTES);
  bookReports.value = reports;
  computeBusy.value = false;
}

function toggleBook(bookIndex: number) {
  expandedBooks.value[bookIndex] = !expandedBooks.value[bookIndex];
}

async function toggleChapter(bookIndex: number, chapterIndex: number) {
  if (busyChapter.value) { return; }
  const toastStore = useToastStore();
  busyChapter.value = `${bookIndex}.${chapterIndex}`;

  const date = dayjs().format('YYYY-MM-DD');
  const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
  const endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, Bible.getChapterVerseCount(bookIndex, chapterIndex));

  const isComplete = readChapters.value[`${bookIndex}.${chapterIndex}`] === true;
  if (isComplete) {
    const matchingLogEntry = logEntriesStore.currentLogEntries.find(logEntry =>
      logEntry.date === date &&
      logEntry.startVerseId === startVerseId &&
      logEntry.endVerseId === endVerseId,
    );
    if (matchingLogEntry) {
      const success = await logEntriesStore.deleteLogEntry(matchingLogEntry.id);
      if (success) {
        await getBookReports();
      }
      else {
        toastStore.add({ type: 'error', text: t('unable_to_mark_incomplete') });
      }
    }
    else {
      toastStore.add({ type: 'info', text: t('logged_before_today') });
    }
  }
  else {
    const createdEntry = await logEntriesStore.createLogEntry({ date, startVerseId, endVerseId });
    if (createdEntry) {
      await getBookReports();
    }
    else {
      toastStore.add({ type: 'error', text: t('unable_to_mark_complete') });
    }
  }
  busyChapter.value = null;
}

onMounted(async () => {
  await useAppInitStore().loadUserData();
  getBookReports();
});
</script>

<style scoped>
.loading-card {
  padding: 1rem 2rem;
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);
  margin: 0.5rem 0;
}
.book-card { user-select: none; }
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
.book-card--completion-indicator { grid-area: 1 / 1 / 3 / 2; width: 1.5rem; margin-right: 0.5rem; display: flex; }
.book-card--book-name { grid-area: 1 / 2 / 2 / 3; }
.book-card--completion-fraction { grid-area: 1 / 3 / 2 / 4; text-align: right; }
.book-card--completion-bar { grid-area: 2 / 2 / 3 / 4; }
.book-card--chapter-toggle { grid-area: 1 / 4 / 3 / 5; display: flex; cursor: pointer; }
.book-card--chapter-toggle.flipped { transform: rotate(180deg); }
.book-card--chapters {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(5, 1fr);
}
@media screen and (min-width: 769px) { .book-card--chapters { grid-template-columns: repeat(6, 1fr); } }
@media screen and (min-width: 1024px) { .book-card--chapters { grid-template-columns: repeat(8, 1fr); } }
@media screen and (min-width: 1216px) { .book-card--chapters { grid-template-columns: repeat(10, 1fr); } }
@media screen and (min-width: 1408px) { .book-card--chapters { grid-template-columns: repeat(12, 1fr); } }
.chapter-card {
  padding: 0.5rem;
  background: var(--mbl-bg);
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);
  position: relative;
  cursor: pointer;
  transition: 0.1s;
}
.chapter-card:hover { transition: 0.2s; box-shadow: var(--mbl-shadow-elev-2); }
.chapter-card--chapter-number { text-align: center; font-weight: bold; }
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
