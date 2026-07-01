<template>
  <button
    class="chapter-report"
    :disabled="!hydrated"
    data-testid="book-report-chapter"
    :data-chapter="report.chapterIndex"
    :data-verses-read="report.versesRead"
    :data-total-verses="report.totalVerses"
    @click="openActionSheet"
  >
    <div class="chapter-report--indicator">
      <div class="chapter-report--indicator--icon">
        <star-icon width="100%" height="100%" :fill="report.percentage === 100 ? 'var(--mbl-star-earned)' : 'var(--mbl-star-unearned)'" />
      </div>
      <div class="chapter-report--index">
        {{ report.chapterIndex }}
      </div>
      <div class="chapter-report--fraction">
        {{ report.versesRead }} / {{ report.totalVerses }}
      </div>
    </div>
    <segment-bar class="chapter-report--completion" :segments="report.segments" />
  </button>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import SegmentBar from '~/components/bible/SegmentBar.vue';
import StarIcon from '~/components/svg/StarIcon.vue';
import { useActionSheetStore } from '~/stores/action-sheet';
import { useUserSettingsStore } from '~/stores/user-settings';

const hydrated = ref(false);
onMounted(() => { hydrated.value = true; });

const props = defineProps<{
  report: {
    chapterIndex: number;
    bookIndex: number;
    totalVerses: number;
    versesRead: number;
    percentage: number;
    segments: Array<Record<string, unknown>>;
  };
}>();

const emit = defineEmits<{
  createLogEntry: [bookIndex: number, chapterIndex: number];
  takeNoteOnChapter: [bookIndex: number, chapterIndex: number];
  viewNotesForChapter: [bookIndex: number, chapterIndex: number];
  viewReadingLogForChapter: [bookIndex: number, chapterIndex: number];
}>();

const { t, locale } = useI18n();

const sheetTitle = computed(() => {
  const bookName = Bible.getBookName(props.report.bookIndex, locale.value);
  return `${bookName} ${props.report.chapterIndex}`;
});

function openActionSheet() {
  const actionSheetStore = useActionSheetStore();
  actionSheetStore.openSheet({
    title: sheetTitle.value,
    actions: [
      {
        label: t('open_bible'),
        callback: () => {
          const url = useUserSettingsStore().getReadingUrl(props.report.bookIndex, props.report.chapterIndex);
          window.open(url, '_blank');
        },
      },
      {
        label: t('log_reading'),
        callback: () => emit('createLogEntry', props.report.bookIndex, props.report.chapterIndex),
      },
      {
        label: t('take_note'),
        callback: () => emit('takeNoteOnChapter', props.report.bookIndex, props.report.chapterIndex),
      },
      {
        label: t('view_notes'),
        callback: () => emit('viewNotesForChapter', props.report.bookIndex, props.report.chapterIndex),
      },
      {
        label: t('view_reading_log'),
        callback: () => emit('viewReadingLogForChapter', props.report.bookIndex, props.report.chapterIndex),
      },
    ],
  });
}
</script>

<style>
.chapter-report {
  border: none;
  background: var(--mbl-bg-elevated);
  cursor: pointer;
  margin: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  box-shadow: var(--mbl-shadow-elev-1);
  flex-basis: calc(25% - 1rem);
  position: relative;
  transition: 0.1s;
}

@media (min-width: 500px) {
  .chapter-report { flex-basis: calc(100% / 5 - 1rem); }
}

@media (min-width: 769px) {
  .chapter-report { flex-basis: calc(100% / 6 - 1rem); }
}

.chapter-report:hover {
  transition: 0.2s;
  box-shadow: var(--mbl-shadow-elev-2);
}

.chapter-report--indicator {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  min-height: 3.5rem;
  margin-bottom: 5px;
}

.chapter-report--indicator--icon {
  position: absolute;
  inset: 20%;
}

.chapter-report--index {
  position: absolute;
  top: 0;
  left: 0;
  font-weight: bold;
  font-size: 1.2rem;
}

.chapter-report--fraction {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 0.8rem;
  font-weight: bold;
  white-space: nowrap;
}
</style>

<i18n lang="json">
{
  "en": {
    "open_bible": "Open Bible",
    "log_reading": "Log Reading",
    "take_note": "Take Note",
    "view_notes": "View Notes",
    "view_reading_log": "View Reading Log"
  },
  "de": {
    "open_bible": "Bibel öffnen",
    "log_reading": "Lesen protokollieren",
    "take_note": "Notiz hinzufügen",
    "view_notes": "Notizen ansehen",
    "view_reading_log": "Lesejournal ansehen"
  },
  "es": {
    "open_bible": "Abrir en la Biblia",
    "log_reading": "Agregar lectura a registro",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "view_reading_log": "Ver registro de lectura"
  },
  "fr": {
    "open_bible": "Ouvrir dans la Bible",
    "log_reading": "Ajouter lecture à registre",
    "take_note": "Prendre note",
    "view_notes": "Voir les notes",
    "view_reading_log": "Voir le journal de lecture"
  },
  "ko": {
    "open_bible": "성경 열기",
    "log_reading": "기록 추가",
    "take_note": "노트 작성",
    "view_notes": "노트 보기",
    "view_reading_log": "기록 보기"
  },
  "pt": {
    "open_bible": "Ler na Biblia",
    "log_reading": "Adicionar leitura a registro",
    "take_note": "Tomar nota",
    "view_notes": "Ver notas",
    "view_reading_log": "Ver registro de leitura"
  },
  "uk": {
    "open_bible": "Читати в Біблії",
    "log_reading": "Додати читання до журналу",
    "take_note": "Записати",
    "view_notes": "Переглянути записи",
    "view_reading_log": "Переглянути журнал читання"
  }
}
</i18n>
