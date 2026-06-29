<template>
  <div class="content-column">
    <ClientOnly>
      <busy-bar :busy="dateVerseCountsStore.busy" />
      <reading-tracker-reset-card />
      <div id="calendar-page">
        <calendar-month
          :get-date-verse-counts="dateVerseCountsStore.getDateVerseCounts"
          :daily-verse-count-goal="userSettings.dailyVerseCountGoal"
          :tracker-start-date="userSettings.lookBackDate"
          @day-selected="selectDate"
        />
        <div
          v-if="currentDate && currentDate === userSettings.lookBackDate"
          class="mbl-message mbl-message--info calendar-page__tracker-start-alert"
        >
          <div class="mbl-message__body">
            {{ t('tracker_start_date_message') }}
          </div>
        </div>
        <div v-if="currentDate" class="entry-container" data-testid="calendar-day-entries" :data-date="entryDate.date">
          <div class="entry-date">
            <div>
              <div class="date" data-testid="calendar-selected-date">
                {{ displayDateFormatted }}
              </div>
              <div class="verse-count" data-testid="calendar-selected-verse-count" :data-verse-count="entryDate.verses">
                {{ entryDate.verses }} {{ t('verse', entryDate.verses) }}
              </div>
            </div>
            <button class="mbl-button mbl-button--sm calendar-page__add-entry-button" data-testid="calendar-add-entry" @click="openAddEntryFormForDate(entryDate.date)">
              +
            </button>
          </div>
          <log-entry v-for="entry of entryDate.entries" :key="entry.id" :passage="entry" :actions="actionsForLogEntry(entry)" />
          <div v-if="!entryDate.entries.length" class="calendar-page__no-entries">
            {{ t('no_entries') }}
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible, displayDate } from '@mybiblelog/shared';
import BusyBar from '~/components/ui/BusyBar.vue';
import CalendarMonth from '~/components/calendar/CalendarMonth.vue';
import LogEntry from '~/components/log/LogEntry.vue';
import ReadingTrackerResetCard from '~/components/ui/ReadingTrackerResetCard.vue';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useLogEntriesStore } from '~/stores/log-entries';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';

definePageMeta({ middleware: ['auth'] });
const { t, locale } = useI18n();
useHead({ title: () => t('page_title') });

const logEntriesStore = useLogEntriesStore();
const userSettingsStore = useUserSettingsStore();
const dateVerseCountsStore = useDateVerseCountsStore();

const userSettings = computed(() => userSettingsStore.settings);
const currentDate = ref<string | null>(null);

const entryDate = computed(() => {
  const dateLogEntries = [];
  let dateVerses = 0;
  for (const logEntry of logEntriesStore.logEntries) {
    if (logEntry.date === currentDate.value) {
      dateLogEntries.push(logEntry);
      dateVerses += Bible.countRangeVerses(logEntry.startVerseId, logEntry.endVerseId);
    }
  }
  return { date: currentDate.value, entries: dateLogEntries, verses: dateVerses };
});

const displayDateFormatted = computed(() => displayDate(currentDate.value ?? '', locale.value));

function actionsForLogEntry(entry: { id: string; startVerseId: string; endVerseId: string; date: string }) {
  return [
    { label: t('open_bible'), callback: () => openPassageInBible(entry) },
    { label: t('take_note'), callback: () => takeNoteOnPassage(entry) },
    { label: t('edit'), callback: () => openEditEntryForm(entry.id) },
    { label: t('delete'), callback: () => deleteEntry(entry.id) },
  ];
}

