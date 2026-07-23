<template>
  <div class="verse-input">
    <div class="mbl-field mbl-field--addons verse-input__field">
      <div class="mbl-control mbl-control--expanded verse-input__input-control">
        <input
          :value="localText"
          class="mbl-input verse-input__input"
          type="text"
          :placeholder="placeholder"
          :data-testid="inputTestId || undefined"
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
          :aria-label="t('aria_clear')"
          @click="clear"
        />
      </div>
      <div class="mbl-control">
        <button
          class="mbl-button verse-input__pick-button"
          type="button"
          :aria-label="t('aria_pick')"
          @click="openPicker"
        >
          {{ t('pick') }}
        </button>
      </div>
    </div>

    <p v-if="showInvalid" class="mbl-help mbl-help--danger verse-input__help">
      {{ invalidHelpText }}
    </p>

    <!-- Single-verse picker flow -->
    <app-modal :open="!!singleSelectionTarget" :title="singleModalTitle" @close="closeSinglePicker">
      <template #content>
        <template v-if="singleSelectionTarget === SINGLE_SELECTION.BOOK">
          <div class="book-selector-controls">
            <div class="button-group">
              <button
                type="button"
                class="button-group--button button-group--button-left"
                :class="{ active: selectedTestament === 'old' }"
                @click="selectedTestament = 'old'"
              >
                {{ t('old_testament_short') }}
              </button>
              <button
                type="button"
                class="button-group--button button-group--button-right"
                :class="{ active: selectedTestament === 'new' }"
                @click="selectedTestament = 'new'"
              >
                {{ t('new_testament_short') }}
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

    <!-- Multi-verse picker (PassageSelector) -->
    <passage-selector
      v-if="multiVerse"
      ref="passageSelectorRef"
      class="verse-input__hidden-passage-selector"
      :populate-with="passageSelectorPopulateWith"
      @change="onPassageSelectorChange"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Bible,
  PassageSelection,
  coerceVerseRange,
  filterAndSortBookOptions,
  formatVerseRange,
  getBookOptions,
  parseVerseInput,
} from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import GridSelector from '~/components/forms/GridSelector.vue';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';
import PassageSelector from '~/components/forms/PassageSelector.vue';
import { useUserSettingsStore } from '~/stores/user-settings';

const props = withDefaults(defineProps<{
  modelValue?: { startVerseId: number; endVerseId: number } | null;
  multiVerse?: boolean;
  inputTestId?: string;
}>(), {
  modelValue: null,
  multiVerse: false,
  inputTestId: '',
});

const emit = defineEmits<{ 'update:modelValue': [value: { startVerseId: number; endVerseId: number } | null] }>();

const { t, locale } = useI18n();

const SINGLE_SELECTION = { BOOK: 'BOOK', CHAPTER: 'CHAPTER', VERSE: 'VERSE' } as const;
type SingleSelection = typeof SINGLE_SELECTION[keyof typeof SINGLE_SELECTION] | null;

// Maps the single-verse machine's next-step hint to a modal target.
const STEP_TO_TARGET: Record<'book' | 'chapter' | 'verse', SingleSelection> = {
  book: SINGLE_SELECTION.BOOK,
  chapter: SINGLE_SELECTION.CHAPTER,
  verse: SINGLE_SELECTION.VERSE,
};

const localText = ref('');
const isEditing = ref(false);
const selectedTestament = ref<'old' | 'new'>('old');
const bookSortOrder = ref<'numerical' | 'alphabetical'>('numerical');
const singleSelectionTarget = ref<SingleSelection>(null);
const singleSelected = ref(PassageSelection.emptySingleVerseSelection());
const passageSelectorKey = ref(0);
type PassageSeed = { empty: true } | { empty?: false; startVerseId: number; endVerseId: number };
const passageSelectorPopulateWith = ref<PassageSeed>({ empty: true });
const passageSelectorRef = ref<{ openSelectBook:() => void } | null>(null);

const valueRange = computed(() => coerceVerseRange(props.modelValue));

const parsedInput = computed(() => parseVerseInput(localText.value, { locale: locale.value, multiVerse: props.multiVerse }));

const hasText = computed(() => parsedInput.value.hasText);

const parsedRangeFromText = computed(() => parsedInput.value.range);

const isValid = computed(() => parsedInput.value.isValid);

const showInvalid = computed(() => hasText.value && !isValid.value);

const exampleSingle = computed(() => {
  const verseId = Bible.makeVerseId(43, 3, 16);
  return Bible.displayVerseRange(verseId, verseId, locale.value);
});

const exampleMultiPrimary = computed(() => {
  const startVerseId = Bible.makeVerseId(43, 3, 16);
  const endVerseId = Bible.makeVerseId(43, 3, 18);
  return Bible.displayVerseRange(startVerseId, endVerseId, locale.value);
});

const exampleMultiSecondary = computed(() => {
  const startVerseId = Bible.makeVerseId(44, 2, 1);
  const endVerse = Bible.getChapterVerseCount(44, 4);
  const endVerseId = Bible.makeVerseId(44, 4, endVerse);
  return Bible.displayVerseRange(startVerseId, endVerseId, locale.value);
});

const placeholder = computed(() => {
  const prefix = t('example_prefix');
  const example = props.multiVerse ? exampleMultiPrimary.value : exampleSingle.value;
  return `${prefix} ${example}`;
});

