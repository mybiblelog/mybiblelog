<template>
  <log-entry
    :message="t('next_up')"
    :passage="passage"
    :actions="actions"
  />
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import type { GoalPassage } from '@mybiblelog/shared';
import LogEntry from '~/components/log/LogEntry.vue';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';

const props = defineProps<{
  passage: GoalPassage;
}>();

const { t } = useI18n();
const logEntryEditorStore = useLogEntryEditorStore();
const { openPassageInBible } = useOpenInBible();

const actions = computed(() => [
  { label: t('open_bible'), callback: () => openPassageInBible(props.passage) },
  {
    label: t('log_reading'),
    callback: () => logEntryEditorStore.openEditor({
      id: null,
      date: dayjs().format('YYYY-MM-DD'),
      startVerseId: props.passage.startVerseId,
      endVerseId: props.passage.endVerseId,
    }),
  },
]);
</script>

<i18n lang="json">
{
  "en": {
    "next_up": "Next up",
    "open_bible": "Open Bible",
    "log_reading": "Log Reading"
  },
  "de": {
    "next_up": "Als Nächstes",
    "open_bible": "Bibel öffnen",
    "log_reading": "Lesen protokollieren"
  },
  "es": {
    "next_up": "Siguiente",
    "open_bible": "Abrir en la Biblia",
    "log_reading": "Agregar lectura a registro"
  },
  "fr": {
    "next_up": "À suivre",
    "open_bible": "Ouvrir dans la Bible",
    "log_reading": "Ajouter lecture à registre"
  },
  "ko": {
    "next_up": "다음 읽을 곳",
    "open_bible": "성경 열기",
    "log_reading": "기록 추가"
  },
  "pt": {
    "next_up": "A seguir",
    "open_bible": "Ler na Biblia",
    "log_reading": "Adicionar leitura a registro"
  },
  "uk": {
    "next_up": "Далі",
    "open_bible": "Читати в Біблії",
    "log_reading": "Додати читання до журналу"
  }
}
</i18n>
