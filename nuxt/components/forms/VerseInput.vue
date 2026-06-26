<template>
  <div class="verse-input">
    <div class="mbl-field mbl-field--addons verse-input__field">
      <div class="mbl-control mbl-control--expanded verse-input__input-control">
        <input
          :value="localText"
          class="mbl-input verse-input__input"
          type="text"
          :placeholder="placeholder"
          :class="{ 'mbl-input--danger': showInvalid }"
          :style="inputStyle"
          @input="onTextInput"
          @focus="onFocus"
          @blur="onBlurNormalize"
        >

        <button
          v-if="hasText"
          class="mbl-delete mbl-delete--sm verse-input__clear"
          type="button"
          :aria-label="$t('aria_clear')"
          @click="clear"
        />
      </div>

      <div class="mbl-control">
        <button
          class="mbl-button verse-input__pick-button"
          type="button"
          :aria-label="$t('aria_pick')"
          @click="openPicker"
        >
          {{ $t('pick') }}
        </button>
      </div>
    </div>

    <p v-if="showInvalid" class="mbl-help mbl-help--danger verse-input__help">
      {{ invalidHelpText }}
    </p>

    <!-- Single-verse picker flow -->
    <app-modal :open="!!singleSelectionTarget" :title="singleModalTitle" @close="closeSinglePicker">
      <template slot="content">
        <template v-if="singleSelectionTarget === SINGLE_SELECTION.BOOK">
          <div class="book-selector-controls">
            <div class="button-group">
              <button
                type="button"
                class="button-group--button button-group--button-left"
                :class="{ active: selectedTestament === 'old' }"
                @click="selectedTestament = 'old'"
              >
                {{ $t('old_testament_short') }}
              </button>
              <button
                type="button"
                class="button-group--button button-group--button-right"
                :class="{ active: selectedTestament === 'new' }"
                @click="selectedTestament = 'new'"
              >
                {{ $t('new_testament_short') }}
              </button>
            </div>
            <div class="button-group">
              <button
                type="button"
                class="button-group--button button-group--button-left"
                :class="{ active: bookSortOrder === 'numerical' }"
                @click="bookSortOrder = 'numerical'"
              >
                123
              </button>
              <button
                type="button"
                class="button-group--button button-group--button-right"
                :class="{ active: bookSortOrder === 'alphabetical' }"
                @click="bookSortOrder = 'alphabetical'"
              >
                ABC
              </button>
            </div>
          </div>
          <grid-selector :options="filteredBookOptions" :columns="2" @selection="selectSingleBook" />
        </template>

        <tap-range-selector
          v-if="singleSelectionTarget === SINGLE_SELECTION.CHAPTER"
          :min="1"
          :max="singleChapterMax"
          :multi="false"
          :columns="8"
          @selection="selectSingleChapter"
        />

        <tap-range-selector
          v-if="singleSelectionTarget === SINGLE_SELECTION.VERSE"
          :min="1"
          :max="singleVerseMax"
          :multi="false"
          :columns="8"
          @selection="selectSingleVerse"
        />
      </template>
    </app-modal>

    <!-- Multi-verse picker (reuses PassageSelector’s modal flow) -->
    <passage-selector
      v-if="multiVerse"
      :key="passageSelectorKey"
      ref="passageSelector"
      class="verse-input__hidden-passage-selector"
      :populate-with="passageSelectorPopulateWith"
      @change="onPassageSelectorChange"
    />
  </div>
</template>

<script>
import {
  Bible,
  PassageSelection,
  coerceVerseRange,
  filterAndSortBookOptions,
  formatVerseRange,
  getBookOptions,
  parseVerseInput,
} from '@mybiblelog/shared';
import AppModal from '@/components/popups/AppModal';
import GridSelector from '@/components/forms/GridSelector';
import TapRangeSelector from '@/components/forms/TapRangeSelector';
import PassageSelector from '@/components/forms/PassageSelector';

const SINGLE_SELECTION = {
  BOOK: 'BOOK',
  CHAPTER: 'CHAPTER',
  VERSE: 'VERSE',
};

