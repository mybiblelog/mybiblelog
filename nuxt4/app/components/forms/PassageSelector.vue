<template>
  <div>
    <div class="passage-selector">
      <div class="part" @click="openSelectBook">
        <template v-if="!selected.book">{{ t('select_book') }}</template>
        <template v-if="selected.book">{{ bookName }}</template>
      </div>
      <template v-if="selected.book">
        <div class="part" @click="openSelectChapters">
          <template v-if="!selected.startChapter">*</template>
          <template v-if="selected.startChapter">{{ selected.startChapter }}</template>
        </div>
        <template v-if="selected.startChapter">
          :
          <div class="part" @click="selected.endChapter === selected.startChapter ? openSelectVerses() : openSelectStartVerse()">
            <template v-if="!selected.startVerse">*</template>
            <template v-if="selected.startVerse">{{ selected.startVerse }}</template>
          </div>
          <template v-if="selected.endChapter === selected.startChapter && selected.startVerse && selected.endVerse !== selected.startVerse">
            -
            <div class="part" @click="openSelectEndVerse">
              <template v-if="!selected.endVerse">*</template>
              <template v-if="selected.endVerse">{{ selected.endVerse }}</template>
            </div>
          </template>
        </template>
        <template v-if="selected.endChapter && selected.endChapter !== selected.startChapter">
          -
          <div class="part" @click="openSelectEndChapter">{{ selected.endChapter }}</div>:
          <div class="part" @click="openSelectEndVerse">
            <template v-if="!selected.endVerse">*</template>
            <template v-if="selected.endVerse">{{ selected.endVerse }}</template>
          </div>
        </template>
      </template>
    </div>

    <AppModal :open="!!selectionTarget" :title="modalTitle" @close="endSelection">
      <template #content>
        <template v-if="selectionTarget === SELECTION.BOOK">
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
          <GridSelector :options="filteredBookOptions" :columns="2" @selection="selectBook" />
        </template>

        <template v-if="selectionTarget === SELECTION.CHAPTERS">
          <div class="selector-note">{{ t('select_chapters_note') }}</div>
          <TapRangeSelector :min="startChapters[0]" :max="startChapters[startChapters.length - 1]" :columns="8" @selection="selectChapters" />
        </template>

        <TapRangeSelector
          v-if="selectionTarget === SELECTION.END_CHAPTER"
          :min="endChapters[0]"
          :max="endChapters[endChapters.length - 1]"
          :multi="false"
          :columns="8"
          @selection="selectEndChapter"
        />

        <template v-if="selectionTarget === SELECTION.VERSES">
          <div class="selector-note">{{ t('select_verses_note') }}</div>
          <TapRangeSelector :min="startVerses[0]" :max="startVerses[startVerses.length - 1]" :columns="8" @selection="selectVerses" />
        </template>

        <TapRangeSelector
          v-if="selectionTarget === SELECTION.START_VERSE"
          :min="startVerses[0]"
          :max="startVerses[startVerses.length - 1]"
          :multi="false"
          :columns="8"
          @selection="selectStartVerse"
        />

        <TapRangeSelector
          v-if="selectionTarget === SELECTION.END_VERSE"
          :min="endVerses[0]"
          :max="endVerses[endVerses.length - 1]"
          :multi="false"
          :columns="8"
          @selection="selectEndVerse"
        />
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import GridSelector from '~/components/forms/GridSelector.vue';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';

const props = withDefaults(defineProps<{
  populateWith?: Record<string, unknown>;
}>(), {
  populateWith: () => ({ empty: true }),
});

const emit = defineEmits<{ change: [value: { startVerseId: number; endVerseId: number }] }>();

const { t, locale } = useI18n();

const SELECTION = {
  BOOK: 'BOOK',
  CHAPTERS: 'CHAPTERS',
  END_CHAPTER: 'END_CHAPTER',
  VERSES: 'VERSES',
  START_VERSE: 'START_VERSE',
  END_VERSE: 'END_VERSE',
} as const;

type SelectionTarget = typeof SELECTION[keyof typeof SELECTION] | null;

const selected = reactive({
  book: 0,
  startChapter: 0,
  startVerse: 0,
  endChapter: 0,
  endVerse: 0,
});

