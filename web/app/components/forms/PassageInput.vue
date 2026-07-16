<template>
  <div class="passage-input">
    <div class="mbl-field mbl-field--addons passage-input__field">
      <div class="mbl-control mbl-control--expanded passage-input__input-control">
        <input
          ref="inputRef"
          :value="localText"
          class="mbl-input passage-input__input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="showSuggestions ? 'true' : 'false'"
          :aria-controls="listboxId"
          :aria-activedescendant="activeSuggestionId"
          :placeholder="placeholder"
          :disabled="disabled"
          :data-testid="inputTestId || undefined"
          :class="{ 'mbl-input--danger': showInvalid }"
          :style="inputStyle"
          @input="onTextInput"
          @focus="onFocus"
          @blur="onBlur"
          @keydown="onKeydown"
        >
        <button
          v-if="hasText && !disabled"
          class="mbl-delete mbl-delete--sm passage-input__clear"
          type="button"
          :aria-label="t('aria_clear')"
          @click="clear"
        />
        <ul
          v-if="showSuggestions"
          :id="listboxId"
          class="passage-input__suggestions"
          :style="suggestionsStyle"
          role="listbox"
          :aria-label="t('aria_suggestions')"
          :data-testid="inputTestId ? `${inputTestId}-suggestions` : undefined"
        >
          <li
            v-for="(suggestion, index) in suggestions"
            :id="suggestionId(index)"
            :key="suggestion.book"
            class="passage-input__suggestion"
            role="option"
            :aria-selected="index === activeSuggestionIndex ? 'true' : 'false'"
            :class="{ 'passage-input__suggestion--active': index === activeSuggestionIndex }"
            :data-testid="inputTestId ? `${inputTestId}-suggestion-${suggestion.book}` : undefined"
            @mousedown.prevent="fillSuggestion(suggestion)"
          >
            {{ suggestion.label }}
          </li>
        </ul>
      </div>
      <div class="mbl-control">
        <button
          class="mbl-button passage-input__pick-button"
          type="button"
          :aria-label="t('aria_pick')"
          :disabled="disabled"
          @click="openPicker"
        >
          {{ t('pick') }}
        </button>
      </div>
    </div>

    <p v-if="showInvalid" class="mbl-help mbl-help--danger passage-input__help">
      {{ t('invalid', { example1: examplePrimary, example2: exampleSecondary }) }}
    </p>

    <passage-picker-modal
      :open="pickerOpen"
      :locale="locale"
      :seed="pickerSeed"
      @change="onPickerChange"
      @close="pickerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Bible,
  coerceVerseRange,
  formatVerseRange,
  parseVerseInput,
  suggestBooks,
  type BookSuggestion,
  type VerseRange,
} from '@mybiblelog/shared';
import PassagePickerModal from '~/components/forms/PassagePickerModal.vue';

/**
 * The one passage (verse range) selector: a typed reference input with
 * book-name autocomplete plus a "Pick" button for a tap-only flow.
 *
 * Contract with the parent: `modelValue` always mirrors the visible text —
 * a range for valid text, null for empty OR invalid text (never stale) —
 * while `update:valid` reports whether the current text is acceptable
 * (empty counts as valid; requiredness is the parent's concern). Invalid
 * styling is only shown once the field loses focus.
 */

const props = withDefaults(defineProps<{
  modelValue?: VerseRange | null;
  locale: string;
  inputTestId?: string;
  disabled?: boolean;
}>(), {
  modelValue: null,
  inputTestId: '',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: VerseRange | null];
  'update:valid': [valid: boolean];
}>();

const { t } = useI18n();

const listboxId = props.inputTestId
  ? `${props.inputTestId}-listbox`
  : `passage-input-listbox-${Math.random().toString(36).slice(2, 8)}`;

const inputRef = ref<HTMLInputElement | null>(null);
const localText = ref('');
const isEditing = ref(false);
const suggestionsSuppressed = ref(false);
const activeSuggestionIndex = ref(-1);
const pickerOpen = ref(false);

const valueRange = computed(() => coerceVerseRange(props.modelValue));

const parsedInput = computed(() => parseVerseInput(localText.value, { locale: props.locale, multiVerse: true }));

const hasText = computed(() => parsedInput.value.hasText);

const parsedRangeFromText = computed(() => parsedInput.value.range);

const isValid = computed(() => parsedInput.value.isValid);

const isInputValid = computed(() => !hasText.value || isValid.value);

