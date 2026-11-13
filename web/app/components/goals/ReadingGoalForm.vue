<template>
  <!-- Creating starts by choosing a plan; a template only prefills the form below. -->
  <div v-if="!isEditing && !plan" class="goal-plans" data-testid="reading-goal-plans">
    <p class="goal-plans__prompt">
      {{ t('start.prompt') }}
    </p>
    <div class="goal-plans__grid">
      <button
        v-for="template in templates"
        :key="template.id"
        type="button"
        class="mbl-card goal-plans__plan"
        data-testid="reading-goal-template"
        :data-template-id="template.id"
        @click="choosePlan(template.id)"
      >
        <span class="goal-plans__name">{{ t(`template.${template.id}`) }}</span>
        <span class="goal-plans__detail">{{ t('verse_count', { count: $n(template.totalVerses, 'grouped') }) }}</span>
        <span class="goal-plans__detail">{{ t('start.days_at_goal', { count: $n(template.days, 'grouped') }, template.days) }}</span>
      </button>
      <button
        type="button"
        class="mbl-card goal-plans__plan goal-plans__plan--custom"
        data-testid="reading-goal-template-custom"
        @click="choosePlan('custom')"
      >
        <span class="goal-plans__name"><plus-icon width="16px" height="16px" /> {{ t('start.custom') }}</span>
        <span class="goal-plans__detail">{{ t('start.custom_description') }}</span>
      </button>
    </div>
  </div>

  <form v-else class="goal-form" novalidate data-testid="reading-goal-editor" @submit.prevent="save">
    <section class="mbl-box goal-form__section">
      <label class="mbl-label" for="goal-title">{{ t('name.label') }}</label>
      <input
        id="goal-title"
        v-model="title"
        class="mbl-input"
        :class="{ 'mbl-input--danger': showErrors && errors.title }"
        type="text"
        maxlength="100"
        :placeholder="t('name.placeholder')"
        data-testid="reading-goal-title"
      >
      <p v-if="showErrors && errors.title" class="mbl-help mbl-help--danger">
        {{ t('errors.title') }}
      </p>
    </section>

    <section class="mbl-box goal-form__section">
      <header class="goal-form__section-header">
        <div>
          <h2 class="mbl-title mbl-title--5">
            {{ t('books.title') }}
          </h2>
          <p class="goal-form__summary" data-testid="reading-goal-selected-verses">
            {{ t('books.count', { count: orderedBooks.length }, orderedBooks.length) }}
            · {{ t('verse_count', { count: $n(selectedVerseCount, 'grouped') }) }}
          </p>
        </div>
        <button type="button" class="mbl-button" data-testid="reading-goal-books-toggle" @click="booksOpen = !booksOpen">
          {{ booksOpen ? t('done') : t('books.change') }}
        </button>
      </header>

      <template v-if="booksOpen">
        <fieldset v-for="testament in testaments" :key="testament.key" class="goal-form__testament">
          <legend class="goal-form__testament-header">
            <span>{{ t(`books.${testament.key}`) }}</span>
            <button type="button" class="goal-form__text-button" :data-testid="`reading-goal-select-all-${testament.key}`" @click="setBooks(testament.books, true)">
              {{ t('books.select_all') }}
            </button>
            <button type="button" class="goal-form__text-button" @click="setBooks(testament.books, false)">
              {{ t('books.clear') }}
            </button>
          </legend>
          <div class="goal-form__book-grid">
            <label
              v-for="book in testament.books"
              :key="book.index"
              class="goal-form__book"
              :class="{ 'goal-form__book--selected': selectedBooks.has(book.index) }"
            >
              <input
                type="checkbox"
                :checked="selectedBooks.has(book.index)"
                data-testid="reading-goal-book"
                :data-book="book.index"
                @change="toggleBook(book.index)"
              >
              {{ book.name }}
            </label>
          </div>
        </fieldset>
      </template>
      <p v-else-if="orderedBooks.length" class="goal-form__book-names" data-testid="reading-goal-books-summary">
        {{ orderedBooks.map(bookName).join(', ') }}
      </p>
      <p v-if="showErrors && errors.books" class="mbl-help mbl-help--danger">
        {{ t('errors.books') }}
      </p>

      <div v-if="orderedBooks.length > 1" class="goal-form__order">
        <div class="goal-form__order-header">
          <span>
            {{ t('order.label') }}
            <strong>{{ isBibleOrder ? t('order.bible') : t('order.custom') }}</strong>
          </span>
          <button v-if="orderOpen && !isBibleOrder" type="button" class="goal-form__text-button" @click="resetOrder">
            {{ t('order.reset') }}
          </button>
          <button type="button" class="goal-form__text-button" data-testid="reading-goal-order-toggle" @click="orderOpen = !orderOpen">
            {{ orderOpen ? t('done') : t('order.reorder') }}
          </button>
        </div>
        <ol v-if="orderOpen" class="goal-form__order-list" data-testid="reading-goal-order">
          <li v-for="(bookIndex, position) in orderedBooks" :key="bookIndex" class="goal-form__order-item">
            <span class="goal-form__order-position">{{ position + 1 }}</span>
            <span class="goal-form__order-name">{{ bookName(bookIndex) }}</span>
            <button
              type="button"
              class="mbl-button mbl-button--sm mbl-button--icon"
              :disabled="position === 0"
              :aria-label="t('order.move_up', { book: bookName(bookIndex) })"
              @click="move(position, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="mbl-button mbl-button--sm mbl-button--icon"
              :disabled="position === orderedBooks.length - 1"
              :aria-label="t('order.move_down', { book: bookName(bookIndex) })"
              @click="move(position, 1)"
            >
              ↓
            </button>
          </li>
        </ol>
      </div>
    </section>

    <section class="mbl-box goal-form__section">
      <h2 class="mbl-title mbl-title--5">
        {{ t('dates.title') }}
      </h2>
      <div class="goal-form__dates">
        <div>
          <label class="mbl-label" for="goal-start-date">{{ t('dates.start') }}</label>
          <input
            id="goal-start-date"
            v-model="startDate"
            class="mbl-input"
            type="date"
            data-testid="reading-goal-start-date"
          >
        </div>
        <div>
          <label class="mbl-label" for="goal-end-date">{{ t('dates.end') }}</label>
          <input
            id="goal-end-date"
            v-model="endDate"
            class="mbl-input"
            :class="{ 'mbl-input--danger': showErrors && errors.dates }"
            type="date"
            :min="startDate"
            data-testid="reading-goal-end-date"
            @input="endDateTouched = true"
          >
        </div>
      </div>
      <div class="goal-form__presets" role="group" :aria-label="t('dates.presets')">
        <button
          v-for="preset in presets"
          :key="preset.id"
          type="button"
          class="goal-form__preset"
          :class="{ 'goal-form__preset--active': preset.endDate === endDate }"
          :aria-pressed="preset.endDate === endDate"
          data-testid="reading-goal-preset"
          :data-preset="preset.id"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
      <p v-if="showErrors && errors.dates" class="mbl-help mbl-help--danger" data-testid="reading-goal-date-error">
        {{ t(`errors.${errors.dates}`) }}
      </p>
      <div v-else-if="dayCount > 0 && orderedBooks.length" class="goal-form__pace">
        <strong class="goal-form__pace-number" data-testid="reading-goal-required-pace">
          {{ t('dates.required', { count: $n(Math.ceil(requiredPerDay), 'grouped') }) }}
        </strong>
        <span>
          {{ t('dates.span', { total: $n(selectedVerseCount, 'grouped'), days: $n(dayCount, 'grouped') }, dayCount) }}
          {{ t('dates.daily_goal', { count: $n(dailyVerseCountGoal, 'grouped') }) }}
        </span>
      </div>
    </section>

    <div v-if="error" class="mbl-help mbl-help--danger" data-testid="reading-goal-error">
      {{ error }}
    </div>

    <div class="mbl-button-group mbl-button-group--end goal-form__actions">
      <button type="button" class="mbl-button" data-testid="reading-goal-cancel" @click="cancel">
        {{ t('cancel') }}
      </button>
      <button type="submit" class="mbl-button mbl-button--primary" :disabled="saving" data-testid="reading-goal-save">
        {{ isEditing ? t('save') : t('create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import {
  Bible,
  MAX_GOAL_DAYS,
  READING_GOAL_TEMPLATES,
  bookToPassage,
  getDefaultEndDate,
  getGoalTotalVerses,
  getRequiredVersesPerDay,
  getTemplateBookIndexes,
  getTemplatePassages,
  inclusiveDays,
  isWholeBookPassage,
  passageBookIndex,
  type ReadingGoal,
} from '@mybiblelog/shared';
import PlusIcon from '~/components/svg/PlusIcon.vue';
import { confirmDiscardIfDirty } from '~/helpers/confirm-discard';
import { useReadingGoalsStore } from '~/stores/reading-goals';
import { useUserSettingsStore } from '~/stores/user-settings';

type Preset = { id: string; label: string; endDate: string; auto?: boolean };

const props = defineProps<{
  /** The goal to edit; omit to create a new one. */
  goal?: ReadingGoal | null;
  /** When creating: a template id or `custom`. Empty shows the plan picker. */
  plan?: string | null;
}>();

const emit = defineEmits<{
  'update:plan': [plan: string];
  saved: [goal: ReadingGoal];
  cancel: [];
}>();

const { t, n, locale } = useI18n();
const readingGoalsStore = useReadingGoalsStore();
const userSettingsStore = useUserSettingsStore();

const isEditing = computed(() => !!props.goal);
const today = dayjs().format('YYYY-MM-DD');

const goalBooks = (props.goal?.passages ?? []).filter(isWholeBookPassage).map(passageBookIndex);

const plan = ref(props.plan ?? '');
const title = ref(props.goal?.title ?? '');
const orderedBooks = ref<number[]>(goalBooks);
const startDate = ref(props.goal?.startDate ?? today);
const endDate = ref(props.goal?.endDate ?? '');
// Until the reader picks a goal date, it follows the books and start date.
const endDateTouched = ref(isEditing.value);
const booksOpen = ref(false);
const orderOpen = ref(false);
const showErrors = ref(false);
const saving = ref(false);
const error = ref('');

const dailyVerseCountGoal = computed(() => userSettingsStore.settings.dailyVerseCountGoal || 1);
const includeDeuterocanonical = computed(() => userSettingsStore.settings.includeDeuterocanonical);

const templates = computed(() => READING_GOAL_TEMPLATES
  .map((template) => {
    const totalVerses = getGoalTotalVerses(getTemplatePassages(template.id, includeDeuterocanonical.value));
    return { id: template.id, totalVerses, days: Math.ceil(totalVerses / dailyVerseCountGoal.value) };
  })
  .filter(template => template.totalVerses > 0));

const bookName = (bookIndex: number) => Bible.getBookName(bookIndex, locale.value);

const displayOrder = new Map(Bible.getAllBooks().map(book => [book.bibleOrder, book.dcBookOrder]));
const byDisplayOrder = (a: number, b: number) => displayOrder.get(a)! - displayOrder.get(b)!;

const selectedBooks = computed(() => new Set(orderedBooks.value));
const isBibleOrder = computed(() =>
  orderedBooks.value.every((book, i, list) => i === 0 || byDisplayOrder(list[i - 1]!, book) < 0));

// Books picked in this form stay listed even when the reader's canon excludes
// them, so they can be unchecked and checked again before saving.
const stickyBooks = ref(new Set<number>(goalBooks));

const testaments = computed(() => {
  const indexes = new Set(Bible.getBooksForCanon(includeDeuterocanonical.value).map(book => book.bibleOrder));
  stickyBooks.value.forEach(bookIndex => indexes.add(bookIndex));
  const books = [...indexes].sort(byDisplayOrder).map(index => ({ index, name: bookName(index) }));
  return [
    { key: 'old_testament', books: books.filter(b => !Bible.isNewTestament(b.index)) },
    { key: 'new_testament', books: books.filter(b => Bible.isNewTestament(b.index)) },
  ];
});

const selectedVerseCount = computed(() =>
  orderedBooks.value.reduce((sum, bookIndex) => sum + Bible.getBookVerseCount(bookIndex), 0));

const dayCount = computed(() => (startDate.value && endDate.value ? inclusiveDays(startDate.value, endDate.value) : 0));
const requiredPerDay = computed(() => getRequiredVersesPerDay(selectedVerseCount.value, startDate.value, endDate.value || startDate.value));

const defaultEndDate = computed(() => (startDate.value
  ? getDefaultEndDate(startDate.value, selectedVerseCount.value, dailyVerseCountGoal.value)
  : ''));

// Also called synchronously wherever the inputs change during setup: watchers
// don't re-run while rendering on the server, and the two renders must agree.
const syncEndDate = () => {
  if (!endDateTouched.value && defaultEndDate.value) { endDate.value = defaultEndDate.value; }
};
watch(defaultEndDate, syncEndDate);

const presets = computed<Preset[]>(() => {
  if (!startDate.value) { return []; }
  const monthsFromStart = (months: number) => dayjs(startDate.value).add(months, 'month').subtract(1, 'day').format('YYYY-MM-DD');
  return [
    { id: 'daily_goal', label: t('dates.preset_daily_goal', { count: n(dailyVerseCountGoal.value) }), endDate: defaultEndDate.value, auto: true },
    { id: '1_month', label: t('dates.preset_months', { count: 1 }, 1), endDate: monthsFromStart(1) },
    { id: '3_months', label: t('dates.preset_months', { count: 3 }, 3), endDate: monthsFromStart(3) },
    { id: '6_months', label: t('dates.preset_months', { count: 6 }, 6), endDate: monthsFromStart(6) },
    { id: '1_year', label: t('dates.preset_year'), endDate: monthsFromStart(12) },
  ];
});

const applyPreset = (preset: Preset) => {
  endDateTouched.value = !preset.auto;
  endDate.value = preset.endDate;
};

const toggleBook = (bookIndex: number) => {
  if (selectedBooks.value.has(bookIndex)) {
    orderedBooks.value = orderedBooks.value.filter(book => book !== bookIndex);
    return;
  }
  stickyBooks.value = new Set(stickyBooks.value).add(bookIndex);
  // A list still in Bible order keeps it; a hand-ordered list gets new books at the end.
  orderedBooks.value = isBibleOrder.value
    ? [...orderedBooks.value, bookIndex].sort(byDisplayOrder)
    : [...orderedBooks.value, bookIndex];
};

const setBooks = (books: Array<{ index: number }>, selected: boolean) => {
  const indexes = new Set(books.map(book => book.index));
  const kept = orderedBooks.value.filter(book => !indexes.has(book));
  if (!selected) {
    orderedBooks.value = kept;
    return;
  }
  const added = [...indexes].filter(book => !selectedBooks.value.has(book));
  stickyBooks.value = new Set([...stickyBooks.value, ...indexes]);
  orderedBooks.value = isBibleOrder.value
    ? [...orderedBooks.value, ...added].sort(byDisplayOrder)
    : [...orderedBooks.value, ...added];
};

const move = (position: number, delta: number) => {
  const list = [...orderedBooks.value];
  const [book] = list.splice(position, 1);
  list.splice(position + delta, 0, book!);
  orderedBooks.value = list;
};

const resetOrder = () => {
  orderedBooks.value = [...orderedBooks.value].sort(byDisplayOrder);
};

const applyPlan = (id: string) => {
  plan.value = id;
  showErrors.value = false;
  error.value = '';
  endDateTouched.value = false;
  orderOpen.value = false;
  if (!id) { return; }
  const books = id === 'custom' ? [] : getTemplateBookIndexes(id, includeDeuterocanonical.value);
  title.value = books.length ? t(`template.${id}`) : '';
  orderedBooks.value = books;
  stickyBooks.value = new Set(books);
  booksOpen.value = !books.length;
  syncEndDate();
  markClean();
};

const choosePlan = (id: string) => {
  applyPlan(id);
  emit('update:plan', id);
};

const snapshot = () => JSON.stringify([title.value, orderedBooks.value, startDate.value, endDate.value]);
const cleanSnapshot = ref('');
const markClean = () => { cleanSnapshot.value = snapshot(); };

if (!isEditing.value) { applyPlan(plan.value); }
syncEndDate();
markClean();

// The parent may own the plan (the browser's back button returns to the picker).
watch(() => props.plan, (value) => {
  if (!isEditing.value && (value ?? '') !== plan.value) { applyPlan(value ?? ''); }
});

const errors = computed(() => {
  let dates: '' | 'dates_required' | 'dates_order' | 'dates_too_long' = '';
  if (!startDate.value || !endDate.value) { dates = 'dates_required'; }
  else if (endDate.value < startDate.value) { dates = 'dates_order'; }
  else if (dayCount.value > MAX_GOAL_DAYS) { dates = 'dates_too_long'; }
  return {
    title: !title.value.trim(),
    books: orderedBooks.value.length === 0,
    dates,
  };
});

const isValid = computed(() => !errors.value.title && !errors.value.books && !errors.value.dates);

const cancel = async () => {
  if (await confirmDiscardIfDirty(snapshot() !== cleanSnapshot.value, t('discard_confirm'))) {
    emit('cancel');
  }
};

const save = async () => {
  showErrors.value = true;
  if (!isValid.value) {
    if (errors.value.books) { booksOpen.value = true; }
    return;
  }
  saving.value = true;
  error.value = '';
  const input = {
    title: title.value.trim(),
    passages: orderedBooks.value.map(bookToPassage),
    startDate: startDate.value,
    endDate: endDate.value,
    active: props.goal?.active ?? true,
  };
  try {
    const saved = props.goal
      ? await readingGoalsStore.updateGoal(props.goal.id, input)
      : await readingGoalsStore.createGoal(input);
    emit('saved', saved);
  }
  catch {
    error.value = t('save_error');
  }
  finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.goal-plans__prompt {
  margin-bottom: var(--mbl-space-md);
}

.goal-plans__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--mbl-space-sm);
}

.goal-plans__plan {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mbl-space-3xs);
  padding: var(--mbl-space-md);
  border: 0;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.goal-plans__plan:hover,
.goal-plans__plan:focus-visible {
  outline: none;
  box-shadow: var(--mbl-shadow-card-hover);
  transform: translateY(-1px);
}

.goal-plans__plan:active {
  box-shadow: var(--mbl-shadow-card-pressed);
  transform: none;
}

.goal-plans__plan--custom {
  border: 1px dashed var(--mbl-border-strong);
  background: transparent;
  box-shadow: none;
}

.goal-plans__name {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-2xs);
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-5);
  font-weight: 700;
}

