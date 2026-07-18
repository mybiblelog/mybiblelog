<template>
  <div class="content-column">
    <busy-bar :busy="loadingReadingSuggestions && !readingSuggestions.length" />
    <header class="page-header">
      <h1 class="mbl-title">
        {{ t('today') }}
      </h1>
      <button class="mbl-button mbl-button--primary" :disabled="!hydrated" @click="openAddEntryForm">
        {{ t('add_entry') }}
      </button>
    </header>
    <br>
    <div class="today-page__progress-bar-container" data-screenshot="daily-goal">
      <double-progress-bar :primary-percentage="dailyGoalPercentCompleteNew" :secondary-percentage="dailyGoalPercentComplete" />
      <div class="mbl-level mbl-level--mobile">
        <div class="mbl-level-left">
          <div class="mbl-level-item">
            <span
              v-if="userSettings.dailyVerseCountGoal"
              data-testid="daily-goal-summary"
              :data-verses-read="newVersesReadToday"
              :data-goal="userSettings.dailyVerseCountGoal"
            >
              {{ t('new_verses_read', [newVersesReadToday, userSettings.dailyVerseCountGoal]) }}
            </span>
            <span v-else>{{ t('loading') }}</span>
          </div>
        </div>
        <div class="mbl-level-right">
          <div class="mbl-level-item">
            <span>{{ $n(dailyGoalPercentCompleteNew / 100, 'percent') }}</span>
          </div>
        </div>
      </div>
    </div>
    <reading-tracker-reset-card />
    <div class="entry-container" role="list" data-testid="log-entries">
      <ClientOnly>
        <log-entry
          v-for="entry of logEntriesForToday"
          :key="entry.id"
          role="listitem"
          :passage="entry"
          :actions="actionsForTodayLogEntry(entry)"
        />
        <skeleton-loader
          v-if="loadingLogEntries && !logEntriesForToday.length"
          key="loading"
        />
        <log-entry
          v-if="!loadingLogEntries && !logEntriesForToday.length"
          key="no-entries"
          role="listitem"
          :message="t('no_entries')"
        />
        <template #fallback>
          <skeleton-loader />
        </template>
      </ClientOnly>
    </div>
    <br>
    <div data-testid="reading-suggestions-section">
      <h3 class="mbl-title mbl-title--5">
        {{ t('reading_suggestions') }}
      </h3>
      <div class="entry-container" role="list" data-testid="reading-suggestions">
        <ClientOnly>
          <log-entry
            v-for="(passage, index) of readingSuggestionsWithNewVerseCounts"
            :key="`${index}-${passage.startVerseId}-${passage.endVerseId}`"
            role="listitem"
            :message="passage.suggestionContext"
            :passage="passage"
            :actions="actionsForReadingSuggestionPassage(passage)"
          />
          <skeleton-loader
            v-if="loadingReadingSuggestions && !readingSuggestions.length"
            key="loading"
            :count="3"
          />
          <log-entry
            v-if="!loadingReadingSuggestions && !readingSuggestions.length"
            key="no-suggestions"
            role="listitem"
            :message="t('no_suggestions')"
          />
          <template #fallback>
            <skeleton-loader :count="3" />
          </template>
        </ClientOnly>
      </div>
      <div class="mbl-text-center" style="margin-top: 1rem;">
        <NuxtLink class="mbl-button mbl-button--light" :to="localePath('/log')">
          {{ t('view_all_reading') }}
        </NuxtLink>
      </div>
    </div>
    <br>
    <div class="mbl-level mbl-level--mobile">
      <div class="mbl-level-left">
        <div class="mbl-level-item">
          <h3 class="mbl-title mbl-title--5">
            {{ t('recent_notes') }}
          </h3>
        </div>
      </div>
      <div class="mbl-level-right">
        <div class="mbl-level-item">
          <button class="mbl-button mbl-button--primary" @click="openNewNoteEditor">
            {{ t('new_note') }}
          </button>
        </div>
      </div>
    </div>
    <div class="today-page__recent-notes-container" role="list" data-testid="recent-notes">
      <ClientOnly>
        <skeleton-loader
          v-if="passageNotesStore.loading && !recentNotes.length"
          variant="note"
          :count="3"
        />
        <template v-else-if="!recentNotes.length">
          <log-entry :message="t('no_recent_notes')" role="listitem" />
        </template>
        <template v-else>
          <passage-note
            v-for="note in recentNotes"
            :key="note.id"
            :note="note"
            :actions="actionsForRecentNote(note)"
            :get-reading-url="userSettingsStore.getReadingUrl"
            role="listitem"
            data-testid="recent-note"
          />
          <div class="mbl-text-center" style="margin-top: 1rem;">
            <NuxtLink class="mbl-button mbl-button--light" :to="localePath('/notes')">
              {{ t('view_all_notes') }}
            </NuxtLink>
          </div>
        </template>
        <template #fallback>
          <skeleton-loader variant="note" :count="3" />
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
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import LogEntry from '~/components/log/LogEntry.vue';
import PassageNote from '~/components/notes/PassageNote.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useReadingSuggestionsStore } from '~/stores/reading-suggestions';
import type { ReadingSuggestionPassage } from '~/stores/reading-suggestions';
import { usePassageNotesStore, type PassageNoteListItem } from '~/stores/passage-notes';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

