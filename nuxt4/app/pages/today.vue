<template>
  <div class="content-column">
    <BusyBar :busy="loadingReadingSuggestions && !readingSuggestions.length" />
    <header class="page-header">
      <h1 class="mbl-title">
        {{ $t('today') }}
      </h1>
      <button class="mbl-button mbl-button--primary" :disabled="!hydrated" @click="openAddEntryForm">
        {{ $t('add_entry') }}
      </button>
    </header>
    <br>
    <div class="today-page__progress-bar-container" data-screenshot="daily-goal">
      <DoubleProgressBar :primary-percentage="dailyGoalPercentCompleteNew" :secondary-percentage="dailyGoalPercentComplete" />
      <div class="mbl-level mbl-level--mobile">
        <div class="mbl-level-left">
          <div class="mbl-level-item">
            <span
              v-if="userSettings.dailyVerseCountGoal"
              data-testid="daily-goal-summary"
              :data-verses-read="newVersesReadToday"
              :data-goal="userSettings.dailyVerseCountGoal"
            >
              {{ $t('new_verses_read', [newVersesReadToday, userSettings.dailyVerseCountGoal]) }}
            </span>
            <span v-else>{{ $t('loading') }}</span>
          </div>
        </div>
        <div class="mbl-level-right">
          <div class="mbl-level-item">
            <span>{{ $n(dailyGoalPercentCompleteNew / 100, 'percent') }}</span>
          </div>
        </div>
      </div>
    </div>
    <ReadingTrackerResetCard />
    <div class="entry-container" role="list" data-testid="log-entries">
      <ClientOnly>
        <LogEntry
          v-for="entry of logEntriesForToday"
          :key="entry.id"
          role="listitem"
          :passage="entry"
          :actions="actionsForTodayLogEntry(entry)"
        />
        <LogEntry
          v-if="!logEntriesForToday.length"
          key="no-entries"
          role="listitem"
          :message="$t('no_entries')"
        />
      </ClientOnly>
    </div>
    <br>
    <div data-testid="reading-suggestions-section">
      <h3 class="mbl-title mbl-title--5">
        {{ $t('reading_suggestions') }}
      </h3>
      <div class="entry-container" role="list" data-testid="reading-suggestions">
        <ClientOnly>
          <LogEntry
            v-for="(passage, index) of readingSuggestions"
            :key="`${index}-${passage.startVerseId}-${passage.endVerseId}`"
            role="listitem"
            :message="passage.suggestionContext"
            :passage="passage"
            :actions="actionsForReadingSuggestionPassage(passage)"
          />
          <LogEntry
            v-if="loadingReadingSuggestions && !readingSuggestions.length"
            key="loading"
            role="listitem"
            :message="$t('loading')"
          />
          <LogEntry
            v-if="!loadingReadingSuggestions && !readingSuggestions.length"
            key="no-suggestions"
            role="listitem"
            :message="$t('no_suggestions')"
          />
        </ClientOnly>
      </div>
      <div class="mbl-text-center" style="margin-top: 1rem;">
        <NuxtLink class="mbl-button mbl-button--light" :to="localePath('/log')">
          {{ $t('view_all_reading') }}
        </NuxtLink>
      </div>
    </div>
    <br>
    <div class="mbl-level mbl-level--mobile">
      <div class="mbl-level-left">
        <div class="mbl-level-item">
          <h3 class="mbl-title mbl-title--5">
            {{ $t('recent_notes') }}
          </h3>
        </div>
      </div>
      <div class="mbl-level-right">
        <div class="mbl-level-item">
          <button class="mbl-button mbl-button--primary" @click="openNewNoteEditor">
            {{ $t('new_note') }}
          </button>
        </div>
      </div>
    </div>
    <div class="today-page__recent-notes-container" role="list" data-testid="recent-notes">
      <ClientOnly>
        <div v-if="passageNotesStore.loading && !recentNotes.length" class="passage-note">
          <div class="passage-note--content mbl-text-center">{{ $t('loading') }}</div>
        </div>
        <template v-else-if="!recentNotes.length">
          <LogEntry :message="$t('no_recent_notes')" role="listitem" />
        </template>
        <template v-else>
          <div
            v-for="note in recentNotes"
            :key="note.id"
            class="passage-note"
            role="listitem"
            data-testid="recent-note"
          >
            <div class="passage-note--content">{{ note.content }}</div>
          </div>
          <div class="mbl-text-center" style="margin-top: 1rem;">
            <NuxtLink class="mbl-button mbl-button--light" :to="localePath('/notes')">
              {{ $t('view_all_notes') }}
            </NuxtLink>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import BusyBar from '~/components/ui/BusyBar.vue';
import DoubleProgressBar from '~/components/ui/DoubleProgressBar.vue';
import ReadingTrackerResetCard from '~/components/ui/ReadingTrackerResetCard.vue';
import LogEntry from '~/components/log/LogEntry.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useReadingSuggestionsStore } from '~/stores/reading-suggestions';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';

const { t } = useI18n();
const localePath = useLocalePath();

definePageMeta({ middleware: ['auth'] });
useHead({ title: () => t('today') });

const appInitStore = useAppInitStore();
const logEntriesStore = useLogEntriesStore();
const logEntryEditorStore = useLogEntryEditorStore();
const readingSuggestionsStore = useReadingSuggestionsStore();
const passageNotesStore = usePassageNotesStore();
const userSettingsStore = useUserSettingsStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();

