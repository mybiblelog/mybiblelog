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
      <div class="mbl-button-group mbl-button-group--start">
        <NuxtLink class="mbl-button" :to="localePath('/log')">
          {{ t('reading_log') }}
          <caret-right-icon style="margin-left: 0.2rem;" />
        </NuxtLink>
      </div>
    </header>
    <div>
      <div v-if="!bookReports.length" class="loading-card">
        <strong>{{ t('loading') }}</strong>
      </div>
      <div
        v-for="bookReport in bookReports"
        :key="bookReport.bookIndex"
        class="book-card mbl-card"
        data-testid="book-card"
        :data-book-index="bookReport.bookIndex"
        :data-complete="bookReport.complete || undefined"
      >
        <div class="book-card--header" @click="toggleBook(bookReport.bookIndex)">
          <div class="book-card--completion-indicator">
            <checkmark-icon v-if="bookReport.complete" width="100%" height="100%" />
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
          >
            <triangle-down-icon width="2rem" height="2rem" />
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
              <!-- Kept mounted (transparent) when incomplete: the svg is what gives the cell its height. -->
              <checkmark-icon
                v-else
                width="100%"
                height="100%"
                :stroke="chapterReport.complete ? 'var(--mbl-success-bright)' : 'transparent'"
                :draw="justCompletedChapter === `${bookReport.bookIndex}.${chapterReport.chapterIndex}`"
              />
              <particle-burst
                v-if="justCompletedChapter === `${bookReport.bookIndex}.${chapterReport.chapterIndex}`"
                :count="8"
                :min-distance="20"
                :max-distance="40"
                :min-size="5"
                :max-size="12"
                :end-scale="0.9"
                :delay-ms="CHECKMARK_DRAW_MS"
                :duration-ms="700"
                color="var(--mbl-success-bright)"
                alt-color="var(--mbl-success)"
              />
            </div>
            <div class="chapter-card--chapter-number">
              {{ chapterReport.chapterIndex }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible, BrowserCache, computeBibleProgress } from '@mybiblelog/shared';
import BusyBar from '~/components/ui/BusyBar.vue';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import ParticleBurst from '~/components/ui/ParticleBurst.vue';
import ReadingTrackerResetCard from '~/components/ui/ReadingTrackerResetCard.vue';
import CaretRightIcon from '~/components/svg/CaretRightIcon.vue';
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';
import TriangleDownIcon from '~/components/svg/TriangleDownIcon.vue';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAppInitStore } from '~/stores/app-init';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });
const { t, locale } = useI18n();
useHead({ title: () => t('chapter_checklist') });

const localePath = useLocalePath();

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
const bookReports = ref<BookReport[]>([]);

const bookCount = Bible.getBookCount();
const expandedBooks = ref<Record<number, boolean>>({});
for (let i = 1; i <= bookCount; i++) {
  expandedBooks.value[i] = false;
}

const busy = computed(() => Boolean(busyChapter.value || computeBusy.value));

// Only a chapter marked read *in this session* celebrates; everything rendered
// from the progress snapshot on load stays static. `justCompletedChapter` holds
// the one `bookIndex.chapterIndex` currently animating.
// CHECKMARK_DRAW_MS matches the `checkmark-draw` duration in CheckmarkIcon.vue
// and is handed to ParticleBurst as its delay, so the dots leave the mark just
// as the stroke lands. CELEBRATION_MS covers that plus the burst's own jitter
// and 700ms flight, with a little buffer.
const CHECKMARK_DRAW_MS = 400;
const CELEBRATION_MS = 1600;
const justCompletedChapter = ref<string | null>(null);
let celebrationTimer: ReturnType<typeof setTimeout> | null = null;

function endCelebration() {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
    celebrationTimer = null;
  }
  justCompletedChapter.value = null;
}

function celebrateChapter(key: string) {
  endCelebration();
  justCompletedChapter.value = key;
  celebrationTimer = setTimeout(() => {
    celebrationTimer = null;
    justCompletedChapter.value = null;
  }, CELEBRATION_MS);
}