.goal-plans__detail {
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
}

.goal-form {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-md);
}

.goal-form__section .mbl-title {
  margin: 0;
}

.goal-form__section > .mbl-title {
  margin-bottom: var(--mbl-space-sm);
}

.goal-form__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-sm);
}

.goal-form__summary {
  margin: 0;
  color: var(--mbl-text-muted);
  font-size: 0.9rem;
}

.goal-form__book-names {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.goal-form__testament {
  min-width: 0;
  margin: 0 0 var(--mbl-space-md);
  padding: 0;
  border: 0;
}

.goal-form__testament-header {
  display: flex;
  align-items: baseline;
  gap: var(--mbl-space-sm);
  width: 100%;
  margin-bottom: var(--mbl-space-xs);
  padding: 0;
  color: var(--mbl-text-strong);
  font-weight: 600;
}

.goal-form__testament-header > :first-child {
  margin-right: auto;
}

.goal-form__text-button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--mbl-link);
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 400;
}

.goal-form__text-button:hover {
  color: var(--mbl-link-hover);
  text-decoration: underline;
}

.goal-form__book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: var(--mbl-space-2xs);
}

.goal-form__book {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
  padding: var(--mbl-space-2xs) var(--mbl-space-xs);
  border: 1px solid var(--mbl-border);
  border-radius: var(--mbl-radius-lg);
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.3;
  transition: background-color 0.1s ease, border-color 0.1s ease;
}