const selectionTarget = ref<SelectionTarget>(null);
const books = ref<Array<{ bibleOrder: number; newTestament: boolean }>>([]);
const bookOptions = ref<Array<{ label: string; value: number }>>([]);
const startChapters = ref<number[]>([]);
const startVerses = ref<number[]>([]);
const endChapters = ref<number[]>([]);
const endVerses = ref<number[]>([]);
const silent = ref(false);
const selectedTestament = ref<'old' | 'new'>('old');
const bookSortOrder = ref<'numerical' | 'alphabetical'>('numerical');

const bookName = computed(() => Bible.getBookName(selected.book, locale.value));

const modalTitle = computed(() => {
  switch (selectionTarget.value) {
    case SELECTION.BOOK: return t('select_book');
    case SELECTION.CHAPTERS: return t('select_chapters');
    case SELECTION.END_CHAPTER: return t('select_end_chapter');
    case SELECTION.VERSES: return t('select_verses');
    case SELECTION.START_VERSE: return t('select_start_verse');
    case SELECTION.END_VERSE: return t('select_end_verse');
    default: return '';
  }
});

const filteredBookOptions = computed(() => {
  let filtered = bookOptions.value.filter((book) => {
    const bookData = books.value.find(b => b.bibleOrder === book.value);
    if (!bookData) { return false; }
    return selectedTestament.value === 'old' ? !bookData.newTestament : bookData.newTestament;
  });

  if (bookSortOrder.value === 'alphabetical') {
    filtered = [...filtered].sort((a, b) => {
      const strip = (s: string) => s.replace(/^\d+\s*/, '').trim();
      return strip(a.label).localeCompare(strip(b.label), locale.value);
    });
  }
  else {
    filtered = [...filtered].sort((a, b) => a.value - b.value);
  }

  return filtered;
});

function emitCurrentValue() {
  if (silent.value) { return; }
  const book = selected.book;
  const startChapter = selected.startChapter || 1;
  const endChapter = selected.endChapter || Bible.getBookChapterCount(book);
  const startVerse = selected.startVerse || 1;
  const endVerse = selected.endVerse || Bible.getChapterVerseCount(book, endChapter);
  const startVerseId = Bible.makeVerseId(book, startChapter, startVerse);
  const endVerseId = Bible.makeVerseId(book, endChapter, endVerse);
  emit('change', { startVerseId, endVerseId });
}

function resetStartChapter() { selected.startChapter = 0; startChapters.value = []; }
function resetStartVerse() { selected.startVerse = 0; startVerses.value = []; }
function resetEndChapter() { selected.endChapter = 0; endChapters.value = []; }
function resetEndVerse() { selected.endVerse = 0; endVerses.value = []; }

function onSelectBook() {
  resetStartChapter(); resetStartVerse(); resetEndChapter(); resetEndVerse();
  const bookIndex = selected.book;
  const chapterCount = Bible.getBookChapterCount(bookIndex);
  const chapters: number[] = [];
  for (let i = 1; i <= chapterCount; i++) { chapters.push(i); }
  startChapters.value = chapters;
  if (chapterCount === 1) { selectChapters({ from: 1, to: 1 }); }
  emitCurrentValue();
}

function onSelectChapters() {
  resetStartVerse(); resetEndVerse();
  const startChapterVerseCount = Bible.getChapterVerseCount(selected.book, selected.startChapter);
  const sv: number[] = [];
  for (let i = 1; i <= startChapterVerseCount; i++) { sv.push(i); }
  startVerses.value = sv;

  const chapterCount = Bible.getBookChapterCount(selected.book);
  const ec: number[] = [];
  for (let i = selected.startChapter; i <= chapterCount; i++) { ec.push(i); }
  endChapters.value = ec;

  const endChapterVerseCount = Bible.getChapterVerseCount(selected.book, selected.endChapter);
  const ev: number[] = [];
  for (let i = 1; i <= endChapterVerseCount; i++) { ev.push(i); }
  endVerses.value = ev;

  emitCurrentValue();
}

function onSelectEndChapter() {
  resetEndVerse();
  const endChapterVerseCount = Bible.getChapterVerseCount(selected.book, selected.endChapter);
  const initialVerse = (selected.startChapter === selected.endChapter) ? (selected.startVerse || 1) : 1;
  const ev: number[] = [];
  for (let i = initialVerse; i <= endChapterVerseCount; i++) { ev.push(i); }
  endVerses.value = ev;
  emitCurrentValue();
}