const hydrated = ref(false);
const loadingReadingSuggestions = ref(true);

const userSettings = computed(() => userSettingsStore.settings);
const logEntries = computed(() => logEntriesStore.currentLogEntries);
const readingSuggestions = computed(() => readingSuggestionsStore.passages);
const recentNotes = computed(() => passageNotesStore.passageNotes.slice(0, 3));

const logEntriesForToday = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  return logEntries.value
    .filter(entry => entry.date === today)
    .map(entry => addNewVerseCountToLogEntry(entry));
});

const versesReadToday = computed(() => Bible.countUniqueRangeVerses(logEntriesForToday.value));

const newVersesReadToday = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  const throughYesterday = logEntries.value.filter(e => e.date < today);
  const throughToday = logEntries.value.filter(e => e.date <= today);
  return Bible.countUniqueRangeVerses(throughToday) - Bible.countUniqueRangeVerses(throughYesterday);
});

const dailyGoalPercentComplete = computed(() => {
  if (!userSettings.value.dailyVerseCountGoal) { return 0; }
  const pct = versesReadToday.value / userSettings.value.dailyVerseCountGoal * 100;
  return Math.min(100, Number(pct.toFixed(0)));
});

const dailyGoalPercentCompleteNew = computed(() => {
  if (!userSettings.value.dailyVerseCountGoal) { return 0; }
  const pct = newVersesReadToday.value / userSettings.value.dailyVerseCountGoal * 100;
  return Math.min(100, Number(pct.toFixed(0)));
});

type LogEntryLike = { id: number | string; date: string; startVerseId: number; endVerseId: number; [key: string]: unknown };

const addNewVerseCountToLogEntry = (logEntry: LogEntryLike) => {
  const today = dayjs().format('YYYY-MM-DD');
  const throughYesterday = logEntries.value.filter(e => e.date < today);
  const uniqueYesterday = Bible.countUniqueRangeVerses(throughYesterday);
  throughYesterday.push(logEntry);
  const newVerseCount = Bible.countUniqueRangeVerses(throughYesterday) - uniqueYesterday;
  return { ...logEntry, newVerseCount };
};

type Passage = { startVerseId: number; endVerseId: number; [key: string]: unknown };

const actionsForTodayLogEntry = (entry: LogEntryLike) => [
  { label: t('open_bible'), callback: () => openPassageInBible(entry, false) },
  { label: t('take_note'), callback: () => takeNoteOnPassage(entry) },
  { label: t('view_notes'), callback: () => viewNotesForPassage(entry) },
  { label: t('edit'), callback: () => openEditEntryForm(entry.id) },
  { label: t('delete'), callback: () => deleteEntry(entry.id) },
];

const actionsForReadingSuggestionPassage = (passage: Passage) => [
  { label: t('open_bible'), callback: () => openPassageInBible(passage, true) },
  { label: t('log_reading'), callback: () => trackPassage(passage) },
];

const openAddEntryForm = () => {
  logEntryEditorStore.openEditor({ empty: true });
};

const openEditEntryForm = (id: number | string) => {
  const entry = logEntries.value.find(e => e.id === id);
  if (!entry) { return; }
  logEntryEditorStore.openEditor({
    id: entry.id,
    date: entry.date,
    startVerseId: entry.startVerseId,
    endVerseId: entry.endVerseId,
  });
};

const deleteEntry = async (id: number | string) => {
  const confirmed = await dialogStore.confirm({
    message: t('are_you_sure_you_want_to_delete_this_entry'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await logEntriesStore.deleteLogEntry(id);
  if (!success) {
    toastStore.add({ type: 'error', text: t('the_log_entry_could_not_be_deleted') });
  }
};

const openPassageInBible = (passage: Passage, track: boolean) => {
  const { startVerseId } = passage;
  const start = Bible.parseVerseId(startVerseId);
  const url = userSettingsStore.getReadingUrl(start.book, start.chapter);
  window.open(url, '_blank');
  if (track) {
    setTimeout(() => trackPassage(passage), 500);
  }
};

const trackPassage = (passage: Passage) => {
  logEntryEditorStore.openEditor({
    id: null,
    date: dayjs().format('YYYY-MM-DD'),
    startVerseId: passage.startVerseId,
    endVerseId: passage.endVerseId,
  });
};

const takeNoteOnPassage = (_passage: Passage) => {
  // Phase 8: passage note editor
};

const viewNotesForPassage = (_passage: Passage) => {
  // Phase 8: notes page navigation
};

const openNewNoteEditor = () => {
  // Phase 8: passage note editor
};

onMounted(async () => {
  hydrated.value = true;
  await appInitStore.loadUserData();
  readingSuggestionsStore.refreshReadingSuggestions();
  loadingReadingSuggestions.value = false;
  await passageNotesStore.resetQuery({
    limit: 3,
    offset: 0,
    sortOn: 'createdAt',
    sortDirection: 'descending',
  });
});
</script>

<style scoped>
.today-page__progress-bar-container {
  margin-top: -1rem;
  margin-bottom: 1.5rem;
}

.today-page__recent-notes-container {
  margin-top: 1rem;
}

.passage-note {
  display: flex;
  flex-direction: column;
  padding: 1em 0.5em;
  border-radius: 0.25rem;
  background: var(--mbl-bg-elevated);
  box-shadow: var(--mbl-card-shadow);
  margin: 0.5rem 0;
}
</style>
