<template>
  <div class="content-column">
    <client-only>
      <busy-bar :busy="dateVerseCountsBusy" />
      <div id="calendar-page">
        <calendar-month :get-date-verse-counts="getDateVerseCounts" :daily-verse-count-goal="userSettings.dailyVerseCountGoal" @daySelected="selectDate" />
        <div v-if="currentDate" class="entry-container" data-testid="calendar-day-entries" :data-date="entryDate.date">
          <div class="entry-date">
            <div>
              <div class="date" data-testid="calendar-selected-date">
                {{ displayDate(entryDate.date) }}
              </div>
              <div class="verse-count" data-testid="calendar-selected-verse-count" :data-verse-count="entryDate.verses">
                {{ entryDate.verses }} {{ $tc('verse', entryDate.verses) }}
              </div>
            </div>
            <button class="mbl-button mbl-button--sm calendar-page__add-entry-button" data-testid="calendar-add-entry" @click="openAddEntryFormForDate(entryDate.date)">
              +
            </button>
          </div>
          <log-entry v-for="entry of entryDate.entries" :key="entry.id" :passage="entry" :actions="actionsForLogEntry(entry)" />
          <div v-if="!entryDate.entries.length" class="calendar-page__no-entries">
            {{ $t('no_entries') }}
          </div>
        </div>
      </div>
    </client-only>
  </div>
</template>

<script>
import * as dayjs from 'dayjs';
import { Bible, displayDate } from '@mybiblelog/shared';
import BusyBar from '@/components/BusyBar';
import CalendarMonth from '@/components/calendar/CalendarMonth';
import LogEntry from '@/components/LogEntry';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useLogEntriesStore } from '~/stores/log-entries';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useAppInitStore } from '~/stores/app-init';

export default {
  name: 'CalendarPage',
  components: {
    BusyBar,
    CalendarMonth,
    LogEntry,
  },
  middleware: ['auth'],
  data() {
    return {
      currentDate: null,
    };
  },
  async fetch() {
    await useAppInitStore().loadUserData();
  },
  head() {
    return {
      title: this.$t('page_title'),
    };
  },
  computed: {
    dateVerseCountsStore() {
      return useDateVerseCountsStore();
    },
    dateVerseCountsBusy() {
      return this.dateVerseCountsStore.busy;
    },
    getDateVerseCounts() {
      return this.dateVerseCountsStore.getDateVerseCounts;
    },
    logEntriesStore() {
      return useLogEntriesStore();
    },
    userSettingsStore() {
      return useUserSettingsStore();
    },
    userSettings() {
      return this.userSettingsStore.settings;
    },
    logEntries() {
      return this.logEntriesStore.logEntries;
    },
    entryDate() {
      const dateLogEntries = [];
      let dateVerses = 0;
      for (const logEntry of this.logEntries) {
        if (logEntry.date === this.currentDate) {
          dateLogEntries.push(logEntry);
          dateVerses += Bible.countRangeVerses(logEntry.startVerseId, logEntry.endVerseId);
        }
      }
      return {
        date: this.currentDate,
        entries: dateLogEntries,
        verses: dateVerses,
      };
    },
  },
  beforeMount() {
    this.currentDate = dayjs().format('YYYY-MM-DD');
  },
  mounted() {
    setTimeout(() => {
      // dispatch this long-running action in a timeout to prevent blocking
      this.dateVerseCountsStore.cacheDateVerseCounts();
    }, 0);
  },
  methods: {
    displayDate(date) {
      return displayDate(date, this.$i18n.locale);
    },
    actionsForLogEntry(entry) {
      return [
        { label: this.$t('open_bible'), callback: () => this.openPassageInBible(entry) },
        { label: this.$t('take_note'), callback: () => this.takeNoteOnPassage(entry) },
        { label: this.$t('edit'), callback: () => this.openEditEntryForm(entry.id) },
        { label: this.$t('delete'), callback: () => this.deleteEntry(entry.id) },
      ];
    },
    getReadingUrl(bookIndex, chapterIndex) {
      return this.userSettingsStore.getReadingUrl(bookIndex, chapterIndex);
    },
    async deleteEntry(id) {
      const dialogStore = useDialogStore();
      const toastStore = useToastStore();
      const confirmed = await dialogStore.confirm({
        message: this.$t('are_you_sure'),
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }
      const success = await this.logEntriesStore.deleteLogEntry(id);
      if (!success) {
        toastStore.add({
          type: 'error',
          text: this.$t('could_not_delete'),
        });
      }
    },
    openAddEntryFormForDate(date) {
      const logEntryEditorStore = useLogEntryEditorStore();
      logEntryEditorStore.openEditor({ empty: true, date });
    },
    openEditEntryForm(id) {
      const logEntryEditorStore = useLogEntryEditorStore();
      const targetEntry = this.logEntries.find(e => e.id === id);
      const { date, startVerseId, endVerseId } = targetEntry;
      logEntryEditorStore.openEditor({
        id,
        date,
        startVerseId,
        endVerseId,
      });
    },
    openPassageInBible(passage) {
      const { startVerseId } = passage;
      const start = Bible.parseVerseId(startVerseId);
      const url = this.getReadingUrl(start.book, start.chapter);
      window.open(url, '_blank');
    },
    takeNoteOnPassage(passage) {
      const { startVerseId, endVerseId } = passage;
      usePassageNoteEditorStore().openEditor({
        passages: [{ startVerseId, endVerseId }],
        content: '',
      });
    },
    selectDate(date) {
      this.currentDate = date;
    },
  },
};
</script>

<style scoped>

.entry-date {
  border-bottom: 2px solid var(--mbl-link-bright);
  padding: 1rem 0.5rem 0;
  display: flex;
  justify-content: space-between;
  .date {
    display: flex;
    flex-direction: column;
    font-weight: bold;
  }
  .verse-count {
    font-size: 0.8em;
  }
}

.calendar-page__add-entry-button {
  align-self: center;
}

.calendar-page__no-entries {
  padding: 0.5rem;
}
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
    "could_not_delete": "The log entry could not be deleted."
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
    "could_not_delete": "Der Log-Eintrag konnte nicht gelöscht werden."
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
    "could_not_delete": "No se pudo borrar la entrada del registro."
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
    "could_not_delete": "L'entrée du journal n'a pas pu être supprimée."
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
    "could_not_delete": "해당 기록을 삭제할 수 없습니다."
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
    "could_not_delete": "O registro não pôde ser apagado."
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
    "could_not_delete": "Не вдалося видалити запис."
  }
}
</i18n>