.goal-form__book:hover {
  border-color: var(--mbl-border-strong);
}

.goal-form__book--selected {
  border-color: var(--mbl-link-bright);
  background: var(--mbl-primary-soft);
  color: var(--mbl-text-strong);
}

.goal-form__book input {
  flex: none;
  accent-color: var(--primary-color);
}

.goal-form__order {
  margin-top: var(--mbl-space-md);
  padding-top: var(--mbl-space-sm);
  border-top: 1px solid var(--mbl-border-soft);
}

.goal-form__order-header {
  display: flex;
  align-items: baseline;
  gap: var(--mbl-space-sm);
  font-size: 0.9rem;
}

.goal-form__order-header > :first-child {
  margin-right: auto;
  color: var(--mbl-text-muted);
}

.goal-form__order-header strong {
  color: var(--mbl-text-strong);
  font-weight: 600;
}

.goal-form__order-list {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-2xs);
  margin: var(--mbl-space-sm) 0 0;
  padding: 0;
  list-style: none;
}

.goal-form__order-item {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
  padding: var(--mbl-space-2xs) var(--mbl-space-xs);
  border-radius: var(--mbl-radius-lg);
  background: var(--mbl-bg-muted);
}

.goal-form__order-position {
  min-width: 1.75em;
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.goal-form__order-name {
  flex: 1;
}

.goal-form__dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--mbl-space-md);
}