const invalidHelpText = computed(() =>
  props.multiVerse
    ? t('invalid_multi', { example1: exampleMultiPrimary.value, example2: exampleMultiSecondary.value })
    : t('invalid_single', { example: exampleSingle.value }),
);

const inputStyle = computed(() => hasText.value ? { paddingRight: '2.25rem' } : {});

const singleModalTitle = computed(() => {
  switch (singleSelectionTarget.value) {
  case SINGLE_SELECTION.BOOK: return t('select_book');
  case SINGLE_SELECTION.CHAPTER: return t('select_chapter');
  case SINGLE_SELECTION.VERSE: return t('select_verse');
  default: return '';
  }
});

const includeDeuterocanonical = computed(() => useUserSettingsStore().settings.includeDeuterocanonical);

const filteredBookOptions = computed(() => filterAndSortBookOptions(
  getBookOptions(locale.value, includeDeuterocanonical.value), {
    testament: selectedTestament.value,
    sortOrder: bookSortOrder.value,
    locale: locale.value,
  }));

const singleChapterMax = computed(() => {
  if (!singleSelected.value.book) { return 1; }
  return Bible.getBookChapterCount(singleSelected.value.book);
});

const singleVerseMax = computed(() => {
  if (!singleSelected.value.book || !singleSelected.value.chapter) { return 1; }
  return Bible.getChapterVerseCount(singleSelected.value.book, singleSelected.value.chapter);
});

watch(() => props.modelValue, (next) => {
  if (isEditing.value) { return; }
  const range = next && typeof next === 'object' ? valueRange.value : null;
  if (!range) {
    localText.value = '';
    return;
  }
  localText.value = formatVerseRange(range, locale.value);
}, { immediate: true });

watch(locale, () => {
  if (!isEditing.value && valueRange.value) {
    localText.value = formatVerseRange(valueRange.value, locale.value);
  }
});

function onTextInput(e: Event) {
  localText.value = (e?.target as HTMLInputElement)?.value ?? '';
  if (!hasText.value) { emit('update:modelValue', null); return; }
  if (!isValid.value || !parsedRangeFromText.value) { return; }
  const { startVerseId, endVerseId } = parsedRangeFromText.value;
  if (!props.multiVerse && startVerseId !== endVerseId) { return; }
  emit('update:modelValue', { startVerseId, endVerseId });
}

function onFocus() { isEditing.value = true; }

function clear() {
  localText.value = '';
  isEditing.value = false;
  emit('update:modelValue', null);
}

function onBlurNormalize() {
  isEditing.value = false;
  if (!isValid.value || !parsedRangeFromText.value) { return; }
  localText.value = formatVerseRange(parsedRangeFromText.value, locale.value);
}

function openPicker() {
  if (props.multiVerse) { openMultiPicker(); }
  else { openSinglePicker(); }
}

function openSinglePicker() {
  singleSelected.value = PassageSelection.emptySingleVerseSelection();
  const range = valueRange.value;
  if (range && range.startVerseId === range.endVerseId) {
    singleSelected.value = PassageSelection.singleSelectionFromVerseId(range.startVerseId);
  }
  singleSelectionTarget.value = SINGLE_SELECTION.BOOK;
}

function closeSinglePicker() { singleSelectionTarget.value = null; }

function applySingleResult(result: PassageSelection.SingleSelectionResult) {
  singleSelected.value = result.selection;
  if (result.step === 'done') {
    finalizeSingleSelection(result.verseId);
  }
  else {
    singleSelectionTarget.value = STEP_TO_TARGET[result.step];
  }
}

function selectSingleBook(bookIndex: number) {
  applySingleResult(PassageSelection.singleSelectBook(bookIndex));
}

function selectSingleChapter({ from, to }: { from: number; to: number }) {
  applySingleResult(PassageSelection.singleSelectChapter(singleSelected.value, to || from));
}

function selectSingleVerse({ from, to }: { from: number; to: number }) {
  applySingleResult(PassageSelection.singleSelectVerse(singleSelected.value, to || from));
}

function finalizeSingleSelection(verseId: number | null) {
  if (!verseId) { return; }
  localText.value = formatVerseRange({ startVerseId: verseId, endVerseId: verseId }, locale.value);
  isEditing.value = false;
  emit('update:modelValue', { startVerseId: verseId, endVerseId: verseId });
  closeSinglePicker();
}

function openMultiPicker() {
  const range = valueRange.value || parsedRangeFromText.value;
  passageSelectorPopulateWith.value = range ? { ...range } : { empty: true };
  passageSelectorKey.value += 1;
  nextTick(() => {
    passageSelectorRef.value?.openSelectBook();
  });
}

function onPassageSelectorChange({ startVerseId, endVerseId }: { startVerseId: number; endVerseId: number }) {
  localText.value = formatVerseRange({ startVerseId, endVerseId }, locale.value);
  isEditing.value = false;
  emit('update:modelValue', { startVerseId, endVerseId });
}
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
    "invalid_single": "Saisissez un seul verset, par exemple «\u00a0{example}\u00a0».",
    "invalid_multi": "Référence invalide. Essayez «\u00a0{example1}\u00a0» ou «\u00a0{example2}\u00a0».",
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
.verse-input__field { margin-bottom: 0; }

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

.verse-input__help { margin-top: 0.35rem; }
.verse-input__pick-button { white-space: nowrap; }

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

.book-selector-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: space-between;
}

.button-group { display: flex; }

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
