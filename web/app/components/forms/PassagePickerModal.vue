<template>
  <app-modal :open="open" :title="modalTitle" @close="emit('close')">
    <template #content>
      <template v-if="step === STEP.BOOK">
        <div class="book-selector-controls">
          <div class="button-group">
            <button
              type="button"
              class="button-group--button button-group--button-left"
              :class="{ active: selectedTestament === 'old' }"
              @click="selectedTestament = 'old'"
            >
              {{ t('old_testament') }}
            </button>
            <button
              type="button"
              class="button-group--button button-group--button-right"
              :class="{ active: selectedTestament === 'new' }"
              @click="selectedTestament = 'new'"
            >
              {{ t('new_testament') }}
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
        <grid-selector :options="filteredBookOptions" :columns="2" @selection="selectBook" />
      </template>

      <tap-range-selector
        v-if="step === STEP.START_CHAPTER"
        :min="1"
        :max="startChapterMax"
        :multi="false"
        :columns="8"
        @selection="selectStartChapter"
      />

      <tap-range-selector
        v-if="step === STEP.END_CHAPTER"
        :min="endChapterMin"
        :max="endChapterMax"
        :multi="false"
        :columns="8"
        @selection="selectEndChapter"
      />

      <tap-range-selector
        v-if="step === STEP.START_VERSE"
        :min="1"
        :max="startVerseMax"
        :multi="false"
        :columns="8"
        @selection="selectStartVerse"
      />

      <tap-range-selector
        v-if="step === STEP.END_VERSE"
        :min="endVerseMin"
        :max="endVerseMax"
        :multi="false"
        :columns="8"
        @selection="selectEndVerse"
      />
    </template>

    <template v-if="skipLabel" #footer>
      <button
        class="mbl-button passage-picker__skip"
        type="button"
        data-testid="passage-picker-skip"
        @click="skipStep"
      >
        {{ skipLabel }}
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import {
  Bible,
  PassageSelection,
  filterAndSortBookOptions,
  getBookOptions,
  type VerseRange,
} from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import GridSelector from '~/components/forms/GridSelector.vue';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';

/**
 * Button-only passage picker: a single-tap wizard through
 * book → start chapter → end chapter → start verse → end verse.
 *
 * Tapping a start chapter auto-selects verse 1, the same end chapter, and its
 * last verse (via the passage-selection machine's range defaults), so every
 * later step only refines an already-complete range and can be skipped.
 */

const props = withDefaults(defineProps<{
  open?: boolean;
  locale: string;
  seed?: VerseRange | null;
}>(), {
  open: false,
  seed: null,
});

const emit = defineEmits<{
  change: [value: VerseRange];
  close: [];
}>();

const { t } = useI18n();

const STEP = {
  BOOK: 'BOOK',
  START_CHAPTER: 'START_CHAPTER',
  END_CHAPTER: 'END_CHAPTER',
  START_VERSE: 'START_VERSE',
  END_VERSE: 'END_VERSE',
} as const;

type Step = typeof STEP[keyof typeof STEP];

const step = ref<Step>(STEP.BOOK);
const selected = ref(PassageSelection.emptyPassageSelection());
const options = ref(PassageSelection.buildPassageOptions(selected.value));

const selectedTestament = ref<'old' | 'new'>('old');
const bookSortOrder = ref<'numerical' | 'alphabetical'>('numerical');

const modalTitle = computed(() => {
  switch (step.value) {
  case STEP.BOOK: return t('select_book');
  case STEP.START_CHAPTER: return t('select_start_chapter');
  case STEP.END_CHAPTER: return t('select_end_chapter');
  case STEP.START_VERSE: return t('select_start_verse');
  case STEP.END_VERSE: return t('select_end_verse');
  default: return '';
  }
});

const skipLabel = computed(() => {
  switch (step.value) {
  case STEP.END_CHAPTER: return t('keep_chapter', { chapter: selected.value.startChapter });
  case STEP.START_VERSE: return t('keep_verse_1');
  case STEP.END_VERSE: return t('keep_last_verse');
  default: return '';
  }
});

const filteredBookOptions = computed(() => filterAndSortBookOptions(getBookOptions(props.locale), {
  testament: selectedTestament.value,
  sortOrder: bookSortOrder.value,
  locale: props.locale,
}));

const startChapterMax = computed(() =>
  selected.value.book ? Bible.getBookChapterCount(selected.value.book) : 1);

const endChapterMin = computed(() => options.value.endChapters[0] ?? 1);
const endChapterMax = computed(() => options.value.endChapters[options.value.endChapters.length - 1] ?? 1);

const startVerseMax = computed(() => options.value.startVerses[options.value.startVerses.length - 1] ?? 1);

const endVerseMin = computed(() => options.value.endVerses[0] ?? 1);
const endVerseMax = computed(() => options.value.endVerses[options.value.endVerses.length - 1] ?? 1);

watch(() => props.open, (open) => {
  if (!open) { return; }
  // Hydrate from the seed (without emitting) so re-opening the picker starts
  // from the current passage; always restart at the book step.
  if (props.seed) {
    const { state, options: seededOptions } = PassageSelection.passageSelectionFromRange(props.seed);
    selected.value = state;
    options.value = seededOptions;
  }
  else {
    selected.value = PassageSelection.emptyPassageSelection();
    options.value = PassageSelection.buildPassageOptions(selected.value);
  }
  step.value = STEP.BOOK;
});

function applyResult(result: PassageSelection.PassageSelectionResult) {
  selected.value = result.state;
  options.value = result.options;
  if (result.range) {
    emit('change', result.range);
  }
}