.goal-form__presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-xs);
  margin-top: var(--mbl-space-sm);
}

.goal-form__preset {
  padding: var(--mbl-space-2xs) var(--mbl-space-sm);
  border: 1px solid var(--mbl-border);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-bg);
  color: var(--mbl-text-body);
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}

.goal-form__preset:hover {
  border-color: var(--mbl-border-strong);
}

.goal-form__preset--active {
  border-color: var(--mbl-link-bright);
  background: var(--mbl-primary-soft);
  color: var(--mbl-text-strong);
  font-weight: 600;
}

.goal-form__pace {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-3xs);
  margin-top: var(--mbl-space-md);
  padding: var(--mbl-space-sm) var(--mbl-space-md);
  border-radius: var(--mbl-radius-xl);
  background: var(--mbl-bg-muted);
  color: var(--mbl-text-muted);
  font-size: 0.9rem;
}

.goal-form__pace-number {
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-5);
}

.goal-form__actions {
  margin-top: var(--mbl-space-xs);
}
</style>

<i18n lang="json">
{
  "en": {
    "start": {
      "prompt": "Start from a common reading plan, or build your own.",
      "days_at_goal": "{count} day at your daily goal | {count} days at your daily goal",
      "custom": "Custom goal",
      "custom_description": "Choose your own books"
    },
    "template": {
      "whole_bible": "Whole Bible",
      "old_testament": "Old Testament",
      "new_testament": "New Testament",
      "gospels": "Gospels",
      "wisdom": "Wisdom",
      "deuterocanonical": "Deuterocanonical"
    },
    "verse_count": "{count} verses",
    "name": {
      "label": "Goal name",
      "placeholder": "e.g. Letters of Paul"
    },
    "books": {
      "title": "Books",
      "count": "{count} book | {count} books",
      "change": "Change",
      "select_all": "Select all",
      "clear": "Clear",
      "old_testament": "Old Testament",
      "new_testament": "New Testament"
    },
    "order": {
      "label": "Reading order:",
      "bible": "Bible order",
      "custom": "Custom",
      "reorder": "Reorder",
      "reset": "Reset",
      "move_up": "Move {book} up",
      "move_down": "Move {book} down"
    },
    "dates": {
      "title": "Schedule",
      "start": "Start date",
      "end": "Goal date",
      "presets": "Quick lengths",
      "preset_daily_goal": "My daily goal ({count}/day)",
      "preset_months": "{count} month | {count} months",
      "preset_year": "1 year",
      "required": "{count} verses a day",
      "span": "{total} verses in {days} day. | {total} verses in {days} days.",
      "daily_goal": "Your daily goal is {count}."
    },
    "errors": {
      "title": "Give your goal a name.",
      "books": "Choose at least one book.",
      "dates_required": "Choose a start date and a goal date.",
      "dates_order": "The goal date can't be before the start date.",
      "dates_too_long": "A goal can run for up to ten years."
    },
    "done": "Done",
    "cancel": "Cancel",
    "save": "Save changes",
    "create": "Create goal",
    "discard_confirm": "Discard your changes to this goal?",
    "save_error": "The goal could not be saved. Please try again."
  },
  "de": {
    "start": {
      "prompt": "Beginnen Sie mit einem gängigen Leseplan oder erstellen Sie Ihren eigenen.",
      "days_at_goal": "{count} Tag mit Ihrem Tagesziel | {count} Tage mit Ihrem Tagesziel",
      "custom": "Eigenes Ziel",
      "custom_description": "Bücher selbst auswählen"
    },
    "template": {
      "whole_bible": "Ganze Bibel",
      "old_testament": "Altes Testament",
      "new_testament": "Neues Testament",
      "gospels": "Evangelien",
      "wisdom": "Weisheit",
      "deuterocanonical": "Deuterokanonische Bücher"
    },
    "verse_count": "{count} Verse",
    "name": {
      "label": "Name des Ziels",
      "placeholder": "z. B. Paulusbriefe"
    },
    "books": {
      "title": "Bücher",
      "count": "{count} Buch | {count} Bücher",
      "change": "Ändern",
      "select_all": "Alle auswählen",
      "clear": "Leeren",
      "old_testament": "Altes Testament",
      "new_testament": "Neues Testament"
    },
    "order": {
      "label": "Lesereihenfolge:",
      "bible": "Biblische Reihenfolge",
      "custom": "Eigene",
      "reorder": "Neu ordnen",
      "reset": "Zurücksetzen",
      "move_up": "{book} nach oben verschieben",
      "move_down": "{book} nach unten verschieben"
    },
    "dates": {
      "title": "Zeitplan",
      "start": "Startdatum",
      "end": "Zieldatum",
      "presets": "Schnellauswahl",
      "preset_daily_goal": "Mein Tagesziel ({count}/Tag)",
      "preset_months": "{count} Monat | {count} Monate",
      "preset_year": "1 Jahr",
      "required": "{count} Verse pro Tag",
      "span": "{total} Verse in {days} Tag. | {total} Verse in {days} Tagen.",
      "daily_goal": "Ihr Tagesziel liegt bei {count}."
    },
    "errors": {
      "title": "Geben Sie Ihrem Ziel einen Namen.",
      "books": "Wählen Sie mindestens ein Buch aus.",
      "dates_required": "Wählen Sie ein Start- und ein Zieldatum.",
      "dates_order": "Das Zieldatum darf nicht vor dem Startdatum liegen.",
      "dates_too_long": "Ein Ziel kann höchstens zehn Jahre laufen."
    },
    "done": "Fertig",
    "cancel": "Abbrechen",
    "save": "Änderungen speichern",
    "create": "Ziel erstellen",
    "discard_confirm": "Änderungen an diesem Ziel verwerfen?",
    "save_error": "Das Ziel konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
  },
  "es": {
    "start": {
      "prompt": "Empieza con un plan de lectura común o crea el tuyo.",
      "days_at_goal": "{count} día con tu meta diaria | {count} días con tu meta diaria",
      "custom": "Meta personalizada",
      "custom_description": "Elige tus propios libros"
    },
    "template": {
      "whole_bible": "Toda la Biblia",
      "old_testament": "Antiguo Testamento",
      "new_testament": "Nuevo Testamento",
      "gospels": "Evangelios",
      "wisdom": "Sabiduría",
      "deuterocanonical": "Deuterocanónicos"
    },
    "verse_count": "{count} versículos",
    "name": {
      "label": "Nombre de la meta",
      "placeholder": "p. ej., Cartas de Pablo"
    },
    "books": {
      "title": "Libros",
      "count": "{count} libro | {count} libros",
      "change": "Cambiar",
      "select_all": "Seleccionar todos",
      "clear": "Quitar",
      "old_testament": "Antiguo Testamento",
      "new_testament": "Nuevo Testamento"
    },
    "order": {
      "label": "Orden de lectura:",
      "bible": "Orden bíblico",
      "custom": "Personalizado",
      "reorder": "Reordenar",
      "reset": "Restablecer",
      "move_up": "Subir {book}",
      "move_down": "Bajar {book}"
    },
    "dates": {
      "title": "Calendario",
      "start": "Fecha de inicio",
      "end": "Fecha objetivo",
      "presets": "Duraciones rápidas",
      "preset_daily_goal": "Mi meta diaria ({count}/día)",
      "preset_months": "{count} mes | {count} meses",
      "preset_year": "1 año",
      "required": "{count} versículos al día",
      "span": "{total} versículos en {days} día. | {total} versículos en {days} días.",
      "daily_goal": "Tu meta diaria es de {count}."
    },
    "errors": {
      "title": "Ponle un nombre a tu meta.",
      "books": "Elige al menos un libro.",
      "dates_required": "Elige una fecha de inicio y una fecha objetivo.",
      "dates_order": "La fecha objetivo no puede ser anterior a la de inicio.",
      "dates_too_long": "Una meta puede durar hasta diez años."
    },
    "done": "Listo",
    "cancel": "Cancelar",
    "save": "Guardar cambios",
    "create": "Crear meta",
    "discard_confirm": "¿Descartar los cambios de esta meta?",
    "save_error": "No se pudo guardar la meta. Inténtalo de nuevo."
  },
  "fr": {
    "start": {
      "prompt": "Partez d’un plan de lecture courant ou créez le vôtre.",
      "days_at_goal": "{count} jour à votre objectif quotidien | {count} jours à votre objectif quotidien",
      "custom": "Objectif personnalisé",
      "custom_description": "Choisissez vos livres"
    },
    "template": {
      "whole_bible": "Bible entière",
      "old_testament": "Ancien Testament",
      "new_testament": "Nouveau Testament",
      "gospels": "Évangiles",
      "wisdom": "Sagesse",
      "deuterocanonical": "Deutérocanoniques"
    },
    "verse_count": "{count} versets",
    "name": {
      "label": "Nom de l'objectif",
      "placeholder": "p. ex. Épîtres de Paul"
    },
    "books": {
      "title": "Livres",
      "count": "{count} livre | {count} livres",
      "change": "Modifier",
      "select_all": "Tout sélectionner",
      "clear": "Effacer",
      "old_testament": "Ancien Testament",
      "new_testament": "Nouveau Testament"
    },
    "order": {
      "label": "Ordre de lecture :",
      "bible": "Ordre biblique",
      "custom": "Personnalisé",
      "reorder": "Réorganiser",
      "reset": "Réinitialiser",
      "move_up": "Monter {book}",
      "move_down": "Descendre {book}"
    },
    "dates": {
      "title": "Calendrier",
      "start": "Date de début",
      "end": "Date cible",
      "presets": "Durées rapides",
      "preset_daily_goal": "Mon objectif quotidien ({count}/jour)",
      "preset_months": "{count} mois | {count} mois",
      "preset_year": "1 an",
      "required": "{count} versets par jour",
      "span": "{total} versets en {days} jour. | {total} versets en {days} jours.",
      "daily_goal": "Votre objectif quotidien est de {count}."
    },
    "errors": {
      "title": "Donnez un nom à votre objectif.",
      "books": "Choisissez au moins un livre.",
      "dates_required": "Choisissez une date de début et une date cible.",
      "dates_order": "La date cible ne peut pas précéder la date de début.",
      "dates_too_long": "Un objectif peut durer jusqu'à dix ans."
    },
    "done": "Terminé",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "create": "Créer l'objectif",
    "discard_confirm": "Abandonner les modifications de cet objectif ?",
    "save_error": "L'objectif n'a pas pu être enregistré. Veuillez réessayer."
  },
  "ko": {
    "start": {
      "prompt": "자주 쓰는 읽기 계획으로 시작하거나 직접 만들어 보세요.",
      "days_at_goal": "하루 목표대로 {count}일",
      "custom": "직접 만들기",
      "custom_description": "원하는 책을 직접 선택"
    },
    "template": {
      "whole_bible": "성경 전체",
      "old_testament": "구약",
      "new_testament": "신약",
      "gospels": "복음서",
      "wisdom": "지혜서",
      "deuterocanonical": "제2경전"
    },
    "verse_count": "{count}절",
    "name": {
      "label": "목표 이름",
      "placeholder": "예: 바울 서신"
    },
    "books": {
      "title": "책",
      "count": "{count}권",
      "change": "변경",
      "select_all": "모두 선택",
      "clear": "지우기",
      "old_testament": "구약",
      "new_testament": "신약"
    },
    "order": {
      "label": "읽는 순서:",
      "bible": "성경 순서",
      "custom": "직접 지정",
      "reorder": "순서 바꾸기",
      "reset": "초기화",
      "move_up": "{book} 위로 이동",
      "move_down": "{book} 아래로 이동"
    },
    "dates": {
      "title": "일정",
      "start": "시작일",
      "end": "목표일",
      "presets": "빠른 기간 선택",
      "preset_daily_goal": "내 하루 목표 (하루 {count}절)",
      "preset_months": "{count}개월",
      "preset_year": "1년",
      "required": "하루 {count}절",
      "span": "{days}일 동안 {total}절.",
      "daily_goal": "하루 목표는 {count}절입니다."
    },
    "errors": {
      "title": "목표 이름을 입력하세요.",
      "books": "책을 한 권 이상 선택하세요.",
      "dates_required": "시작일과 목표일을 선택하세요.",
      "dates_order": "목표일은 시작일보다 빠를 수 없습니다.",
      "dates_too_long": "목표 기간은 최대 10년입니다."
    },
    "done": "완료",
    "cancel": "취소",
    "save": "변경 사항 저장",
    "create": "목표 만들기",
    "discard_confirm": "이 목표의 변경 사항을 버릴까요?",
    "save_error": "목표를 저장하지 못했습니다. 다시 시도해 주세요."
  },
  "pt": {
    "start": {
      "prompt": "Comece com um plano de leitura comum ou crie o seu.",
      "days_at_goal": "{count} dia com sua meta diária | {count} dias com sua meta diária",
      "custom": "Meta personalizada",
      "custom_description": "Escolha seus próprios livros"
    },
    "template": {
      "whole_bible": "Bíblia inteira",
      "old_testament": "Antigo Testamento",
      "new_testament": "Novo Testamento",
      "gospels": "Evangelhos",
      "wisdom": "Sabedoria",
      "deuterocanonical": "Deuterocanônicos"
    },
    "verse_count": "{count} versículos",
    "name": {
      "label": "Nome da meta",
      "placeholder": "ex.: Cartas de Paulo"
    },
    "books": {
      "title": "Livros",
      "count": "{count} livro | {count} livros",
      "change": "Alterar",
      "select_all": "Selecionar todos",
      "clear": "Limpar",
      "old_testament": "Antigo Testamento",
      "new_testament": "Novo Testamento"
    },
    "order": {
      "label": "Ordem de leitura:",
      "bible": "Ordem bíblica",
      "custom": "Personalizada",
      "reorder": "Reordenar",
      "reset": "Redefinir",
      "move_up": "Mover {book} para cima",
      "move_down": "Mover {book} para baixo"
    },
    "dates": {
      "title": "Cronograma",
      "start": "Data de início",
      "end": "Data da meta",
      "presets": "Durações rápidas",
      "preset_daily_goal": "Minha meta diária ({count}/dia)",
      "preset_months": "{count} mês | {count} meses",
      "preset_year": "1 ano",
      "required": "{count} versículos por dia",
      "span": "{total} versículos em {days} dia. | {total} versículos em {days} dias.",
      "daily_goal": "Sua meta diária é de {count}."
    },
    "errors": {
      "title": "Dê um nome à sua meta.",
      "books": "Escolha pelo menos um livro.",
      "dates_required": "Escolha uma data de início e uma data da meta.",
      "dates_order": "A data da meta não pode ser anterior à data de início.",
      "dates_too_long": "Uma meta pode durar até dez anos."
    },
    "done": "Concluir",
    "cancel": "Cancelar",
    "save": "Salvar alterações",
    "create": "Criar meta",
    "discard_confirm": "Descartar as alterações desta meta?",
    "save_error": "Não foi possível salvar a meta. Tente novamente."
  },
  "uk": {
    "start": {
      "prompt": "Почніть зі стандартного плану читання або створіть власний.",
      "days_at_goal": "{count} день за вашою щоденною метою | {count} дні за вашою щоденною метою | {count} днів за вашою щоденною метою",
      "custom": "Власна мета",
      "custom_description": "Виберіть власні книги"
    },
    "template": {
      "whole_bible": "Уся Біблія",
      "old_testament": "Старий Заповіт",
      "new_testament": "Новий Заповіт",
      "gospels": "Євангелія",
      "wisdom": "Мудрість",
      "deuterocanonical": "Девтероканонічні книги"
    },
    "verse_count": "Віршів: {count}",
    "name": {
      "label": "Назва мети",
      "placeholder": "напр., Послання Павла"
    },
    "books": {
      "title": "Книги",
      "count": "{count} книга | {count} книги | {count} книг",
      "change": "Змінити",
      "select_all": "Вибрати всі",
      "clear": "Очистити",
      "old_testament": "Старий Заповіт",
      "new_testament": "Новий Заповіт"
    },
    "order": {
      "label": "Порядок читання:",
      "bible": "Біблійний порядок",
      "custom": "Власний",
      "reorder": "Змінити порядок",
      "reset": "Скинути",
      "move_up": "Перемістити {book} вгору",
      "move_down": "Перемістити {book} вниз"
    },
    "dates": {
      "title": "Розклад",
      "start": "Дата початку",
      "end": "Цільова дата",
      "presets": "Швидкий вибір тривалості",
      "preset_daily_goal": "Моя щоденна мета ({count}/день)",
      "preset_months": "{count} місяць | {count} місяці | {count} місяців",
      "preset_year": "1 рік",
      "required": "Віршів на день: {count}",
      "span": "Віршів: {total} за {days} день. | Віршів: {total} за {days} дні. | Віршів: {total} за {days} днів.",
      "daily_goal": "Ваша щоденна мета: {count}."
    },
    "errors": {
      "title": "Дайте меті назву.",
      "books": "Виберіть принаймні одну книгу.",
      "dates_required": "Виберіть дату початку та цільову дату.",
      "dates_order": "Цільова дата не може бути раніше дати початку.",
      "dates_too_long": "Мета може тривати до десяти років."
    },
    "done": "Готово",
    "cancel": "Скасувати",
    "save": "Зберегти зміни",
    "create": "Створити мету",
    "discard_confirm": "Скасувати зміни цієї мети?",
    "save_error": "Не вдалося зберегти мету. Спробуйте ще раз."
  }
}
</i18n>