async function deleteEntry(id: string) {
  const confirmed = await useDialogStore().confirm({
    message: t('are_you_sure'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await logEntriesStore.deleteLogEntry(id);
  if (!success) {
    useToastStore().add({ type: 'error', text: t('could_not_delete') });
  }
}

function openAddEntryFormForDate(date: string | null) {
  useLogEntryEditorStore().openEditor({ empty: true, date: date ?? '' });
}

function openEditEntryForm(id: string) {
  const targetEntry = logEntriesStore.logEntries.find(e => e.id === id);
  if (!targetEntry) { return; }
  const { date, startVerseId, endVerseId } = targetEntry;
  useLogEntryEditorStore().openEditor({ id, date, startVerseId, endVerseId });
}

function openPassageInBible(passage: { startVerseId: string }) {
  const start = Bible.parseVerseId(passage.startVerseId);
  const url = userSettingsStore.getReadingUrl(start.book, start.chapter);
  window.open(url, '_blank');
}

function takeNoteOnPassage(passage: { startVerseId: string; endVerseId: string }) {
  usePassageNoteEditorStore().openEditor({
    passages: [{ startVerseId: passage.startVerseId, endVerseId: passage.endVerseId }],
    content: '',
  });
}

function selectDate(date: string | null) {
  currentDate.value = date;
}

onMounted(async () => {
  currentDate.value = dayjs().format('YYYY-MM-DD');
  await useAppInitStore().loadUserData();
  setTimeout(() => { dateVerseCountsStore.cacheDateVerseCounts(); }, 0);
});
</script>

<style scoped>
.entry-date {
  border-bottom: 2px solid var(--mbl-link-bright);
  padding: 1rem 0.5rem 0;
  display: flex;
  justify-content: space-between;
}
.entry-date .date { display: flex; flex-direction: column; font-weight: bold; }
.entry-date .verse-count { font-size: 0.8em; }
.calendar-page__add-entry-button { align-self: center; }
.calendar-page__no-entries { padding: 0.5rem; }
.calendar-page__tracker-start-alert { margin-top: 0.75rem; }
</style>

<i18n lang="json">
{
  "en": {
    "page_title": "Calendar",
    "verse": "verse | verses",
    "open_bible": "Open Bible",
    "take_note": "Take Note",
    "edit": "Edit",
    "delete": "Delete",
    "no_entries": "No Entries",
    "are_you_sure": "Are you sure you want to delete this entry?",
    "could_not_delete": "The log entry could not be deleted.",
    "tracker_start_date_message": "This is your Tracker Start Date. Log entries before this date are not counted in your progress."
  },
  "de": {
    "page_title": "Kalender",
    "verse": "Vers | Verse",
    "open_bible": "Bibel öffnen",
    "take_note": "Notiz hinzufügen",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "no_entries": "Keine Einträge",
    "are_you_sure": "Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?",
    "could_not_delete": "Der Log-Eintrag konnte nicht gelöscht werden.",
    "tracker_start_date_message": "Dies ist Ihr Tracker-Startdatum. Einträge vor diesem Datum werden nicht in Ihrem Fortschritt gezählt."
  },
  "es": {
    "page_title": "Calendario",
    "verse": "versículo | versículos",
    "open_bible": "Abrir en la Biblia",
    "take_note": "Tomar nota",
    "edit": "Editar",
    "delete": "Borrar",
    "no_entries": "No hay entradas",
    "are_you_sure": "¿Estás seguro de que quieres borrar esta entrada?",
    "could_not_delete": "No se pudo borrar la entrada del registro.",
    "tracker_start_date_message": "Esta es tu Fecha de Inicio del Rastreador. Las entradas anteriores a esta fecha no se cuentan en tu progreso."
  },
  "fr": {
    "page_title": "Calendrier",
    "verse": "verset | versets",
    "open_bible": "Ouvrir dans la Bible",
    "take_note": "Prendre note",
    "edit": "Modifier",
    "delete": "Supprimer",
    "no_entries": "Aucune entrée",
    "are_you_sure": "Êtes-vous sûr de vouloir supprimer cette entrée?",
    "could_not_delete": "L'entrée du journal n'a pas pu être supprimée.",
    "tracker_start_date_message": "Ceci est votre Date de Début du Suivi. Les entrées antérieures à cette date ne sont pas comptées dans votre progression."
  },
  "ko": {
    "page_title": "달력",
    "verse": "절 | 절",
    "open_bible": "성경 열기",
    "take_note": "노트 작성",
    "edit": "편집",
    "delete": "삭제",
    "no_entries": "항목 없음",
    "are_you_sure": "해당 기록을 삭제할까요?",
    "could_not_delete": "해당 기록을 삭제할 수 없습니다.",
    "tracker_start_date_message": "이 날짜는 추적기 시작일입니다. 이 날짜 이전의 기록은 진도에 포함되지 않습니다."
  },
  "pt": {
    "page_title": "Calendário",
    "verse": "versículo | versículos",
    "open_bible": "Ler na Biblia",
    "take_note": "Tomar nota",
    "edit": "Editar",
    "delete": "Apagar",
    "no_entries": "Nenhum registro",
    "are_you_sure": "Tem certeza de que deseja apagar este registro?",
    "could_not_delete": "O registro não pôde ser apagado.",
    "tracker_start_date_message": "Esta é sua Data de Início do Rastreador. Entradas anteriores a esta data não são contadas no seu progresso."
  },
  "uk": {
    "page_title": "Календар",
    "verse": "верс | віршів",
    "open_bible": "Читати в Біблії",
    "take_note": "Записати",
    "edit": "Редагувати",
    "delete": "Видалити",
    "no_entries": "Немає записів",
    "are_you_sure": "Ви впевнені, що хочете видалити цей запис?",
    "could_not_delete": "Не вдалося видалити запис.",
    "tracker_start_date_message": "Це ваша дата початку відстеження. Записи до цієї дати не враховуються у вашому прогресі."
  }
}
</i18n>
