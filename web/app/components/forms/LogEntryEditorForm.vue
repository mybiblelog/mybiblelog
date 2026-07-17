<template>
  <form data-testid="log-entry-editor">
    <div class="passage-preview" data-testid="log-entry-editor-preview">
      {{ displayEditorVerseRange || t('preview_passage') }}
    </div>
    <div class="form-field">
      <label for="model-date">{{ t('date') }}</label>
      <input id="model-date" data-testid="log-entry-editor-date" :value="logEntry.date" type="date" @change="updateDate">
    </div>
    <div class="form-field">
      <label>{{ t('passage') }}</label>
      <passage-input
        :locale="locale"
        :model-value="storeRange"
        input-test-id="log-entry-editor-passage"
        @update:model-value="onRangeChange"
        @update:valid="logEntryEditorStore.setPassageInputValid($event)"
      />
    </div>
    <div v-if="errors._form" class="form-error">
      {{ t(`api_error.${errors._form?.code ?? 'unknown_error'}`) }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { Bible, type VerseRange } from '@mybiblelog/shared';
import PassageInput from '~/components/forms/PassageInput.vue';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';

const { t, locale } = useI18n();
const logEntryEditorStore = useLogEntryEditorStore();
const logEntry = computed(() => logEntryEditorStore.logEntry);
const errors = computed(() => logEntryEditorStore.errors);

const storeRange = computed<VerseRange | null>(() => {
  if (logEntry.value?.startVerseId && logEntry.value?.endVerseId) {
    return { startVerseId: logEntry.value.startVerseId, endVerseId: logEntry.value.endVerseId };
  }
  return null;
});

const displayEditorVerseRange = computed(() => {
  if (logEntry.value?.startVerseId && logEntry.value?.endVerseId) {
    return Bible.displayVerseRange(logEntry.value.startVerseId, logEntry.value.endVerseId, locale.value);
  }
  return null;
});

const updateDate = (event: Event) => {
  logEntryEditorStore.updateDate((event.target as HTMLInputElement).value);
};

const onRangeChange = (range: VerseRange | null) => {
  logEntryEditorStore.setVerseRange(range);
};
</script>

<style scoped>
form {
  margin: 0 auto;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-error {
  color: var(--mbl-danger);
  font-size: 0.875rem;
}

.passage-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  color: var(--mbl-on-accent);
  background: var(--mbl-link-bright);
  border-radius: 3px;
  font-weight: bold;
}

.form-field {
  display: flex;
  flex-direction: column;
  position: relative;
}

form label {
  position: absolute;
  top: -0.5rem;
  left: 0.75rem;
  color: var(--mbl-link-bright);
  background-color: var(--mbl-bg);
  padding: 0 0.25rem;
  border-radius: var(--mbl-radius);
  z-index: 2;
  pointer-events: none;
}

form input[type="date"] {
  font-size: 16px;
  min-height: 3rem;
  padding: 0.5rem;
  padding-top: 1.125rem;
  border: 2px solid var(--mbl-border-strong);
  width: unset;
  border-radius: var(--mbl-radius);
  box-sizing: border-box;
  color: var(--mbl-text);
  background-color: var(--mbl-bg);
}

form input[type="date"]:focus {
  border-color: var(--primary-color);
  outline: none;
}
</style>

<i18n lang="json">
{
  "en": {
    "preview_passage": "preview passage",
    "date": "Date",
    "passage": "Passage"
  },
  "de": {
    "preview_passage": "Passage Vorschau",
    "date": "Datum",
    "passage": "Passage"
  },
  "es": {
    "preview_passage": "vista previa del pasaje",
    "date": "Fecha",
    "passage": "Pasaje"
  },
  "fr": {
    "preview_passage": "Aperçu du passage",
    "date": "Date",
    "passage": "Passage"
  },
  "ko": {
    "preview_passage": "구절 미리보기",
    "date": "일자",
    "passage": "구절"
  },
  "pt": {
    "preview_passage": "visualização do trecho",
    "date": "Data",
    "passage": "Passagem"
  },
  "uk": {
    "preview_passage": "попередній перегляд пасажу",
    "date": "Дата",
    "passage": "Пасаж"
  }
}
</i18n>