// Maps the single-verse machine's next-step hint to a modal target.
const STEP_TO_TARGET = {
  book: SINGLE_SELECTION.BOOK,
  chapter: SINGLE_SELECTION.CHAPTER,
  verse: SINGLE_SELECTION.VERSE,
};

export default {
  name: 'VerseInput',
  components: {
    AppModal,
    GridSelector,
    TapRangeSelector,
    PassageSelector,
  },
  props: {
    // v-model value: { startVerseId, endVerseId } | null
    value: { type: Object, default: null },
    multiVerse: { type: Boolean, default: false },
  },
  data() {
    return {
      SINGLE_SELECTION,
      localText: '',
      isEditing: false,

      selectedTestament: 'old',
      bookSortOrder: 'numerical',

      singleSelectionTarget: null,
      singleSelected: PassageSelection.emptySingleVerseSelection(),

      passageSelectorKey: 0,
      passageSelectorPopulateWith: { empty: true },
    };
  },
  computed: {
    locale() {
      return this.$i18n?.locale || 'en';
    },
    exampleSingle() {
      // John 3:16
      const verseId = Bible.makeVerseId(43, 3, 16);
      return Bible.displayVerseRange(verseId, verseId, this.locale);
    },
    exampleMultiPrimary() {
      // John 3:16-18
      const startVerseId = Bible.makeVerseId(43, 3, 16);
      const endVerseId = Bible.makeVerseId(43, 3, 18);
      return Bible.displayVerseRange(startVerseId, endVerseId, this.locale);
    },
    exampleMultiSecondary() {
      // Acts 2 - 4 (whole chapters)
      const startVerseId = Bible.makeVerseId(44, 2, 1);
      const endVerse = Bible.getChapterVerseCount(44, 4);
      const endVerseId = Bible.makeVerseId(44, 4, endVerse);
      return Bible.displayVerseRange(startVerseId, endVerseId, this.locale);
    },
    placeholder() {
      const prefix = this.$t('example_prefix');
      const example = this.multiVerse ? this.exampleMultiPrimary : this.exampleSingle;
      return `${prefix} ${example}`;
    },
    valueRange() {
      return coerceVerseRange(this.value);
    },
    parsedInput() {
      return parseVerseInput(this.localText, { locale: this.locale, multiVerse: this.multiVerse });
    },
    hasText() {
      return this.parsedInput.hasText;
    },
    parsedRangeFromText() {
      return this.parsedInput.range;
    },
    isValid() {
      return this.parsedInput.isValid;
    },
    showInvalid() {
      return this.hasText && !this.isValid;
    },
    invalidHelpText() {
      return this.multiVerse
        ? this.$t('invalid_multi', { example1: this.exampleMultiPrimary, example2: this.exampleMultiSecondary })
        : this.$t('invalid_single', { example: this.exampleSingle });
    },
    inputStyle() {
      // Space for the clear (delete) button rendered inside the input
      return this.hasText ? { paddingRight: '2.25rem' } : {};
    },
    singleModalTitle() {
      switch (this.singleSelectionTarget) {
      case SINGLE_SELECTION.BOOK:
        return this.$t('select_book');
      case SINGLE_SELECTION.CHAPTER:
        return this.$t('select_chapter');
      case SINGLE_SELECTION.VERSE:
        return this.$t('select_verse');
      default:
        return '';
      }
    },
    filteredBookOptions() {
      return filterAndSortBookOptions(getBookOptions(this.locale), {
        testament: this.selectedTestament,
        sortOrder: this.bookSortOrder,
        locale: this.locale,
      });
    },
    singleChapterMax() {
      if (!this.singleSelected.book) { return 1; }
      return Bible.getBookChapterCount(this.singleSelected.book);
    },
    singleVerseMax() {
      if (!this.singleSelected.book || !this.singleSelected.chapter) { return 1; }
      return Bible.getChapterVerseCount(this.singleSelected.book, this.singleSelected.chapter);
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(next) {
        if (this.isEditing) { return; }
        const range = next && typeof next === 'object' ? this.valueRange : null;
        if (!range) {
          this.localText = '';
          return;
        }
        this.localText = formatVerseRange(range, this.locale);
      },
    },
    locale() {
      if (!this.isEditing && this.valueRange) {
        this.localText = formatVerseRange(this.valueRange, this.locale);
      }
    },
  },
  methods: {
    emitRange(rangeOrNull) {
      this.$emit('input', rangeOrNull);
    },
    onTextInput(e) {
      this.localText = e?.target?.value ?? '';

      if (!this.hasText) {
        this.emitRange(null);
        return;
      }

      if (!this.isValid || !this.parsedRangeFromText) {
        // Keep the current model value unchanged while the user types invalid text.
        return;
      }

      const { startVerseId, endVerseId } = this.parsedRangeFromText;
      if (!this.multiVerse && startVerseId !== endVerseId) { return; }
      this.emitRange({ startVerseId, endVerseId });
    },
    onFocus() {
      this.isEditing = true;
    },
    clear() {
      this.localText = '';
      this.isEditing = false;
      this.emitRange(null);
    },
    onBlurNormalize() {
      this.isEditing = false;
      if (!this.isValid || !this.parsedRangeFromText) { return; }
      this.localText = formatVerseRange(this.parsedRangeFromText, this.locale);
    },
    openPicker() {
      if (this.multiVerse) {
        this.openMultiPicker();
      }
      else {
        this.openSinglePicker();
      }
    },

    // ---- Single verse picker ----
    openSinglePicker() {
      this.resetSingleSelection();

      const range = this.valueRange;
      if (range && range.startVerseId === range.endVerseId) {
        this.singleSelected = PassageSelection.singleSelectionFromVerseId(range.startVerseId);
      }

      this.singleSelectionTarget = SINGLE_SELECTION.BOOK;
    },
    closeSinglePicker() {
      this.singleSelectionTarget = null;
    },
    resetSingleSelection() {
      this.singleSelected = PassageSelection.emptySingleVerseSelection();
    },
    applySingleResult(result) {
      this.singleSelected = result.selection;
      if (result.step === 'done') {
        this.finalizeSingleSelection(result.verseId);
      }
      else {
        this.singleSelectionTarget = STEP_TO_TARGET[result.step];
      }
    },
    selectSingleBook(bookIndex) {
      this.applySingleResult(PassageSelection.singleSelectBook(bookIndex));
    },
    selectSingleChapter({ from, to }) {
      this.applySingleResult(PassageSelection.singleSelectChapter(this.singleSelected, to || from));
    },
    selectSingleVerse({ from, to }) {
      this.applySingleResult(PassageSelection.singleSelectVerse(this.singleSelected, to || from));
    },
    finalizeSingleSelection(verseId) {
      if (!verseId) { return; }
      this.localText = formatVerseRange({ startVerseId: verseId, endVerseId: verseId }, this.locale);
      this.isEditing = false;
      this.emitRange({ startVerseId: verseId, endVerseId: verseId });
      this.closeSinglePicker();
    },

    // ---- Multi verse picker (PassageSelector) ----
    openMultiPicker() {
      const range = this.valueRange || this.parsedRangeFromText;
      this.passageSelectorPopulateWith = range ? { ...range } : { empty: true };
      this.passageSelectorKey += 1;
      this.$nextTick(() => {
        const selector = this.$refs.passageSelector;
        if (selector && typeof selector.openSelectBook === 'function') {
          selector.openSelectBook();
        }
      });
    },
    onPassageSelectorChange({ startVerseId, endVerseId }) {
      this.localText = formatVerseRange({ startVerseId, endVerseId }, this.locale);
      this.isEditing = false;
      this.emitRange({ startVerseId, endVerseId });
    },
  },
};
</script>