definePageMeta({ middleware: ['auth'] });
useHead({ title: () => t('today') });

const appInitStore = useAppInitStore();
const logEntriesStore = useLogEntriesStore();
const dateVerseCountsStore = useDateVerseCountsStore();
const logEntryEditorStore = useLogEntryEditorStore();
const readingSuggestionsStore = useReadingSuggestionsStore();
const passageNotesStore = usePassageNotesStore();
const passageNoteEditorStore = usePassageNoteEditorStore();
const userSettingsStore = useUserSettingsStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();
const { openPassageInBible } = useOpenInBible();

const hydrated = useHydrated();
const loadingLogEntries = ref(true);
const loadingReadingSuggestions = ref(true);

const userSettings = computed(() => userSettingsStore.settings);
const logEntries = computed(() => logEntriesStore.currentLogEntries);
const addNewVerseCountToReadingSuggestion = (passage: Passage) => {
  const today = dayjs().format('YYYY-MM-DD');
  const throughToday = logEntries.value.filter(e => e.date <= today);
  const uniqueToday = Bible.countUniqueRangeVerses(throughToday);
  const newVerseCount = Bible.countUniqueRangeVerses([...throughToday, passage]) - uniqueToday;
  return { ...passage, newVerseCount };
};

const readingSuggestions = computed(() => readingSuggestionsStore.passages);
const readingSuggestionsWithNewVerseCounts = computed(() =>
  readingSuggestionsStore.passages.map(addNewVerseCountToReadingSuggestion),
);
const recentNotes = computed(() => passageNotesStore.passageNotes.slice(0, 3));

const logEntriesForToday = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  return logEntries.value
    .filter(entry => entry.date === today)
    .map(entry => addNewVerseCountToLogEntry(entry));
});

const versesReadToday = computed(() => Bible.countUniqueRangeVerses(logEntriesForToday.value));

const newVersesReadToday = computed(() =>
  dateVerseCountsStore.getDateVerseCounts(dayjs().format('YYYY-MM-DD')).unique,
);

const dailyGoalPercentComplete = computed(() => {
  if (!userSettings.value.dailyVerseCountGoal) { return 0; }
  const pct = versesReadToday.value / userSettings.value.dailyVerseCountGoal * 100;
  return Number(pct.toFixed(0));
});

const dailyGoalPercentCompleteNew = computed(() => {
  if (!userSettings.value.dailyVerseCountGoal) { return 0; }
  const pct = newVersesReadToday.value / userSettings.value.dailyVerseCountGoal * 100;
  return Number(pct.toFixed(0));
});

type LogEntryLike = { id: number | string; date: string; startVerseId: number; endVerseId: number };