// Per-book/chapter completion comes straight from the shared progress snapshot
// (a single consolidation of the log entries); the view only resolves book
// names, which `computeBibleProgress` leaves out so its output stays
// locale-independent.
function getBookReports() {
  computeBusy.value = true;

  const cached = BrowserCache.get(CACHE_KEY);
  if (cached) {
    bookReports.value = JSON.parse(cached) as BookReport[];
  }

  const progress = computeBibleProgress(logEntriesStore.currentLogEntries);
  const reports: BookReport[] = progress.books.map(book => ({
    bookIndex: book.bookIndex,
    bookName: Bible.getBookName(book.bookIndex, locale.value),
    totalChapters: book.totalChapters,
    chaptersRead: book.chaptersRead,
    percentage: book.percentage,
    complete: book.complete,
    chapterReports: book.chapters.map(chapter => ({
      bookIndex: book.bookIndex,
      chapterIndex: chapter.chapterIndex,
      complete: chapter.complete,
    })),
  }));

  BrowserCache.set(CACHE_KEY, JSON.stringify(reports), CACHE_MINUTES);
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
  // Don't let a still-running celebration bleed into the next interaction.
  endCelebration();

  const date = dayjs().format('YYYY-MM-DD');
  const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
  const endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, Bible.getChapterVerseCount(bookIndex, chapterIndex));

  const isComplete = bookReports.value
    .find(report => report.bookIndex === bookIndex)?.chapterReports
    .find(chapterReport => chapterReport.chapterIndex === chapterIndex)?.complete === true;
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
      // Completion is verse-coverage based, so a chapter can read as complete
      // without having an entry of its own to delete. Name the actual reason:
      // covered by a wider entry logged today, or covered only by earlier dates.
      const loggedToday = Bible.filterRangesByBookChapter(
        bookIndex,
        chapterIndex,
        logEntriesStore.currentLogEntries.filter(logEntry => logEntry.date === date),
      ).length > 0;
      toastStore.add({ type: 'info', text: t(loggedToday ? 'logged_in_longer_passage' : 'logged_before_today') });
    }
  }
  else {
    const createdEntry = await logEntriesStore.createLogEntry({ date, startVerseId, endVerseId });
    if (createdEntry) {
      await getBookReports();
      // Flagged before `busyChapter` clears below, so the checkmark replaces the
      // spinner in a single render with `draw` already true — the animation runs
      // off a freshly mounted element rather than a class toggle.
      celebrateChapter(`${bookIndex}.${chapterIndex}`);
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

onBeforeUnmount(endCelebration);
</script>

<style scoped>
.loading-card {
  padding: var(--mbl-space-md) var(--mbl-space-2xl);
  border-radius: var(--mbl-radius-card);
  box-shadow: var(--mbl-shadow-card);
  margin: var(--mbl-space-xs) 0;
}

.book-card {
  user-select: none;
  margin: var(--mbl-space-xs) 0;
}

/* Sticky inside the card, so the book stays identified while its chapter grid
   scrolls past; needs its own background and matching top corners to cover the
   chapters and stay flush with the card it sits in. */
.book-card--header {
  display: grid;
  grid-template-columns: 2rem 1fr 1fr 2rem;
  grid-template-rows: auto auto;
  padding: var(--mbl-space-xs);
  background: var(--mbl-bg-elevated);
  border-radius: var(--mbl-radius-card);
  font-size: 0.8rem;
  font-weight: bold;
  position: sticky;
  top: var(--site-nav-height);
  z-index: 1;
  cursor: pointer;
  transition: background-color 0.2s;
}
.book-card--header:hover { background: var(--mbl-bg-hover-light); }
.book-card--completion-indicator { grid-area: 1 / 1 / 3 / 2; width: 1.5rem; margin-right: var(--mbl-space-xs); display: flex; }
.book-card--book-name { grid-area: 1 / 2 / 2 / 3; }
.book-card--completion-fraction { grid-area: 1 / 3 / 2 / 4; text-align: right; }
.book-card--completion-bar { grid-area: 2 / 2 / 3 / 4; }
.book-card--chapter-toggle { grid-area: 1 / 4 / 3 / 5; display: flex; }
.book-card--chapter-toggle.flipped { transform: rotate(180deg); }

.book-card--chapters {
  display: grid;
  gap: var(--mbl-space-xs);
  grid-template-columns: repeat(5, 1fr);
  padding: var(--mbl-space-xs);
}

@mixin mbl-tablet { .book-card--chapters { grid-template-columns: repeat(6, 1fr); } }

@mixin mbl-desktop { .book-card--chapters { grid-template-columns: repeat(8, 1fr); } }

@media screen and (min-width: 1216px) { .book-card--chapters { grid-template-columns: repeat(10, 1fr); } }

@media screen and (min-width: 1408px) { .book-card--chapters { grid-template-columns: repeat(12, 1fr); } }

.chapter-card {
  padding: var(--mbl-space-xs);
  background: var(--mbl-bg);
  border-radius: var(--mbl-radius-xl);
  border: 1px solid var(--mbl-border);
  position: relative;
  cursor: pointer;
  transition: 0.1s;
}
.chapter-card:hover { transition: 0.2s; background: var(--mbl-bg-hover-light); }

/* Positioning context for the completion burst, so the particles fire from the
   centre of the checkmark rather than the centre of the whole cell. Particles
   from the top grid row pass behind the sticky book header (z-index 1); that
   reads as depth, and raising the burst above it would put dots over the title. */
.chapter-card--completion-indicator { position: relative; }
.chapter-card--chapter-number { text-align: center; font-weight: bold; }
</style>

<i18n lang="json">
{
  "en": {
    "chapter_checklist": "Chapter Checklist",
    "reading_log": "Log",
    "loading": "Loading...",
    "logged_before_today": "This chapter was logged before today. You can edit previous log entries on the Calendar page.",
    "logged_in_longer_passage": "This chapter was logged as part of a longer passage, so it can't be unchecked here. You can edit that log entry on the Calendar page.",
    "unable_to_mark_complete": "Unable to mark the chapter complete.",
    "unable_to_mark_incomplete": "Unable to mark the chapter incomplete."
  },
  "de": {
    "chapter_checklist": "Kapitelliste",
    "reading_log": "Lesejournal",
    "loading": "Laden...",
    "logged_before_today": "Dieses Kapitel wurde vor heute protokolliert. Sie können frühere Protokolleinträge auf der Kalenderseite bearbeiten.",
    "logged_in_longer_passage": "Dieses Kapitel wurde als Teil eines längeren Abschnitts protokolliert und kann hier nicht abgewählt werden. Sie können diesen Eintrag auf der Kalenderseite bearbeiten.",
    "unable_to_mark_complete": "Kann das Kapitel nicht als abgeschlossen markieren.",
    "unable_to_mark_incomplete": "Kann das Kapitel nicht als unvollständig markieren."
  },
  "es": {
    "chapter_checklist": "Lista de capítulos",
    "reading_log": "Diario",
    "loading": "Cargando...",
    "logged_before_today": "Este capítulo se registró antes de hoy. Puede editar las entradas de registro anteriores en la página del calendario.",
    "logged_in_longer_passage": "Este capítulo se registró como parte de un pasaje más largo, por lo que no se puede desmarcar aquí. Puede editar esa entrada en la página del calendario.",
    "unable_to_mark_complete": "No se puede marcar el capítulo como completo.",
    "unable_to_mark_incomplete": "No se puede marcar el capítulo como incompleto."
  },
  "fr": {
    "chapter_checklist": "Liste de contrôle",
    "reading_log": "Journal",
    "loading": "Chargement...",
    "logged_before_today": "Ce chapitre a été enregistré avant aujourd'hui. Vous pouvez modifier les entrées de journal précédentes sur la page du calendrier.",
    "logged_in_longer_passage": "Ce chapitre a été enregistré dans le cadre d'un passage plus long ; il ne peut donc pas être décoché ici. Vous pouvez modifier cette entrée sur la page du calendrier.",
    "unable_to_mark_complete": "Impossible de marquer le chapitre comme terminé.",
    "unable_to_mark_incomplete": "Impossible de marquer le chapitre comme incomplet."
  },
  "ko": {
    "chapter_checklist": "장별 체크",
    "reading_log": "읽기 일지",
    "loading": "불러오는 중…",
    "logged_before_today": "이 장은 오늘 이전에 기록되었습니다. 달력 페이지에서 이전 기록을 수정할 수 있습니다.",
    "logged_in_longer_passage": "이 장은 더 긴 본문의 일부로 기록되어 여기서 선택을 해제할 수 없습니다. 달력 페이지에서 해당 기록을 수정할 수 있습니다.",
    "unable_to_mark_complete": "해당 장을 읽기 완료로 표시할 수 없습니다.",
    "unable_to_mark_incomplete": "해당 장을 읽지 않음으로 표시할 수 없습니다."
  },
  "pt": {
    "chapter_checklist": "Lista de Capítulos",
    "reading_log": "Diário",
    "loading": "Carregando...",
    "logged_before_today": "Este capítulo foi registrado antes de hoje. Você pode editar entradas de log anteriores na página do Calendário.",
    "logged_in_longer_passage": "Este capítulo foi registrado como parte de uma passagem maior, portanto não pode ser desmarcado aqui. Você pode editar essa entrada na página do Calendário.",
    "unable_to_mark_complete": "Não é possível marcar o capítulo como completo.",
    "unable_to_mark_incomplete": "Não é possível marcar o capítulo como incompleto."
  },
  "uk": {
    "chapter_checklist": "Перелік розділів",
    "reading_log": "Журнал",
    "loading": "Завантаження...",
    "logged_before_today": "Цей розділ був зареєстрований до сьогодні. Ви можете редагувати попередні записи в календарній сторінці.",
    "logged_in_longer_passage": "Цей розділ було зареєстровано як частину довшого уривка, тому його не можна зняти тут. Ви можете редагувати цей запис на сторінці Календаря.",
    "unable_to_mark_complete": "Не вдалося позначити розділ як завершений.",
    "unable_to_mark_incomplete": "Не вдалося позначити розділ як незавершений."
  }
}
</i18n>
