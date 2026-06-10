<template>
  <form data-testid="log-entry-editor">
    <div class="passage-preview" data-testid="log-entry-editor-preview">
      {{ displayEditorVerseRange || $t('preview_passage') }}
    </div>
    <div>
      <label for="model-date">{{ $t('date') }}</label>
      <input id="model-date" data-testid="log-entry-editor-date" :value="logEntry.date" type="date" @change="updateDate">
    </div>
    <div>
      <label for="model-book">{{ $t('book') }}</label>
      <select
        id="model-book"
        ref="book"
        :key="`book-${formBook}`"
        :value="formBook"
        @change="onSelectBook"
      >
        <option disabled="" value="0" selected="">
          {{ $t('choose_book') }}
        </option>
        <option v-for="book in books" :key="book.bibleOrder" :value="book.bibleOrder">
          {{ displayBookName(book.bibleOrder) }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-startChapter">{{ $t('start_chapter') }}</label>
      <select
        id="model-startChapter"
        ref="startChapter"
        :key="`start-chapter-${formBook}-${formStartChapter}`"
        :value="formStartChapter"
        :disabled="formBook === 0"
        @change="onSelectStartChapter"
      >
        <option disabled="" value="0" selected="">
          {{ $t('choose_start_chapter') }}
        </option>
        <option v-for="chapter in startChapters" :key="chapter" :value="chapter">
          {{ chapter }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-startVerse">{{ $t('start_verse') }}</label>
      <select
        id="model-startVerse"
        ref="startVerse"
        :key="`start-verse-${formStartChapter}-${formStartVerse}`"
        :value="formStartVerse"
        :disabled="formStartChapter === 0"
        @change="onSelectStartVerse"
      >
        <option disabled="" value="0" selected="">
          {{ $t('choose_start_verse') }}
        </option>
        <option v-for="verse in startVerses" :key="verse" :value="verse">
          {{ verse }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-endChapter">{{ $t('end_chapter') }}</label>
      <select
        id="model-endChapter"
        ref="endChapter"
        :key="`end-chapter-${formStartChapter}-${formEndChapter}`"
        :value="formEndChapter"
        :disabled="formStartVerse === 0"
        @change="onSelectEndChapter"
      >
        <option disabled="" value="0" selected="">
          {{ $t('choose_end_chapter') }}
        </option>
        <option v-for="chapter in endChapters" :key="chapter" :value="chapter">
          {{ chapter }}
        </option>
      </select>
    </div>
    <div>
      <label for="model-endVerse">{{ $t('end_verse') }}</label>
      <select
        id="model-endVerse"
        ref="endVerse"
        :key="`end-verse-${formEndChapter}`"
        :value="formEndVerse"
        :disabled="formEndChapter === 0"
        @change="onSelectEndVerse"
      >
        <option disabled="" value="0" selected="">
          {{ $t('choose_end_verse') }}
        </option>
        <option v-for="verse in endVerses" :key="verse" :value="verse">
          {{ verse }}
        </option>
      </select>
    </div>
    <div v-if="errors._form" class="form-error">
      {{ $terr(errors._form) }}
    </div>
    <!-- ensures property will be computed because it is accessed-->
    <p hidden="hidden">
      {{ isValid }}
    </p>
  </form>
</template>

<script>
import { Bible } from '@mybiblelog/shared';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';

export default {
  name: 'LogEntryEditorForm',
  components: {
  },
  data() {
    return {
      books: Bible.getBooks(),
    };
  },
  computed: {
    logEntryEditorStore() {
      return useLogEntryEditorStore();
    },
    logEntry() {
      return this.logEntryEditorStore.logEntry;
    },
    isValid() {
      return this.logEntryEditorStore.isValid;
    },
    errors() {
      return this.logEntryEditorStore.errors;
    },
    formBook() {
      // First check if we have a book stored directly
      if (this.logEntry && this.logEntry.book) {
        return this.logEntry.book;
      }
      // Otherwise derive from verse ID
      if (this.logEntry && this.logEntry.startVerseId) {
        const start = Bible.parseVerseId(this.logEntry.startVerseId);
        return start.book;
      }
      return 0;
    },
    formStartChapter() {
      if (this.logEntry && this.logEntry.startVerseId) {
        const start = Bible.parseVerseId(this.logEntry.startVerseId);
        return start.chapter;
      }
      return 0;
    },
    formStartVerse() {
      if (this.logEntry && this.logEntry.startVerseId) {
        const start = Bible.parseVerseId(this.logEntry.startVerseId);
        return start.verse;
      }
      return 0;
    },
    formEndChapter() {
      if (this.logEntry && this.logEntry.endVerseId) {
        const end = Bible.parseVerseId(this.logEntry.endVerseId);
        return end.chapter;
      }
      return 0;
    },
    formEndVerse() {
      if (this.logEntry && this.logEntry.endVerseId) {
        const end = Bible.parseVerseId(this.logEntry.endVerseId);
        return end.verse;
      }
      return 0;
    },
    startChapters() {
      const bookIndex = this.formBook;
      if (bookIndex > 0) {
        const chapterCount = Bible.getBookChapterCount(bookIndex);
        const chapters = [];
        for (let i = 1; i <= chapterCount; i++) { chapters.push(i); }
        return chapters;
      }
      return [];
    },
    startVerses() {
      const bookIndex = this.formBook;
      const chapterIndex = this.formStartChapter;
      if (bookIndex > 0 && chapterIndex > 0) {
        const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
        const verses = [];
        for (let i = 1; i <= chapterVerseCount; i++) { verses.push(i); }
        return verses;
      }
      return [];
    },
    endChapters() {
      const bookIndex = this.formBook;
      const startChapter = this.formStartChapter;
      if (bookIndex > 0 && startChapter > 0) {
        const chapterCount = Bible.getBookChapterCount(bookIndex);
        const chapters = [];
        for (let i = startChapter; i <= chapterCount; i++) { chapters.push(i); }
        return chapters;
      }
      return [];
    },
    endVerses() {
      const bookIndex = this.formBook;
      const endChapter = this.formEndChapter;
      const startChapter = this.formStartChapter;
      const startVerse = this.formStartVerse;
      if (bookIndex > 0 && endChapter > 0) {
        const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, endChapter);
        const verses = [];
        let i = 1;
        if (startChapter === endChapter) { i = startVerse; }
        for (; i <= chapterVerseCount; i++) { verses.push(i); }
        return verses;
      }
      return [];
    },
    displayEditorVerseRange() {
      if (this.logEntry && this.logEntry.startVerseId && this.logEntry.endVerseId) {
        return Bible.displayVerseRange(this.logEntry.startVerseId, this.logEntry.endVerseId, this.$i18n.locale);
      }
      return null;
    },
  },
  methods: {
    displayBookName(bookIndex) {
      return Bible.getBookName(bookIndex, this.$i18n.locale);
    },
    updateDate(event) {
      this.logEntryEditorStore.updateDate(event.target.value);
    },
    onSelectBook(event) {
      const bookIndex = parseInt(event.target.value, 10);
      this.logEntryEditorStore.selectBook(bookIndex);
      this.$nextTick(() => {
        this.$refs.startChapter?.focus();
      });
    },
    onSelectStartChapter(event) {
      const chapterIndex = parseInt(event.target.value, 10);
      this.logEntryEditorStore.selectStartChapter(chapterIndex);
    },
    onSelectStartVerse(event) {
      const verseIndex = parseInt(event.target.value, 10);
      this.logEntryEditorStore.selectStartVerse(verseIndex);
    },
    onSelectEndChapter(event) {
      const chapterIndex = parseInt(event.target.value, 10);
      this.logEntryEditorStore.selectEndChapter(chapterIndex);
      this.$nextTick(() => {
        this.$refs.endVerse?.focus();
      });
    },
    onSelectEndVerse(event) {
      const verseIndex = parseInt(event.target.value, 10);
      this.logEntryEditorStore.selectEndVerse(verseIndex);
    },
  },
};
</script>

<style scoped>
form {
  margin: 0 auto;
  max-width: 200px;

  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 1rem;
}

@media screen and (min-width: 550px) {
  form {
    max-width: 400px;
    grid-row-gap: 1rem;
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

form input:hover {
  border-color: var(--mbl-border-strong);
}

form input:focus {
  border-color: var(--primary-color);
  outline: none;
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

form select:hover {
  border-color: var(--mbl-border-strong);
}

form select:focus {
  border-color: var(--primary-color);
  /* box-shadow: var(--mbl-focus-ring); */
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
    "add_entry": "Add Entry",
    "edit_entry": "Edit Entry",
    "preview_passage": "preview passage",
    "date": "Date",
    "save": "Save",
    "add": "Add",
    "close": "Close",
    "book": "Book",
    "choose_book": "Choose Book",
    "start_chapter": "Start Chapter",
    "choose_start_chapter": "Choose Start Chapter",
    "start_verse": "Start Verse",
    "choose_start_verse": "Choose Start Verse",
    "end_chapter": "End Chapter",
    "choose_end_chapter": "Choose End Chapter",
    "end_verse": "End Verse",
    "choose_end_verse": "Choose End Verse",
    "unable_to_add_entry": "Unable to add entry.",
    "unable_to_update_entry": "Unable to update entry."
  },
  "de": {
    "add_entry": "Eintrag hinzufügen",
    "edit_entry": "Eintrag bearbeiten",
    "preview_passage": "Passage Vorschau",
    "date": "Datum",
    "save": "Speichern",
    "add": "Hinzufügen",
    "close": "Schließen",
    "book": "Buch",
    "choose_book": "Buch auswählen",
    "start_chapter": "Kapitel starten",
    "choose_start_chapter": "Kapitel auswählen",
    "start_verse": "Startvers",
    "choose_start_verse": "Vers auswählen",
    "end_chapter": "Endkapitel",
    "choose_end_chapter": "Kapitel auswählen",
    "end_verse": "Endvers",
    "choose_end_verse": "Vers auswählen",
    "unable_to_add_entry": "Eintrag konnte nicht hinzugefügt werden.",
    "unable_to_update_entry": "Eintrag konnte nicht aktualisiert werden."
  },
  "es": {
    "add_entry": "Añadir entrada",
    "edit_entry": "Editar entrada",
    "preview_passage": "vista previa del pasaje",
    "date": "Fecha",
    "save": "Guardar",
    "add": "Añadir",
    "close": "Cerrar",
    "book": "Libro",
    "choose_book": "Elegir libro",
    "start_chapter": "Capítulo de inicio",
    "choose_start_chapter": "Elegir capítulo de inicio",
    "start_verse": "Versículo de inicio",
    "choose_start_verse": "Elegir versículo de inicio",
    "end_chapter": "Capítulo final",
    "choose_end_chapter": "Elegir capítulo final",
    "end_verse": "Versículo final",
    "choose_end_verse": "Elegir versículo final",
    "unable_to_add_entry": "No se puede agregar la entrada.",
    "unable_to_update_entry": "No se puede actualizar la entrada."
  },
  "fr": {
    "add_entry": "Ajouter une entrée",
    "edit_entry": "Modifier l'entrée",
    "preview_passage": "Aperçu du passage",
    "date": "Date",
    "save": "Sauvegarder",
    "add": "Ajouter",
    "close": "Fermer",
    "book": "Livre",
    "choose_book": "Livre",
    "start_chapter": "Chapitre de départ",
    "choose_start_chapter": "Chapitre de départ",
    "start_verse": "Verset de départ",
    "choose_start_verse": "Verset de départ",
    "end_chapter": "Chapitre de fin",
    "choose_end_chapter": "Chapitre de fin",
    "end_verse": "Verset de fin",
    "choose_end_verse": "Verset de fin",
    "unable_to_add_entry": "Impossible d'ajouter une entrée.",
    "unable_to_update_entry": "Impossible de mettre à jour l'entrée."
  },
  "ko": {
    "add_entry": "기록 추가",
    "edit_entry": "기록 수정",
    "preview_passage": "구절 미리보기",
    "date": "일자",
    "save": "저장",
    "add": "추가",
    "close": "닫기",
    "book": "책",
    "choose_book": "책 선택",
    "start_chapter": "시작 장",
    "choose_start_chapter": "시작 장 선택",
    "start_verse": "시작 절",
    "choose_start_verse": "시작 절 선택",
    "end_chapter": "끝 장",
    "choose_end_chapter": "끝 장 선택",
    "end_verse": "끝 절",
    "choose_end_verse": "끝 절 선택",
    "unable_to_add_entry": "기록을 추가할 수 없습니다.",
    "unable_to_update_entry": "기록을 수정할 수 없습니다."
  },
  "pt": {
    "add_entry": "Adicionar Entrada",
    "edit_entry": "Editar Entrada",
    "preview_passage": "visualização do trecho",
    "date": "Data",
    "save": "Salvar",
    "add": "Adicionar",
    "close": "Fechar",
    "book": "Livro",
    "choose_book": "Escolher Livro",
    "start_chapter": "Iniciar Capítulo",
    "choose_start_chapter": "Escolher Capítulo",
    "start_verse": "Versículo Inicial",
    "choose_start_verse": "Escolher Versículo",
    "end_chapter": "Capítulo Final",
    "choose_end_chapter": "Escolher Capítulo",
    "end_verse": "Versículo Final",
    "choose_end_verse": "Escolher Versículo",
    "unable_to_add_entry": "Não foi possível adicionar a entrada.",
    "unable_to_update_entry": "Não foi possível atualizar a entrada."
  },
  "uk": {
    "add_entry": "Додати запис",
    "edit_entry": "Редагувати запис",
    "preview_passage": "попередній перегляд пасажу",
    "date": "Дата",
    "save": "Зберегти",
    "add": "Додати",
    "close": "Закрити",
    "book": "Книга",
    "choose_book": "Виберіть",
    "start_chapter": "Почати розділ",
    "choose_start_chapter": "Виберіть",
    "start_verse": "Почати вірш",
    "choose_start_verse": "Виберіть",
    "end_chapter": "Закінчити розділ",
    "choose_end_chapter": "Виберіть",
    "end_verse": "Закінчити вірш",
    "choose_end_verse": "Виберіть",
    "unable_to_add_entry": "Не вдалося додати запис.",
    "unable_to_update_entry": "Не вдалося оновити запис."
  }
}
</i18n>
