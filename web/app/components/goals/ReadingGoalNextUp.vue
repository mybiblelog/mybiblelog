<template>
  <div class="goal-next-up">
    <div class="goal-next-up__text">
      <span class="goal-next-up__eyebrow">{{ t('next_up') }}</span>
      <span class="goal-next-up__passage" data-testid="reading-goal-next-up-passage">{{ passageLabel }}</span>
      <span class="goal-next-up__count">{{ t('verse_count', { count: verseCount }, verseCount) }}</span>
    </div>
    <div v-if="canLog" class="goal-next-up__actions">
      <button type="button" class="mbl-button" data-testid="reading-goal-next-up-open" @click="openPassageInBible(passage)">
        {{ t('open_bible') }}
      </button>
      <button type="button" class="mbl-button mbl-button--primary" data-testid="reading-goal-next-up-log" @click="logReading">
        {{ t('log_reading') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible, passageBookIndex, type GoalPassage } from '@mybiblelog/shared';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useUserSettingsStore } from '~/stores/user-settings';

const props = defineProps<{
  passage: GoalPassage;
}>();

const { t, locale } = useI18n();
const logEntryEditorStore = useLogEntryEditorStore();
const userSettingsStore = useUserSettingsStore();
const { openPassageInBible } = useOpenInBible();

const passageLabel = computed(() => Bible.displayVerseRange(props.passage.startVerseId, props.passage.endVerseId, locale.value));
const verseCount = computed(() => Bible.countRangeVerses(props.passage.startVerseId, props.passage.endVerseId));

// The log entry form only offers books in the reader's canon, so a passage
// outside it can be shown but not logged from here.
const canLog = computed(() =>
  userSettingsStore.settings.includeDeuterocanonical || !Bible.isDeuterocanonical(passageBookIndex(props.passage)));

const logReading = () => logEntryEditorStore.openEditor({
  id: null,
  date: dayjs().format('YYYY-MM-DD'),
  startVerseId: props.passage.startVerseId,
  endVerseId: props.passage.endVerseId,
});
</script>

<style scoped>
.goal-next-up {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mbl-space-sm) var(--mbl-space-md);
  padding: var(--mbl-space-sm) var(--mbl-space-md);
  border-radius: var(--mbl-radius-xl);
  background: var(--mbl-bg-muted);
}

.goal-next-up__text {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  column-gap: var(--mbl-space-xs);
  min-width: 0;
}

.goal-next-up__eyebrow {
  grid-column: 1 / -1;
  color: var(--mbl-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.goal-next-up__passage {
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-5);
  font-weight: 700;
}

.goal-next-up__count {
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
}

.goal-next-up__actions {
  display: flex;
  gap: var(--mbl-space-xs);
}

@mixin mbl-mobile {
  .goal-next-up__actions {
    flex: 1 1 100%;
  }

  .goal-next-up__actions .mbl-button {
    flex: 1;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "next_up": "Next up",
    "verse_count": "{count} verse | {count} verses",
    "open_bible": "Open Bible",
    "log_reading": "Log Reading"
  },
  "de": {
    "next_up": "Als Nächstes",
    "verse_count": "{count} Vers | {count} Verse",
    "open_bible": "Bibel öffnen",
    "log_reading": "Lesen protokollieren"
  },
  "es": {
    "next_up": "Siguiente",
    "verse_count": "{count} versículo | {count} versículos",
    "open_bible": "Abrir en la Biblia",
    "log_reading": "Registrar lectura"
  },
  "fr": {
    "next_up": "À suivre",
    "verse_count": "{count} verset | {count} versets",
    "open_bible": "Ouvrir dans la Bible",
    "log_reading": "Enregistrer la lecture"
  },
  "ko": {
    "next_up": "다음 읽을 곳",
    "verse_count": "{count}절",
    "open_bible": "성경 열기",
    "log_reading": "기록 추가"
  },
  "pt": {
    "next_up": "A seguir",
    "verse_count": "{count} versículo | {count} versículos",
    "open_bible": "Ler na Bíblia",
    "log_reading": "Registrar leitura"
  },
  "uk": {
    "next_up": "Далі",
    "verse_count": "{count} вірш | {count} вірші | {count} віршів",
    "open_bible": "Читати в Біблії",
    "log_reading": "Записати читання"
  }
}
</i18n>