function onSelectStartVerse() {
  if (selected.endChapter === selected.startChapter) {
    const chapterVerseCount = Bible.getChapterVerseCount(selected.book, selected.endChapter);
    const ev: number[] = [];
    for (let i = selected.startVerse; i <= chapterVerseCount; i++) { ev.push(i); }
    endVerses.value = ev;
  }
  emitCurrentValue();
}

function openSelectBook() { selectionTarget.value = SELECTION.BOOK; }
function openSelectChapters() { selectionTarget.value = SELECTION.CHAPTERS; }
function openSelectEndChapter() { selectionTarget.value = SELECTION.END_CHAPTER; }
function openSelectVerses() { selectionTarget.value = SELECTION.VERSES; }
function openSelectStartVerse() { selectionTarget.value = SELECTION.START_VERSE; }
function openSelectEndVerse() { selectionTarget.value = SELECTION.END_VERSE; }
function endSelection() { selectionTarget.value = null; }

function selectBook(bookIndex: number) {
  selected.book = bookIndex;
  onSelectBook();
  selectionTarget.value = null;
}

function selectChapters({ from, to }: { from: number; to: number }) {
  selected.startChapter = from;
  selected.endChapter = to;
  onSelectChapters();
  selectionTarget.value = null;
}

function selectEndChapter({ from, to }: { from: number; to: number }) {
  selected.endChapter = to || from;
  onSelectEndChapter();
  selectionTarget.value = null;
}

function selectVerses({ from, to }: { from: number; to: number }) {
  selected.startVerse = from;
  selected.endVerse = to;
  const chapterVerseCount = Bible.getChapterVerseCount(selected.book, selected.endChapter);
  const ev: number[] = [];
  for (let i = selected.startVerse; i <= chapterVerseCount; i++) { ev.push(i); }
  endVerses.value = ev;
  emitCurrentValue();
  selectionTarget.value = null;
}

function selectStartVerse({ from, to }: { from: number; to: number }) {
  selected.startVerse = from || to;
  onSelectStartVerse();
  selectionTarget.value = null;
}

function selectEndVerse({ from, to }: { from: number; to: number }) {
  selected.endVerse = to || from;
  emitCurrentValue();
  selectionTarget.value = null;
}

defineExpose({ openSelectBook });

onMounted(() => {
  books.value = Bible.getBooks() as Array<{ bibleOrder: number; newTestament: boolean }>;
  bookOptions.value = books.value.map(book => ({
    label: Bible.getBookName(book.bibleOrder, locale.value),
    value: book.bibleOrder,
  }));

  if (!props.populateWith.empty) {
    silent.value = true;
    const { startVerseId, endVerseId } = props.populateWith as { startVerseId: number; endVerseId: number };
    const start = Bible.parseVerseId(startVerseId);
    const end = Bible.parseVerseId(endVerseId);

    selected.book = start.book;
    onSelectBook();
    selected.startChapter = start.chapter;
    selected.endChapter = end.chapter;
    onSelectChapters();
    selected.startVerse = start.verse;
    onSelectStartVerse();
    selected.endVerse = end.verse;

    silent.value = false;
  }
});
</script>