<i18n lang="json">
{
  "en": {
    "example_prefix": "e.g.",
    "invalid_single": "Enter a single verse like “{example}”.",
    "invalid_multi": "Invalid reference. Try “{example1}” or “{example2}”.",
    "select_book": "Select Book",
    "select_chapter": "Select Chapter",
    "select_verse": "Select Verse",
    "pick": "Pick",
    "aria_clear": "Clear",
    "aria_pick": "Pick verse",
    "old_testament_short": "OT",
    "new_testament_short": "NT"
  },
  "de": {
    "example_prefix": "z.B.",
    "invalid_single": "Gib einen einzelnen Vers ein, z.B. „{example}“.",
    "invalid_multi": "Ungültige Referenz. Versuche „{example1}“ oder „{example2}“.",
    "select_book": "Wähle Buch",
    "select_chapter": "Wähle Kapitel",
    "select_verse": "Wähle Vers",
    "pick": "Auswählen",
    "aria_clear": "Leeren",
    "aria_pick": "Vers auswählen",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "es": {
    "example_prefix": "p. ej.",
    "invalid_single": "Introduce un solo versículo, por ejemplo “{example}”.",
    "invalid_multi": "Referencia inválida. Prueba “{example1}” o “{example2}”.",
    "select_book": "Seleccionar Libro",
    "select_chapter": "Seleccionar Capítulo",
    "select_verse": "Seleccionar Versículo",
    "pick": "Elegir",
    "aria_clear": "Borrar",
    "aria_pick": "Elegir versículo",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "fr": {
    "example_prefix": "p. ex.",
    "invalid_single": "Saisissez un seul verset, par exemple « {example} ».",
    "invalid_multi": "Référence invalide. Essayez « {example1} » ou « {example2} ».",
    "select_book": "Sélectionner le livre",
    "select_chapter": "Sélectionner le chapitre",
    "select_verse": "Sélectionner le verset",
    "pick": "Choisir",
    "aria_clear": "Effacer",
    "aria_pick": "Choisir un verset",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "ko": {
    "example_prefix": "예:",
    "invalid_single": "“{example}”처럼 한 절만 입력해 주세요.",
    "invalid_multi": "잘못된 참조입니다. “{example1}” 또는 “{example2}” 형식을 사용해 보세요.",
    "select_book": "책 선택",
    "select_chapter": "장 선택",
    "select_verse": "절 선택",
    "pick": "선택",
    "aria_clear": "지우기",
    "aria_pick": "절 선택",
    "old_testament_short": "구약",
    "new_testament_short": "신약"
  },
  "pt": {
    "example_prefix": "ex.",
    "invalid_single": "Digite um único versículo, por exemplo “{example}”.",
    "invalid_multi": "Referência inválida. Tente “{example1}” ou “{example2}”.",
    "select_book": "Selecionar Livro",
    "select_chapter": "Selecionar Capítulo",
    "select_verse": "Selecionar Versículo",
    "pick": "Selecionar",
    "aria_clear": "Limpar",
    "aria_pick": "Selecionar versículo",
    "old_testament_short": "AT",
    "new_testament_short": "NT"
  },
  "uk": {
    "example_prefix": "напр.",
    "invalid_single": "Введіть один вірш, наприклад “{example}”.",
    "invalid_multi": "Некоректне посилання. Спробуйте “{example1}” або “{example2}”.",
    "select_book": "Виберіть книгу",
    "select_chapter": "Виберіть розділ",
    "select_verse": "Виберіть вірш",
    "pick": "Вибрати",
    "aria_clear": "Очистити",
    "aria_pick": "Вибрати вірш",
    "old_testament_short": "СТ",
    "new_testament_short": "НЗ"
  }
}
</i18n>

<style scoped>
.verse-input__field {
  margin-bottom: 0;
}

.verse-input__input-control {
  position: relative;
  overflow: visible;
}

.verse-input__input {
  position: relative;
  z-index: 1;
}

.verse-input__clear {
  position: absolute;
  top: 50%;
  right: 0.65rem;
  transform: translateY(-50%);
  z-index: 5;
  pointer-events: auto;
}

.verse-input__help {
  margin-top: 0.35rem;
}

.verse-input__pick-button {
  white-space: nowrap;
}

.verse-input__hidden-passage-selector {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* Copied styling conventions from PassageSelector (kept local) */
.book-selector-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: space-between;
}

.button-group {
  display: flex;
}

.button-group--button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--mbl-border-strong);
  background: var(--mbl-bg);
  cursor: pointer;
  transition: 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
}

.button-group--button:hover {
  border-color: var(--mbl-link-bright);
  background: var(--mbl-message-info-bg);
}

.button-group--button.active {
  background: var(--mbl-link-bright);
  color: var(--mbl-on-accent);
  border-color: var(--mbl-link-bright);
}

.button-group--button.button-group--button-left {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-right: none;
}

.button-group--button.button-group--button-right {
  border-left: none;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}
</style>