function selectBook(bookIndex: number) {
  const result = PassageSelection.selectBook(bookIndex);
  applyResult(result);
  // Single-chapter books auto-select their chapter; go straight to verses.
  step.value = result.state.startChapter ? STEP.START_VERSE : STEP.START_CHAPTER;
}

function selectStartChapter({ from, to }: { from: number; to: number }) {
  const chapter = to || from;
  applyResult(PassageSelection.selectChapters(selected.value, { from: chapter, to: chapter }));
  advanceFromStartChapter();
}

function advanceFromStartChapter() {
  // When the start chapter is the book's last chapter there is no end chapter
  // to choose.
  step.value = options.value.endChapters.length > 1 ? STEP.END_CHAPTER : STEP.START_VERSE;
}

function selectEndChapter({ from, to }: { from: number; to: number }) {
  applyResult(PassageSelection.selectEndChapter(selected.value, to || from));
  step.value = STEP.START_VERSE;
}

function selectStartVerse({ from, to }: { from: number; to: number }) {
  applyResult(PassageSelection.selectStartVerse(selected.value, from || to));
  step.value = STEP.END_VERSE;
}

function selectEndVerse({ from, to }: { from: number; to: number }) {
  applyResult(PassageSelection.selectEndVerse(selected.value, to || from));
  emit('close');
}

function skipStep() {
  switch (step.value) {
  case STEP.END_CHAPTER:
    step.value = STEP.START_VERSE;
    break;
  case STEP.START_VERSE:
    step.value = STEP.END_VERSE;
    break;
  case STEP.END_VERSE:
    emit('close');
    break;
  }
}
</script>

<i18n lang="json">
{
  "en": {
    "select_book": "Select Book",
    "select_start_chapter": "Select Start Chapter",
    "select_end_chapter": "Select End Chapter",
    "select_start_verse": "Select Start Verse",
    "select_end_verse": "Select End Verse",
    "old_testament": "Old Testament",
    "new_testament": "New Testament",
    "keep_chapter": "Keep chapter {chapter}",
    "keep_verse_1": "Keep verse 1",
    "keep_last_verse": "Keep last verse"
  },
  "de": {
    "select_book": "Wähle Buch",
    "select_start_chapter": "Wähle Startkapitel",
    "select_end_chapter": "Wähle Endkapitel",
    "select_start_verse": "Wähle Startvers",
    "select_end_verse": "Wähle Endvers",
    "old_testament": "Altes Testament",
    "new_testament": "Neues Testament",
    "keep_chapter": "Kapitel {chapter} behalten",
    "keep_verse_1": "Vers 1 behalten",
    "keep_last_verse": "Letzten Vers behalten"
  },
  "es": {
    "select_book": "Seleccionar Libro",
    "select_start_chapter": "Seleccionar Capítulo Inicial",
    "select_end_chapter": "Seleccionar Capítulo Final",
    "select_start_verse": "Seleccionar Versículo Inicial",
    "select_end_verse": "Seleccionar Versículo Final",
    "old_testament": "Antiguo Testamento",
    "new_testament": "Nuevo Testamento",
    "keep_chapter": "Mantener capítulo {chapter}",
    "keep_verse_1": "Mantener versículo 1",
    "keep_last_verse": "Mantener último versículo"
  },
  "fr": {
    "select_book": "Sélectionner le livre",
    "select_start_chapter": "Sélectionner le chapitre de début",
    "select_end_chapter": "Sélectionner le chapitre de fin",
    "select_start_verse": "Sélectionner le verset de début",
    "select_end_verse": "Sélectionner le verset de fin",
    "old_testament": "Ancien Testament",
    "new_testament": "Nouveau Testament",
    "keep_chapter": "Garder le chapitre {chapter}",
    "keep_verse_1": "Garder le verset 1",
    "keep_last_verse": "Garder le dernier verset"
  },
  "ko": {
    "select_book": "책 선택",
    "select_start_chapter": "시작 장 선택",
    "select_end_chapter": "끝 장 선택",
    "select_start_verse": "시작 절 선택",
    "select_end_verse": "끝 절 선택",
    "old_testament": "구약",
    "new_testament": "신약",
    "keep_chapter": "{chapter}장 유지",
    "keep_verse_1": "1절 유지",
    "keep_last_verse": "마지막 절 유지"
  },
  "pt": {
    "select_book": "Selecionar Livro",
    "select_start_chapter": "Selecionar Capítulo Inicial",
    "select_end_chapter": "Selecionar Capítulo Final",
    "select_start_verse": "Selecionar Versículo Inicial",
    "select_end_verse": "Selecionar Versículo Final",
    "old_testament": "Antigo Testamento",
    "new_testament": "Novo Testamento",
    "keep_chapter": "Manter capítulo {chapter}",
    "keep_verse_1": "Manter versículo 1",
    "keep_last_verse": "Manter último versículo"
  },
  "uk": {
    "select_book": "Виберіть книгу",
    "select_start_chapter": "Виберіть початковий розділ",
    "select_end_chapter": "Виберіть кінцевий розділ",
    "select_start_verse": "Виберіть початковий вірш",
    "select_end_verse": "Виберіть кінцевий вірш",
    "old_testament": "Старий Завіт",
    "new_testament": "Новий Завіт",
    "keep_chapter": "Залишити розділ {chapter}",
    "keep_verse_1": "Залишити вірш 1",
    "keep_last_verse": "Залишити останній вірш"
  }
}
</i18n>

<style scoped>
.passage-picker__skip {
  width: 100%;
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
