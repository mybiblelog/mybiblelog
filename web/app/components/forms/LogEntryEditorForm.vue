<template>
  <form data-testid="log-entry-editor">
    <div class="passage-preview" data-testid="log-entry-editor-preview">
      {{ displayEditorVerseRange || t('preview_passage') }}
    </div>
    <div>
      <label for="model-date">{{ t('date') }}</label>
      <input id="model-date" data-testid="log-entry-editor-date" :value="logEntry.date" type="date" @change="updateDate">
    </div>
    <div>
      <label for="model-book">{{ t('book') }}</label>
      <select
        id="model-book"
        :key="`book-${formBook}`"
        :value="formBook"
        @change="onSelectBook"
      >
        <option disabled value="0" selected>
          {{ t('choose_book') }}
        </option>
        <option v-for="book in books" :key="book.bibleOrder" :value="book.bibleOrder">
          {{ displayBookName(book.bibleOrder) }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-startChapter">{{ t('start_chapter') }}</label>
      <select
        id="model-startChapter"
        ref="startChapterRef"
        :key="`start-chapter-${formBook}-${formStartChapter}`"
        :value="formStartChapter"
        :disabled="formBook === 0"
        @change="onSelectStartChapter"
      >
        <option disabled value="0" selected>
          {{ t('choose_start_chapter') }}
        </option>
        <option v-for="chapter in startChapters" :key="chapter" :value="chapter">
          {{ chapter }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-startVerse">{{ t('start_verse') }}</label>
      <select
        id="model-startVerse"
        :key="`start-verse-${formStartChapter}-${formStartVerse}`"
        :value="formStartVerse"
        :disabled="formStartChapter === 0"
        @change="onSelectStartVerse"
      >
        <option disabled value="0" selected>
          {{ t('choose_start_verse') }}
        </option>
        <option v-for="verse in startVerses" :key="verse" :value="verse">
          {{ verse }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-endChapter">{{ t('end_chapter') }}</label>
      <select
        id="model-endChapter"
        ref="endChapterRef"
        :key="`end-chapter-${formStartChapter}-${formEndChapter}`"
        :value="formEndChapter"
        :disabled="formStartVerse === 0"
        @change="onSelectEndChapter"
      >
        <option disabled value="0" selected>
          {{ t('choose_end_chapter') }}
        </option>
        <option v-for="chapter in endChapters" :key="chapter" :value="chapter">
          {{ chapter }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-endVerse">{{ t('end_verse') }}</label>
      <select
        id="model-endVerse"
        ref="endVerseRef"
        :key="`end-verse-${formEndChapter}`"
        :value="formEndVerse"
        :disabled="formEndChapter === 0"
        @change="onSelectEndVerse"
      >
        <option disabled value="0" selected>
          {{ t('choose_end_verse') }}
        </option>
        <option v-for="verse in endVerses" :key="verse" :value="verse">
          {{ verse }}
        </option>
      </select>
    </div>
    <div v-if="errors._form" class="form-error">
      {{ t(`api_error.${errors._form?.code ?? 'unknown_error'}`) }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';

const { t, locale } = useI18n();
const logEntryEditorStore = useLogEntryEditorStore();
const logEntry = computed(() => logEntryEditorStore.logEntry);
const errors = computed(() => logEntryEditorStore.errors);

const books = Bible.getBooks();
const startChapterRef = ref<HTMLSelectElement | null>(null);
const endChapterRef = ref<HTMLSelectElement | null>(null);
const endVerseRef = ref<HTMLSelectElement | null>(null);

const formBook = computed(() => {
  if (logEntry.value?.book) { return logEntry.value.book; }
  if (logEntry.value?.startVerseId) { return Bible.parseVerseId(logEntry.value.startVerseId).book; }
  return 0;
});

const formStartChapter = computed(() => {
  if (logEntry.value?.startVerseId) { return Bible.parseVerseId(logEntry.value.startVerseId).chapter; }
  return 0;
});

const formStartVerse = computed(() => {
  if (logEntry.value?.startVerseId) { return Bible.parseVerseId(logEntry.value.startVerseId).verse; }
  return 0;
});

const formEndChapter = computed(() => {
  if (logEntry.value?.endVerseId) { return Bible.parseVerseId(logEntry.value.endVerseId).chapter; }
  return 0;
});

const formEndVerse = computed(() => {
  if (logEntry.value?.endVerseId) { return Bible.parseVerseId(logEntry.value.endVerseId).verse; }
  return 0;
});

const startChapters = computed(() => {
  const bookIndex = formBook.value;
  if (bookIndex > 0) {
    const count = Bible.getBookChapterCount(bookIndex);
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  return [];
});

const startVerses = computed(() => {
  const bookIndex = formBook.value;
  const chapterIndex = formStartChapter.value;
  if (bookIndex > 0 && chapterIndex > 0) {
    const count = Bible.getChapterVerseCount(bookIndex, chapterIndex);
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  return [];
});

const endChapters = computed(() => {
  const bookIndex = formBook.value;
  const startChapter = formStartChapter.value;
  if (bookIndex > 0 && startChapter > 0) {
    const count = Bible.getBookChapterCount(bookIndex);
    const chapters = [];
    for (let i = startChapter; i <= count; i++) { chapters.push(i); }
    return chapters;
  }
  return [];
});

const endVerses = computed(() => {
  const bookIndex = formBook.value;
  const endChapter = formEndChapter.value;
  const startChapter = formStartChapter.value;
  const startVerse = formStartVerse.value;
  if (bookIndex > 0 && endChapter > 0) {
    const count = Bible.getChapterVerseCount(bookIndex, endChapter);
    const verses = [];
    let i = startChapter === endChapter ? startVerse : 1;
    for (; i <= count; i++) { verses.push(i); }
    return verses;
  }
  return [];
});

const displayEditorVerseRange = computed(() => {
  if (logEntry.value?.startVerseId && logEntry.value?.endVerseId) {
    return Bible.displayVerseRange(logEntry.value.startVerseId, logEntry.value.endVerseId, locale.value);
  }
  return null;
});

const displayBookName = (bookIndex: number) => Bible.getBookName(bookIndex, locale.value);

const updateDate = (event: Event) => {
  logEntryEditorStore.updateDate((event.target as HTMLInputElement).value);
};

const onSelectBook = (event: Event) => {
  const bookIndex = parseInt((event.target as HTMLSelectElement).value, 10);
  logEntryEditorStore.selectBook(bookIndex);
  nextTick(() => { startChapterRef.value?.focus(); });
};

const onSelectStartChapter = (event: Event) => {
  const chapterIndex = parseInt((event.target as HTMLSelectElement).value, 10);
  logEntryEditorStore.selectStartChapter(chapterIndex);
};

const onSelectStartVerse = (event: Event) => {
  const verseIndex = parseInt((event.target as HTMLSelectElement).value, 10);
  logEntryEditorStore.selectStartVerse(verseIndex);
};

const onSelectEndChapter = (event: Event) => {
  const chapterIndex = parseInt((event.target as HTMLSelectElement).value, 10);
  logEntryEditorStore.selectEndChapter(chapterIndex);
  nextTick(() => { endVerseRef.value?.focus(); });
};

const onSelectEndVerse = (event: Event) => {
  const verseIndex = parseInt((event.target as HTMLSelectElement).value, 10);
  logEntryEditorStore.selectEndVerse(verseIndex);
};
</script>

<style scoped>
form {
  margin: 0 auto;
  max-width: 200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1rem;
}

@media screen and (min-width: 550px) {
  form {
    max-width: 400px;
    row-gap: 1rem;
  }
}

.form-error {
  grid-column: span 2;
  color: var(--mbl-danger);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.passage-preview {
  grid-column: span 2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--mbl-on-accent);
  background: var(--mbl-link-bright);
  border-radius: 3px;
  font-weight: bold;
}

form > div {
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
  z-index: 1;
  pointer-events: none;
}

form input {
  font-size: 16px;
  min-height: 3rem;
  padding: 0.5rem;
  padding-top: 1.125rem;
  border: 2px solid var(--mbl-border-strong);
  width: unset;
  border-radius: var(--mbl-radius);
  box-sizing: border-box;
  color: var(--mbl-text);
}

form select {
  font-size: 16px;
  height: 3rem;
  padding: 0.5rem;
  padding-top: 1.125rem;
  border: 2px solid var(--mbl-border-strong);
  width: unset;
  border-radius: var(--mbl-radius);
  box-sizing: border-box;
  color: var(--mbl-text);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  padding-right: 2rem;
}

form select:focus, form input:focus {
  border-color: var(--primary-color);
  outline: none;
}

form input:not(:disabled),
form select:not(:disabled) {
  background-color: var(--mbl-bg);
}

[data-theme="dark"] form select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f5f5f5' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) form select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f5f5f5' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  }
}

@media screen and (max-width: 550px) {
  form {
    display: flex;
    flex-direction: column;
  }

  form > div:not(:last-child) {
    margin-bottom: 0.5rem;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "preview_passage": "preview passage",
    "date": "Date",
    "book": "Book",
    "choose_book": "Choose Book",
    "start_chapter": "Start Chapter",
    "choose_start_chapter": "Choose Start Chapter",
    "start_verse": "Start Verse",
    "choose_start_verse": "Choose Start Verse",
    "end_chapter": "End Chapter",
    "choose_end_chapter": "Choose End Chapter",
    "end_verse": "End Verse",
    "choose_end_verse": "Choose End Verse"
  },
  "de": {
    "preview_passage": "Passage Vorschau",
    "date": "Datum",
    "book": "Buch",
    "choose_book": "Buch auswählen",
    "start_chapter": "Kapitel starten",
    "choose_start_chapter": "Kapitel auswählen",
    "start_verse": "Startvers",
    "choose_start_verse": "Vers auswählen",
    "end_chapter": "Endkapitel",
    "choose_end_chapter": "Kapitel auswählen",
    "end_verse": "Endvers",
    "choose_end_verse": "Vers auswählen"
  },
  "es": {
    "preview_passage": "vista previa del pasaje",
    "date": "Fecha",
    "book": "Libro",
    "choose_book": "Elegir libro",
    "start_chapter": "Capítulo de inicio",
    "choose_start_chapter": "Elegir capítulo de inicio",
    "start_verse": "Versículo de inicio",
    "choose_start_verse": "Elegir versículo de inicio",
    "end_chapter": "Capítulo final",
    "choose_end_chapter": "Elegir capítulo final",
    "end_verse": "Versículo final",
    "choose_end_verse": "Elegir versículo final"
  },
  "fr": {
    "preview_passage": "Aperçu du passage",
    "date": "Date",
    "book": "Livre",
    "choose_book": "Livre",
    "start_chapter": "Chapitre de départ",
    "choose_start_chapter": "Chapitre de départ",
    "start_verse": "Verset de départ",
    "choose_start_verse": "Verset de départ",
    "end_chapter": "Chapitre de fin",
    "choose_end_chapter": "Chapitre de fin",
    "end_verse": "Verset de fin",
    "choose_end_verse": "Verset de fin"
  },
  "ko": {
    "preview_passage": "구절 미리보기",
    "date": "일자",
    "book": "책",
    "choose_book": "책 선택",
    "start_chapter": "시작 장",
    "choose_start_chapter": "시작 장 선택",
    "start_verse": "시작 절",
    "choose_start_verse": "시작 절 선택",
    "end_chapter": "끝 장",
    "choose_end_chapter": "끝 장 선택",
    "end_verse": "끝 절",
    "choose_end_verse": "끝 절 선택"
  },
  "pt": {
    "preview_passage": "visualização do trecho",
    "date": "Data",
    "book": "Livro",
    "choose_book": "Escolher Livro",
    "start_chapter": "Iniciar Capítulo",
    "choose_start_chapter": "Escolher Capítulo",
    "start_verse": "Versículo Inicial",
    "choose_start_verse": "Escolher Versículo",
    "end_chapter": "Capítulo Final",
    "choose_end_chapter": "Escolher Capítulo",
    "end_verse": "Versículo Final",
    "choose_end_verse": "Escolher Versículo"
  },
  "uk": {
    "preview_passage": "попередній перегляд пасажу",
    "date": "Дата",
    "book": "Книга",
    "choose_book": "Виберіть",
    "start_chapter": "Почати розділ",
    "choose_start_chapter": "Виберіть",
    "start_verse": "Почати вірш",
    "choose_start_verse": "Виберіть",
    "end_chapter": "Закінчити розділ",
    "choose_end_chapter": "Виберіть",
    "end_verse": "Закінчити вірш",
    "choose_end_verse": "Виберіть"
  }
}
</i18n>