<i18n lang="json">
{
  "en": {
    "select_book": "Select Book",
    "select_chapters": "Select Chapter(s)",
    "select_end_chapter": "Select End Chapter",
    "select_verses": "Select Verse(s)",
    "select_start_verse": "Select Start Verse",
    "select_end_verse": "Select End Verse",
    "old_testament": "Old Testament",
    "new_testament": "New Testament",
    "select_chapters_note": "Select the first and last chapter in the passage, or for a single chapter select it twice.",
    "select_verses_note": "Select the first and last verse in the chapter, or for a single verse select it twice."
  },
  "de": {
    "select_book": "Wähle Buch",
    "select_chapters": "Wähle Kapitel",
    "select_end_chapter": "Wähle Endkapitel",
    "select_verses": "Wähle Verse",
    "select_start_verse": "Wähle Startvers",
    "select_end_verse": "Wähle Endvers",
    "old_testament": "Altes Testament",
    "new_testament": "Neues Testament",
    "select_chapters_note": "Wählen Sie das erste und letzte Kapitel im Abschnitt aus, oder wählen Sie für ein einzelnes Kapitel zweimal aus.",
    "select_verses_note": "Wählen Sie den ersten und letzten Vers im Kapitel aus, oder wählen Sie für einen einzelnen Vers zweimal aus."
  },
  "es": {
    "select_book": "Seleccionar Libro",
    "select_chapters": "Seleccionar Capítulo(s)",
    "select_end_chapter": "Seleccionar Capítulo Final",
    "select_verses": "Seleccionar Versículo(s)",
    "select_start_verse": "Seleccionar Versículo Inicial",
    "select_end_verse": "Seleccionar Versículo Final",
    "old_testament": "Antiguo Testamento",
    "new_testament": "Nuevo Testamento",
    "select_chapters_note": "Seleccione el primer y último capítulo del pasaje, o para un solo capítulo selecciónelo dos veces.",
    "select_verses_note": "Seleccione el primer y último versículo del capítulo, o para un solo versículo selecciónelo dos veces."
  },
  "fr": {
    "select_book": "Sélectionner le livre",
    "select_chapters": "Sélectionner le(s) chapitre(s)",
    "select_end_chapter": "Sélectionner le chapitre de fin",
    "select_verses": "Sélectionner le(s) verset(s)",
    "select_start_verse": "Sélectionner le verset de début",
    "select_end_verse": "Sélectionner le verset de fin",
    "old_testament": "Ancien Testament",
    "new_testament": "Nouveau Testament",
    "select_chapters_note": "Sélectionnez le premier et le dernier chapitre du passage, ou pour un seul chapitre, sélectionnez-le deux fois.",
    "select_verses_note": "Sélectionnez le premier et le dernier verset du chapitre, ou pour un seul verset, sélectionnez-le deux fois."
  },
  "ko": {
    "select_book": "책 선택",
    "select_chapters": "장 선택",
    "select_end_chapter": "끝 장 선택",
    "select_verses": "절 선택",
    "select_start_verse": "시작 절 선택",
    "select_end_verse": "끝 절 선택",
    "old_testament": "구약",
    "new_testament": "신약",
    "select_chapters_note": "구절의 첫 장과 마지막 장을 선택하세요. 한 장만 선택하기 위해서는 같은 장을 두 번 누르세요.",
    "select_verses_note": "장 안에서 첫 절과 마지막 절을 선택하세요. 한 절만 선택하기 위해서는 같은 절을 두 번 누르세요."
  },
  "pt": {
    "select_book": "Selecionar Livro",
    "select_chapters": "Selecionar Capítulo(s)",
    "select_end_chapter": "Selecionar Capítulo Final",
    "select_verses": "Selecionar Versículo(s)",
    "select_start_verse": "Selecionar Versículo Inicial",
    "select_end_verse": "Selecionar Versículo Final",
    "old_testament": "Antigo Testamento",
    "new_testament": "Novo Testamento",
    "select_chapters_note": "Selecione o primeiro e o último capítulo da passagem, ou para um único capítulo, selecione-o duas vezes.",
    "select_verses_note": "Selecione o primeiro e o último versículo do capítulo, ou para um único versículo, selecione-o duas vezes."
  },
  "uk": {
    "select_book": "Виберіть книгу",
    "select_chapters": "Виберіть розділ(и)",
    "select_end_chapter": "Виберіть кінцевий розділ",
    "select_verses": "Виберіть вірш(і)",
    "select_start_verse": "Виберіть початковий вірш",
    "select_end_verse": "Виберіть кінцевий вірш",
    "old_testament": "Старий Завіт",
    "new_testament": "Новий Завіт",
    "select_chapters_note": "Виберіть перший і останній розділ у пасажі, або для одного розділу виберіть його двічі.",
    "select_verses_note": "Виберіть перший і останній вірш у розділі, або для одного вірша виберіть його двічі."
  }
}
</i18n>

<style scoped>
.selector-note {
  background: var(--mbl-bg-hover-light);
  padding: 0.2em 0.5em;
  border-radius: 0.2em;
  margin-bottom: 0.5em;
  margin-top: -0.5em;
}

.passage-selector {
  display: flex;
  align-items: center;
}

.passage-selector .part {
  display: inline;
  background: var(--mbl-border-strong);
  padding: 0.5rem 0.75rem;
  margin: 0 0.25rem;
  border-radius: 3px;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease-out, background-color 0.2s ease-out;
}

.passage-selector .part:hover {
  color: var(--mbl-on-accent);
  background: var(--mbl-link-bright);
}

.passage-selector .part:first-child { margin-left: 0; }
.passage-selector .part:last-child { margin-right: 0; }

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