const showInvalid = computed(() => hasText.value && !isValid.value && !isEditing.value);

const suggestions = computed<BookSuggestion[]>(() => {
  if (!isEditing.value || suggestionsSuppressed.value) { return []; }
  return suggestBooks(localText.value, { locale: props.locale, limit: 8 });
});

const showSuggestions = computed(() => suggestions.value.length > 0);

const activeSuggestionId = computed(() =>
  activeSuggestionIndex.value >= 0 ? suggestionId(activeSuggestionIndex.value) : undefined);

const examplePrimary = computed(() => {
  const startVerseId = Bible.makeVerseId(43, 3, 16);
  const endVerseId = Bible.makeVerseId(43, 3, 18);
  return Bible.displayVerseRange(startVerseId, endVerseId, props.locale);
});

const exampleSecondary = computed(() => {
  const startVerseId = Bible.makeVerseId(44, 2, 1);
  const endVerse = Bible.getChapterVerseCount(44, 4);
  const endVerseId = Bible.makeVerseId(44, 4, endVerse);
  return Bible.displayVerseRange(startVerseId, endVerseId, props.locale);
});

const placeholder = computed(() => `${t('example_prefix')} ${examplePrimary.value}`);

const inputStyle = computed(() => hasText.value ? { paddingRight: '2.25rem' } : {});

const pickerSeed = computed(() => valueRange.value || parsedRangeFromText.value);

function suggestionId(index: number) {
  return `${listboxId}-option-${index}`;
}

// The dropdown is position: fixed and placed from the input's measured rect so
// it can escape overflow-clipping ancestors (e.g. a modal body with
// overflow: auto). Reposition on any scroll/resize while open.
const suggestionsStyle = ref<Record<string, string>>({});