const addNewVerseCountToLogEntry = (logEntry: LogEntryLike) => {
  const today = dayjs().format('YYYY-MM-DD');
  const throughYesterday = logEntries.value.filter(e => e.date < today);
  const uniqueYesterday = Bible.countUniqueRangeVerses(throughYesterday);
  throughYesterday.push(logEntry);
  const newVerseCount = Bible.countUniqueRangeVerses(throughYesterday) - uniqueYesterday;
  return { ...logEntry, newVerseCount };
};

type Passage = ReadingSuggestionPassage & { newVerseCount?: number };

const actionsForReadingSuggestionPassage = (passage: Passage) => [
  { label: t('open_bible'), callback: () => openPassageInBible(passage) },
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

const continueReadingPassage = (passage: { endVerseId: number }) => {
  const nextVerseId = Bible.getNextVerseId(passage.endVerseId, true);
  if (!nextVerseId) { return; }
  const { book, chapter } = Bible.parseVerseId(nextVerseId);
  openPassageInBible({
    startVerseId: nextVerseId,
    endVerseId: Bible.getLastBookChapterVerseId(book, chapter),
  });
};

const trackPassage = (passage: Passage) => {
  logEntryEditorStore.openEditor({
    id: null,
    date: dayjs().format('YYYY-MM-DD'),
    startVerseId: passage.startVerseId,
    endVerseId: passage.endVerseId,
  });
};

const takeNoteOnPassage = (passage: Passage) => {
  const { startVerseId, endVerseId } = passage;
  passageNoteEditorStore.openEditor({ passages: [{ startVerseId, endVerseId }], content: '' });
};

const viewNotesForPassage = (passage: Passage) => {
  const { startVerseId, endVerseId } = passage;
  const q = encodePassageNotesQueryToRoute({
    filterPassageStartVerseId: startVerseId,
    filterPassageEndVerseId: endVerseId,
    offset: 0,
  });
  router.push({ path: localePath('/notes'), query: q as Record<string, string | string[]> });
};

const { actionsForLogEntry: actionsForTodayLogEntry } = useLogEntryActions<LogEntryLike>(t, {
  openInBible: openPassageInBible,
  continueReading: continueReadingPassage,
  takeNote: takeNoteOnPassage,
  viewNotes: viewNotesForPassage,
  edit: openEditEntryForm,
  remove: deleteEntry,
});

const openNewNoteEditor = () => {
  passageNoteEditorStore.openEditor();
};

const actionsForRecentNote = (note: PassageNoteListItem) => [
  { label: t('edit'), callback: () => passageNoteEditorStore.openEditor(note as Parameters<typeof passageNoteEditorStore.openEditor>[0]) },
  { label: t('delete'), callback: () => deletePassageNote(note.id) },
];

const deletePassageNote = async (id: number | string) => {
  const confirmed = await dialogStore.confirm({
    message: t('are_you_sure_you_want_to_delete_this_note'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await passageNotesStore.deletePassageNote(id);
  if (!success) {
    toastStore.add({ type: 'error', text: t('the_note_could_not_be_deleted') });
  }
};

onMounted(async () => {
  try {
    await appInitStore.loadUserData();
  }
  finally {
    loadingLogEntries.value = false;
  }
  setTimeout(() => {
    dateVerseCountsStore.cacheDateVerseCounts();
  }, 0);
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
</style>

<i18n lang="json">
{
  "en": {
    "today": "Today",
    "add_entry": "Add Entry",
    "new_verses_read": "{0} / {1} new verses",
    "loading": "Loading...",
    "edit": "Edit",
    "delete": "Delete",
    "take_note": "Take Note",
    "view_notes": "View Notes",
    "no_entries": "No Entries",
    "view_all_reading": "View All Reading",
    "reading_suggestions": "Reading Suggestions",
    "open_bible": "Open Bible",
    "continue_reading": "Continue Reading",
    "log_reading": "Log Reading",
    "no_suggestions": "No Suggestions",
    "are_you_sure_you_want_to_delete_this_entry": "Are you sure you want to delete this entry?",
    "the_log_entry_could_not_be_deleted": "The log entry could not be deleted.",
    "are_you_sure_you_want_to_delete_this_note": "Are you sure you want to delete this note?",
    "the_note_could_not_be_deleted": "The note could not be deleted.",
    "recent_notes": "Recent Notes",
    "no_recent_notes": "No Notes",
    "new_note": "New Note",
    "view_all_notes": "View All Notes"
  },
  "de": {
    "today": "Heute",
    "add_entry": "Eintrag hinzufügen",
    "new_verses_read": "{0} / {1} neue Versetze",
    "loading": "Lädt...",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "take_note": "Notiz hinzufügen",
    "view_notes": "Notizen ansehen",
    "no_entries": "Keine Einträge",
    "view_all_reading": "Alle Lesungen ansehen",
    "reading_suggestions": "Lesevorschläge",
    "open_bible": "Bibel öffnen",
    "continue_reading": "Weiterlesen",
    "log_reading": "Lesung hinzufügen",
    "no_suggestions": "Keine Vorschläge",
    "are_you_sure_you_want_to_delete_this_entry": "Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?",
    "the_log_entry_could_not_be_deleted": "Der Eintrag konnte nicht gelöscht werden.",
    "are_you_sure_you_want_to_delete_this_note": "Sind Sie sicher, dass Sie diese Notiz löschen möchten?",
    "the_note_could_not_be_deleted": "Die Notiz konnte nicht gelöscht werden.",
    "recent_notes": "Letzte Notizen",
    "no_recent_notes": "Keine Notizen",
    "new_note": "Neue Notiz",
    "view_all_notes": "Alle Notizen ansehen"
  },
  "es": {
    "today": "Hoy",
    "add_entry": "Añadir entrada",
    "new_verses_read": "{0} / {1} versículos nuevos",
    "loading": "Cargando...",
    "edit": "Editar",
    "delete": "Borrar",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "no_entries": "No hay entradas",
    "view_all_reading": "Ver toda la lectura",
    "reading_suggestions": "Sugerencias de Lectura",
    "open_bible": "Abrir en la Biblia",
    "continue_reading": "Seguir leyendo",
    "log_reading": "Agregar lectura",
    "no_suggestions": "No hay sugerencias",
    "are_you_sure_you_want_to_delete_this_entry": "¿Estás seguro de que quieres borrar esta entrada?",
    "the_log_entry_could_not_be_deleted": "No se pudo borrar la entrada del registro.",
    "are_you_sure_you_want_to_delete_this_note": "¿Estás seguro de que quieres borrar esta nota?",
    "the_note_could_not_be_deleted": "No se pudo borrar la nota.",
    "recent_notes": "Notas Recientes",
    "no_recent_notes": "Sin Notas",
    "new_note": "Nueva Nota",
    "view_all_notes": "Ver Todas las Notas"
  },
  "fr": {
    "today": "Aujourd'hui",
    "add_entry": "Ajouter une entrée",
    "new_verses_read": "{0} / {1} nouveaux versets",
    "loading": "Chargement...",
    "edit": "Éditer",
    "delete": "Supprimer",
    "take_note": "Prendre note",
    "view_notes": "Voir les notes",
    "no_entries": "Pas d'entrées",
    "view_all_reading": "Voir toute la lecture",
    "reading_suggestions": "Suggestions de Lecture",
    "open_bible": "Ouvrir dans la Bible",
    "continue_reading": "Continuer la lecture",
    "log_reading": "Ajouter une lecture",
    "no_suggestions": "Aucune suggestion",
    "are_you_sure_you_want_to_delete_this_entry": "Êtes-vous sûr de vouloir supprimer cette entrée?",
    "the_log_entry_could_not_be_deleted": "L'entrée du journal n'a pas pu être supprimée.",
    "are_you_sure_you_want_to_delete_this_note": "Êtes-vous sûr de vouloir supprimer cette note?",
    "the_note_could_not_be_deleted": "La note n'a pas pu être supprimée.",
    "recent_notes": "Notes Récentes",
    "no_recent_notes": "Aucune Note",
    "new_note": "Nouvelle Note",
    "view_all_notes": "Voir Toutes les Notes"
  },
  "ko": {
    "today": "오늘의 성경",
    "add_entry": "기록 추가",
    "new_verses_read": "새로 읽은 구절 {0} / {1}",
    "loading": "불러오는 중…",
    "edit": "편집",
    "delete": "삭제",
    "take_note": "노트 작성",
    "view_notes": "노트 보기",
    "no_entries": "항목 없음",
    "view_all_reading": "모든 기록 보기",
    "reading_suggestions": "읽기 제안",
    "open_bible": "성경 열기",
    "continue_reading": "이어서 읽기",
    "log_reading": "기록 추가",
    "no_suggestions": "제안 없음",
    "are_you_sure_you_want_to_delete_this_entry": "해당 항목을 삭제할까요?",
    "the_log_entry_could_not_be_deleted": "읽기 기록을 삭제할 수 없습니다.",
    "are_you_sure_you_want_to_delete_this_note": "이 노트를 삭제할까요?",
    "the_note_could_not_be_deleted": "노트를 삭제할 수 없습니다.",
    "recent_notes": "최근 노트",
    "no_recent_notes": "노트 없음",
    "new_note": "노트 작성",
    "view_all_notes": "모든 노트 보기"
  },
  "pt": {
    "today": "Hoje",
    "add_entry": "Adicionar Entrada",
    "new_verses_read": "{0} / {1} novos versículos",
    "loading": "Carregando...",
    "edit": "Editar",
    "delete": "Excluir",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "no_entries": "Sem Entradas",
    "view_all_reading": "Ver toda a leitura",
    "reading_suggestions": "Sugestões de Leitura",
    "open_bible": "Ler na Biblia",
    "continue_reading": "Continuar lendo",
    "log_reading": "Adicionar uma leitura",
    "no_suggestions": "Sem sugestões",
    "are_you_sure_you_want_to_delete_this_entry": "Tem certeza de que deseja excluir esta entrada?",
    "the_log_entry_could_not_be_deleted": "A entrada do registro não pôde ser excluída.",
    "are_you_sure_you_want_to_delete_this_note": "Tem certeza de que deseja excluir esta nota?",
    "the_note_could_not_be_deleted": "A nota não pôde ser excluída.",
    "recent_notes": "Notas Recentes",
    "no_recent_notes": "Sem Notas",
    "new_note": "Nova Nota",
    "view_all_notes": "Ver Todas as Notas"
  },
  "uk": {
    "today": "Сьогодні",
    "add_entry": "Додати запис",
    "new_verses_read": "{0} / {1} нових віршів",
    "loading": "Завантаження...",
    "edit": "Редагувати",
    "delete": "Видалити",
    "take_note": "Записати",
    "view_notes": "Переглянути записи",
    "no_entries": "Немає записів",
    "view_all_reading": "Переглянути все читання",
    "reading_suggestions": "Рекомендації для Читання",
    "open_bible": "Читати в Біблії",
    "continue_reading": "Продовжити читання",
    "log_reading": "Додати читання",
    "no_suggestions": "Немає рекомендацій",
    "are_you_sure_you_want_to_delete_this_entry": "Ви впевнені, що хочете видалити цей запис?",
    "the_log_entry_could_not_be_deleted": "Не вдалося видалити запис.",
    "are_you_sure_you_want_to_delete_this_note": "Ви впевнені, що хочете видалити цю нотатку?",
    "the_note_could_not_be_deleted": "Не вдалося видалити нотатку.",
    "recent_notes": "Останні Нотатки",
    "no_recent_notes": "Немає Нотаток",
    "new_note": "Нова Нотатка",
    "view_all_notes": "Переглянути Всі Нотатки"
  }
}
</i18n>