function updateSuggestionsPosition() {
  const el = inputRef.value;
  if (!el) { return; }
  const rect = el.getBoundingClientRect();
  suggestionsStyle.value = {
    top: `${rect.bottom + 2}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
}

watch(showSuggestions, (show) => {
  if (typeof window === 'undefined') { return; }
  if (show) {
    updateSuggestionsPosition();
    window.addEventListener('scroll', updateSuggestionsPosition, true);
    window.addEventListener('resize', updateSuggestionsPosition);
  }
  else {
    window.removeEventListener('scroll', updateSuggestionsPosition, true);
    window.removeEventListener('resize', updateSuggestionsPosition);
  }
});

onUnmounted(() => {
  if (typeof window === 'undefined') { return; }
  window.removeEventListener('scroll', updateSuggestionsPosition, true);
  window.removeEventListener('resize', updateSuggestionsPosition);
});

watch(() => props.modelValue, (next) => {
  if (isEditing.value) { return; }
  const range = next && typeof next === 'object' ? valueRange.value : null;
  if (!range) {
    localText.value = '';
    return;
  }
  localText.value = formatVerseRange(range, props.locale);
}, { immediate: true });

watch(() => props.locale, () => {
  if (!isEditing.value && valueRange.value) {
    localText.value = formatVerseRange(valueRange.value, props.locale);
  }
});

watch(isInputValid, valid => emit('update:valid', valid));

onMounted(() => emit('update:valid', isInputValid.value));

function emitFromText() {
  if (!hasText.value || !isValid.value || !parsedRangeFromText.value) {
    emit('update:modelValue', null);
    return;
  }
  const { startVerseId, endVerseId } = parsedRangeFromText.value;
  emit('update:modelValue', { startVerseId, endVerseId });
}

function onTextInput(e: Event) {
  localText.value = (e?.target as HTMLInputElement)?.value ?? '';
  suggestionsSuppressed.value = false;
  activeSuggestionIndex.value = -1;
  emitFromText();
}

function onFocus() {
  isEditing.value = true;
}

function onBlur() {
  isEditing.value = false;
  activeSuggestionIndex.value = -1;
  if (isValid.value && parsedRangeFromText.value) {
    localText.value = formatVerseRange(parsedRangeFromText.value, props.locale);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value) { return; }
  const count = suggestions.value.length;
  switch (e.key) {
  case 'ArrowDown':
    e.preventDefault();
    activeSuggestionIndex.value = (activeSuggestionIndex.value + 1) % count;
    break;
  case 'ArrowUp':
    e.preventDefault();
    activeSuggestionIndex.value = (activeSuggestionIndex.value - 1 + count) % count;
    break;
  case 'Enter':
    if (activeSuggestionIndex.value >= 0) {
      e.preventDefault();
      fillSuggestion(suggestions.value[activeSuggestionIndex.value]!);
    }
    break;
  case 'Escape':
    e.preventDefault();
    suggestionsSuppressed.value = true;
    activeSuggestionIndex.value = -1;
    break;
  }
}

function fillSuggestion(suggestion: BookSuggestion) {
  localText.value = `${suggestion.label} `;
  suggestionsSuppressed.value = true;
  activeSuggestionIndex.value = -1;
  inputRef.value?.focus();
  emitFromText();
}

function clear() {
  localText.value = '';
  isEditing.value = false;
  suggestionsSuppressed.value = false;
  activeSuggestionIndex.value = -1;
  emit('update:modelValue', null);
}

function focus() {
  inputRef.value?.focus();
}

function openPicker() {
  pickerOpen.value = true;
}

function onPickerChange(range: VerseRange) {
  localText.value = formatVerseRange(range, props.locale);
  isEditing.value = false;
  emit('update:modelValue', { ...range });
}

defineExpose({ focus, openPicker });
</script>

<i18n lang="json">
{
  "en": {
    "example_prefix": "e.g.",
    "invalid": "Invalid reference. Try “{example1}” or “{example2}”.",
    "pick": "Pick",
    "aria_clear": "Clear",
    "aria_pick": "Pick passage",
    "aria_suggestions": "Book suggestions"
  },
  "de": {
    "example_prefix": "z.B.",
    "invalid": "Ungültige Referenz. Versuche „{example1}“ oder „{example2}“.",
    "pick": "Auswählen",
    "aria_clear": "Leeren",
    "aria_pick": "Abschnitt auswählen",
    "aria_suggestions": "Buchvorschläge"
  },
  "es": {
    "example_prefix": "p. ej.",
    "invalid": "Referencia inválida. Prueba “{example1}” o “{example2}”.",
    "pick": "Elegir",
    "aria_clear": "Borrar",
    "aria_pick": "Elegir pasaje",
    "aria_suggestions": "Sugerencias de libros"
  },
  "fr": {
    "example_prefix": "p. ex.",
    "invalid": "Référence invalide. Essayez «\u00a0{example1}\u00a0» ou «\u00a0{example2}\u00a0».",
    "pick": "Choisir",
    "aria_clear": "Effacer",
    "aria_pick": "Choisir un passage",
    "aria_suggestions": "Suggestions de livres"
  },
  "ko": {
    "example_prefix": "예:",
    "invalid": "잘못된 참조입니다. “{example1}” 또는 “{example2}” 형식을 사용해 보세요.",
    "pick": "선택",
    "aria_clear": "지우기",
    "aria_pick": "구절 선택",
    "aria_suggestions": "책 추천"
  },
  "pt": {
    "example_prefix": "ex.",
    "invalid": "Referência inválida. Tente “{example1}” ou “{example2}”.",
    "pick": "Selecionar",
    "aria_clear": "Limpar",
    "aria_pick": "Selecionar passagem",
    "aria_suggestions": "Sugestões de livros"
  },
  "uk": {
    "example_prefix": "напр.",
    "invalid": "Некоректне посилання. Спробуйте “{example1}” або “{example2}”.",
    "pick": "Вибрати",
    "aria_clear": "Очистити",
    "aria_pick": "Вибрати уривок",
    "aria_suggestions": "Пропозиції книг"
  }
}
</i18n>

<style scoped>
.passage-input__field { margin-bottom: 0; }

.passage-input__input-control {
  position: relative;
  overflow: visible;
}

.passage-input__input {
  position: relative;
  z-index: 1;
}

.passage-input__clear {
  position: absolute;
  top: 50%;
  right: 0.65rem;
  transform: translateY(-50%);
  z-index: 5;
  pointer-events: auto;
}

.passage-input__suggestions {
  position: fixed;
  z-index: 100;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--mbl-bg);
  border: 1px solid var(--mbl-border-strong);
  border-radius: 5px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  max-height: 14rem;
  overflow-y: auto;
}

.passage-input__suggestion {
  padding: 0.5rem 0.75rem;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.15s ease-out, background-color 0.15s ease-out;
}

.passage-input__suggestion:hover,
.passage-input__suggestion--active {
  color: var(--mbl-on-accent);
  background: var(--mbl-link-bright);
}

.passage-input__help { margin-top: 0.35rem; }
.passage-input__pick-button { white-space: nowrap; }
</style>
