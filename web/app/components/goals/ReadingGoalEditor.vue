<template>
  <div class="goal-editor" data-testid="reading-goal-editor">
    <h2 class="mbl-title mbl-title--4">
      {{ isEditing ? t('edit_goal') : t('new_goal') }}
    </h2>
    <pill-progress-bar v-if="step !== 'start' && !fromTemplate" class="goal-editor__progress" :current-step="stepNumber" :total-steps="stepCount" />

    <!-- Step 0: choose a template or start a custom goal (create only) -->
    <div v-if="step === 'start'">
      <p class="goal-editor__prompt">
        {{ t('start.prompt') }}
      </p>
      <div class="goal-editor__templates">
        <button
          v-for="template in templates"
          :key="template.id"
          type="button"
          class="mbl-card goal-editor__template"
          data-testid="reading-goal-template"
          :data-template-id="template.id"
          @click="chooseTemplate(template.id)"
        >
          <span class="goal-editor__template-name">{{ t(`template.${template.id}`) }}</span>
          <span class="mbl-text-small mbl-text-muted">
            {{ t('verse_count', { count: $n(template.totalVerses, 'grouped') }) }}
          </span>
        </button>
        <button
          type="button"
          class="mbl-card goal-editor__template goal-editor__template--custom"
          data-testid="reading-goal-template-custom"
          @click="chooseCustom"
        >
          <span class="goal-editor__template-name">{{ t('start.custom') }}</span>
          <span class="mbl-text-small mbl-text-muted">{{ t('start.custom_description') }}</span>
        </button>
      </div>
    </div>

    <!-- Step 1: name -->
    <div v-else-if="step === 'name'">
      <label class="mbl-label" for="goal-title">{{ t('name.label') }}</label>
      <input
        id="goal-title"
        v-model="title"
        class="mbl-input"
        type="text"
        maxlength="100"
        :placeholder="t('name.placeholder')"
        data-testid="reading-goal-title"
        @keydown.enter.prevent="next"
      >
    </div>

    <!-- Step 2: books -->
    <div v-else-if="step === 'books'">
      <div class="goal-editor__books-header">
        <span>{{ t('books.prompt') }}</span>
        <strong data-testid="reading-goal-selected-verses">
          {{ t('verse_count', { count: $n(selectedVerseCount, 'grouped') }) }}
        </strong>
      </div>
      <div v-for="testament in testaments" :key="testament.key" class="goal-editor__testament">
        <h3 class="mbl-title mbl-title--6">
          {{ t(`books.${testament.key}`) }}
        </h3>
        <div class="goal-editor__book-grid">
          <label
            v-for="book in testament.books"
            :key="book.index"
            class="mbl-checkbox goal-editor__book"
            :class="{ 'goal-editor__book--selected': selectedBooks.has(book.index) }"
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
      </div>
    </div>

    <!-- Step 3: order -->
    <div v-else-if="step === 'order'">
      <p class="goal-editor__prompt">
        {{ t('order.prompt') }}
      </p>
      <ol class="goal-editor__order" data-testid="reading-goal-order">
        <li v-for="(bookIndex, position) in orderedBooks" :key="bookIndex" class="mbl-card mbl-card--list-item goal-editor__order-item">
          <span>{{ bookName(bookIndex) }}</span>
          <span class="mbl-button-group">
            <button
              type="button"
              class="mbl-button mbl-button--sm"
              :disabled="position === 0"
              :aria-label="t('order.move_up', { book: bookName(bookIndex) })"
              @click="move(position, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="mbl-button mbl-button--sm"
              :disabled="position === orderedBooks.length - 1"
              :aria-label="t('order.move_down', { book: bookName(bookIndex) })"
              @click="move(position, 1)"
            >
              ↓
            </button>
          </span>
        </li>
      </ol>
    </div>

    <!-- Step 4: dates -->
    <div v-else-if="step === 'dates'">
      <template v-if="fromTemplate">
        <label class="mbl-label" for="goal-title-template">{{ t('name.label') }}</label>
        <input
          id="goal-title-template"
          v-model="title"
          class="mbl-input goal-editor__field"
          type="text"
          maxlength="100"
          data-testid="reading-goal-title"
        >
        <p class="mbl-text-small mbl-text-muted goal-editor__template-books" data-testid="reading-goal-template-books">
          {{ orderedBooks.map(bookName).join(', ') }}
        </p>
      </template>
      <div class="goal-editor__dates">
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
            type="date"
            :min="startDate"
            data-testid="reading-goal-end-date"
            @input="endDateTouched = true"
          >
        </div>
      </div>
      <div class="mbl-message mbl-message--info goal-editor__pace">
        <div class="mbl-message__body">
          <div data-testid="reading-goal-required-pace">
            {{ t('dates.required', { count: $n(Math.ceil(requiredPerDay), 'grouped'), total: $n(selectedVerseCount, 'grouped'), days: $n(dayCount, 'grouped') }) }}
          </div>
          <div class="mbl-text-small">
            {{ t('dates.daily_goal', { count: $n(dailyVerseCountGoal, 'grouped') }) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mbl-help mbl-help--danger" data-testid="reading-goal-error">
      {{ error }}
    </div>

    <div class="mbl-button-group goal-editor__actions">
      <button type="button" class="mbl-button" data-testid="reading-goal-cancel" @click="emit('cancel')">
        {{ t('cancel') }}
      </button>
      <button v-if="canGoBack" type="button" class="mbl-button" data-testid="reading-goal-back" @click="back">
        {{ t('back') }}
      </button>
      <button
        v-if="step !== 'start' && step !== 'dates'"
        type="button"
        class="mbl-button mbl-button--primary"
        :disabled="!stepValid"
        data-testid="reading-goal-next"
        @click="next"
      >
        {{ t('next') }}
      </button>
      <button
        v-if="step === 'dates'"
        type="button"
        class="mbl-button mbl-button--primary"
        :disabled="!stepValid || saving"
        data-testid="reading-goal-save"
        @click="save"
      >
        {{ t('save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import {
  Bible,
  READING_GOAL_TEMPLATES,
  bookToPassage,
  getDefaultEndDate,
  getGoalTotalVerses,
  getRequiredVersesPerDay,
  getTemplatePassages,
  inclusiveDays,
  isWholeBookPassage,
  passageBookIndex,
  type ReadingGoal,
} from '@mybiblelog/shared';
import PillProgressBar from '~/components/ui/PillProgressBar.vue';
import { useReadingGoalsStore } from '~/stores/reading-goals';
import { useUserSettingsStore } from '~/stores/user-settings';

type Step = 'start' | 'name' | 'books' | 'order' | 'dates';

const props = defineProps<{
  /** The goal to edit; omit to create a new one. */
  goal?: ReadingGoal | null;
}>();

const emit = defineEmits<{
  saved: [goal: ReadingGoal];
  cancel: [];
}>();

const { t, locale } = useI18n();
const readingGoalsStore = useReadingGoalsStore();
const userSettingsStore = useUserSettingsStore();

const isEditing = computed(() => !!props.goal);
const today = dayjs().format('YYYY-MM-DD');

// Book selection is a set; the ordered list is reconciled from it when entering
// the order step, so reordering survives going back to add or remove books.
const title = ref(props.goal?.title ?? '');
const selectedBooks = ref(new Set<number>(
  (props.goal?.passages ?? []).filter(isWholeBookPassage).map(passageBookIndex),
));
const orderedBooks = ref<number[]>((props.goal?.passages ?? []).filter(isWholeBookPassage).map(passageBookIndex));
const startDate = ref(props.goal?.startDate ?? today);
const endDate = ref(props.goal?.endDate ?? '');
const endDateTouched = ref(isEditing.value);
const fromTemplate = ref(false);
const step = ref<Step>(isEditing.value ? 'name' : 'start');
const saving = ref(false);
const error = ref('');

const customSteps: Step[] = ['name', 'books', 'order', 'dates'];
const stepNumber = computed(() => customSteps.indexOf(step.value) + 1);
const stepCount = customSteps.length;

const dailyVerseCountGoal = computed(() => userSettingsStore.settings.dailyVerseCountGoal || 1);

const templates = READING_GOAL_TEMPLATES.map(template => ({
  id: template.id,
  totalVerses: getGoalTotalVerses(getTemplatePassages(template.id)),
}));

const bookName = (bookIndex: number) => Bible.getBookName(bookIndex, locale.value);

const testaments = computed(() => {
  const books = Bible.getBooks().map((_, i) => ({ index: i + 1, name: bookName(i + 1) }));
  return [
    { key: 'old_testament', books: books.filter(b => !Bible.isNewTestament(b.index)) },
    { key: 'new_testament', books: books.filter(b => Bible.isNewTestament(b.index)) },
  ];
});

const selectedVerseCount = computed(() =>
  [...selectedBooks.value].reduce((sum, bookIndex) => sum + Bible.getBookVerseCount(bookIndex), 0),
);

const dayCount = computed(() => inclusiveDays(startDate.value, endDate.value));
const requiredPerDay = computed(() => getRequiredVersesPerDay(selectedVerseCount.value, startDate.value, endDate.value || startDate.value));

const applyDefaultEndDate = () => {
  if (endDateTouched.value || !startDate.value) { return; }
  endDate.value = getDefaultEndDate(startDate.value, selectedVerseCount.value, dailyVerseCountGoal.value);
};

watch(startDate, applyDefaultEndDate);

const toggleBook = (bookIndex: number) => {
  const next = new Set(selectedBooks.value);
  if (next.has(bookIndex)) { next.delete(bookIndex); }
  else { next.add(bookIndex); }
  selectedBooks.value = next;
};

const reconcileOrder = () => {
  const kept = orderedBooks.value.filter(b => selectedBooks.value.has(b));
  const added = [...selectedBooks.value].filter(b => !kept.includes(b)).sort((a, b) => a - b);
  orderedBooks.value = [...kept, ...added];
};

const move = (position: number, delta: number) => {
  const list = [...orderedBooks.value];
  const [book] = list.splice(position, 1);
  list.splice(position + delta, 0, book!);
  orderedBooks.value = list;
};

const stepValid = computed(() => {
  switch (step.value) {
  case 'name': return title.value.trim().length > 0;
  case 'books': return selectedBooks.value.size > 0;
  case 'order': return orderedBooks.value.length > 0;
  case 'dates': return title.value.trim().length > 0 && !!startDate.value && !!endDate.value && endDate.value >= startDate.value;
  default: return true;
  }
});

const canGoBack = computed(() => {
  if (step.value === 'start') { return false; }
  if (fromTemplate.value) { return true; }
  return isEditing.value ? step.value !== 'name' : true;
});

const goTo = (target: Step) => {
  error.value = '';
  if (target === 'order') { reconcileOrder(); }
  if (target === 'dates') { applyDefaultEndDate(); }
  step.value = target;
};

const next = () => {
  if (!stepValid.value) { return; }
  const index = customSteps.indexOf(step.value);
  goTo(customSteps[index + 1]!);
};

const back = () => {
  if (fromTemplate.value || step.value === 'name') {
    fromTemplate.value = false;
    goTo('start');
    return;
  }
  goTo(customSteps[customSteps.indexOf(step.value) - 1]!);
};

const chooseTemplate = (id: string) => {
  const passages = getTemplatePassages(id);
  fromTemplate.value = true;
  title.value = t(`template.${id}`);
  selectedBooks.value = new Set(passages.map(passageBookIndex));
  orderedBooks.value = passages.map(passageBookIndex);
  endDateTouched.value = false;
  goTo('dates');
};

const chooseCustom = () => {
  fromTemplate.value = false;
  title.value = '';
  selectedBooks.value = new Set();
  orderedBooks.value = [];
  endDateTouched.value = false;
  goTo('name');
};

const save = async () => {
  if (!stepValid.value) { return; }
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
.goal-editor__progress {
  margin-bottom: var(--mbl-space-lg);
}

.goal-editor__prompt {
  margin-bottom: var(--mbl-space-md);
}

.goal-editor__template-books {
  margin-bottom: var(--mbl-space-lg);
}

.goal-editor__templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--mbl-space-sm);
}

.goal-editor__template {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mbl-space-3xs);
  padding: var(--mbl-space-md);
  border: 1px solid var(--mbl-border);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.goal-editor__template:hover {
  border-color: var(--mbl-link-bright);
  box-shadow: var(--mbl-shadow-card-hover);
}

.goal-editor__template--custom {
  border-style: dashed;
}

.goal-editor__template-name {
  color: var(--mbl-text-strong);
  font-weight: 600;
}

.goal-editor__books-header {
  display: flex;
  justify-content: space-between;
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-md);
}

.goal-editor__testament {
  margin-bottom: var(--mbl-space-lg);
}

.goal-editor__book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--mbl-space-3xs) var(--mbl-space-sm);
}

.goal-editor__book {
  padding: var(--mbl-space-3xs) var(--mbl-space-xs);
  border-radius: var(--mbl-radius-sm);
}

.goal-editor__book--selected {
  background: var(--mbl-primary-soft);
}

.goal-editor__order {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.goal-editor__order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goal-editor__order-item .mbl-button-group {
  margin: 0;
}

.goal-editor__field {
  margin-bottom: var(--mbl-space-xs);
}

.goal-editor__dates {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-md);
}

.goal-editor__pace {
  margin-bottom: var(--mbl-space-md);
}

.goal-editor__actions {
  margin-top: var(--mbl-space-lg);
}
</style>

<i18n lang="json">
{
  "en": {
    "new_goal": "New goal",
    "edit_goal": "Edit goal",
    "start": {
      "prompt": "Start from a common reading plan, or build your own.",
      "custom": "Custom goal",
      "custom_description": "Choose your own books"
    },
    "template": {
      "whole_bible": "Whole Bible",
      "old_testament": "Old Testament",
      "new_testament": "New Testament",
      "gospels": "Gospels",
      "wisdom": "Wisdom"
    },
    "verse_count": "{count} verses",
    "name": {
      "label": "Goal name",
      "placeholder": "e.g. Letters of Paul"
    },
    "books": {
      "prompt": "Select the books to read.",
      "old_testament": "Old Testament",
      "new_testament": "New Testament"
    },
    "order": {
      "prompt": "Put the books in the order you want to read them.",
      "move_up": "Move {book} up",
      "move_down": "Move {book} down"
    },
    "dates": {
      "start": "Start date",
      "end": "Goal date",
      "required": "Read {count} verses per day to finish {total} verses in {days} days.",
      "daily_goal": "Your daily verse count goal is {count} verses."
    },
    "cancel": "Cancel",
    "back": "Back",
    "next": "Next",
    "save": "Save",
    "save_error": "The goal could not be saved. Please try again."
  },
  "de": {
    "new_goal": "Neues Ziel",
    "edit_goal": "Ziel bearbeiten",
    "start": {
      "prompt": "Beginnen Sie mit einem gängigen Leseplan oder erstellen Sie Ihren eigenen.",
      "custom": "Eigenes Ziel",
      "custom_description": "Bücher selbst auswählen"
    },
    "template": {
      "whole_bible": "Ganze Bibel",
      "old_testament": "Altes Testament",
      "new_testament": "Neues Testament",
      "gospels": "Evangelien",
      "wisdom": "Weisheit"
    },
    "verse_count": "{count} Verse",
    "name": {
      "label": "Name des Ziels",
      "placeholder": "z. B. Paulusbriefe"
    },
    "books": {
      "prompt": "Wählen Sie die Bücher aus, die Sie lesen möchten.",
      "old_testament": "Altes Testament",
      "new_testament": "Neues Testament"
    },
    "order": {
      "prompt": "Bringen Sie die Bücher in die gewünschte Lesereihenfolge.",
      "move_up": "{book} nach oben verschieben",
      "move_down": "{book} nach unten verschieben"
    },
    "dates": {
      "start": "Startdatum",
      "end": "Zieldatum",
      "required": "Lesen Sie {count} Verse pro Tag, um {total} Verse in {days} Tagen zu schaffen.",
      "daily_goal": "Ihr tägliches Versziel liegt bei {count} Versen."
    },
    "cancel": "Abbrechen",
    "back": "Zurück",
    "next": "Weiter",
    "save": "Speichern",
    "save_error": "Das Ziel konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
  },
  "es": {
    "new_goal": "Nueva meta",
    "edit_goal": "Editar meta",
    "start": {
      "prompt": "Empieza con un plan de lectura común o crea el tuyo.",
      "custom": "Meta personalizada",
      "custom_description": "Elige tus propios libros"
    },
    "template": {
      "whole_bible": "Toda la Biblia",
      "old_testament": "Antiguo Testamento",
      "new_testament": "Nuevo Testamento",
      "gospels": "Evangelios",
      "wisdom": "Sabiduría"
    },
    "verse_count": "{count} versículos",
    "name": {
      "label": "Nombre de la meta",
      "placeholder": "p. ej., Cartas de Pablo"
    },
    "books": {
      "prompt": "Selecciona los libros que quieres leer.",
      "old_testament": "Antiguo Testamento",
      "new_testament": "Nuevo Testamento"
    },
    "order": {
      "prompt": "Ordena los libros como quieras leerlos.",
      "move_up": "Subir {book}",
      "move_down": "Bajar {book}"
    },
    "dates": {
      "start": "Fecha de inicio",
      "end": "Fecha objetivo",
      "required": "Lee {count} versículos al día para terminar {total} versículos en {days} días.",
      "daily_goal": "Tu meta diaria es de {count} versículos."
    },
    "cancel": "Cancelar",
    "back": "Atrás",
    "next": "Siguiente",
    "save": "Guardar",
    "save_error": "No se pudo guardar la meta. Inténtalo de nuevo."
  },
  "fr": {
    "new_goal": "Nouvel objectif",
    "edit_goal": "Modifier l'objectif",
    "start": {
      "prompt": "Partez d’un plan de lecture courant ou créez le vôtre.",
      "custom": "Objectif personnalisé",
      "custom_description": "Choisissez vos livres"
    },
    "template": {
      "whole_bible": "Bible entière",
      "old_testament": "Ancien Testament",
      "new_testament": "Nouveau Testament",
      "gospels": "Évangiles",
      "wisdom": "Sagesse"
    },
    "verse_count": "{count} versets",
    "name": {
      "label": "Nom de l'objectif",
      "placeholder": "p. ex. Épîtres de Paul"
    },
    "books": {
      "prompt": "Sélectionnez les livres à lire.",
      "old_testament": "Ancien Testament",
      "new_testament": "Nouveau Testament"
    },
    "order": {
      "prompt": "Placez les livres dans l’ordre où vous voulez les lire.",
      "move_up": "Monter {book}",
      "move_down": "Descendre {book}"
    },
    "dates": {
      "start": "Date de début",
      "end": "Date cible",
      "required": "Lisez {count} versets par jour pour terminer {total} versets en {days} jours.",
      "daily_goal": "Votre objectif quotidien est de {count} versets."
    },
    "cancel": "Annuler",
    "back": "Retour",
    "next": "Suivant",
    "save": "Enregistrer",
    "save_error": "L'objectif n'a pas pu être enregistré. Veuillez réessayer."
  },
  "ko": {
    "new_goal": "새 목표",
    "edit_goal": "목표 편집",
    "start": {
      "prompt": "자주 쓰는 읽기 계획으로 시작하거나 직접 만들어 보세요.",
      "custom": "직접 만들기",
      "custom_description": "원하는 책을 직접 선택"
    },
    "template": {
      "whole_bible": "성경 전체",
      "old_testament": "구약",
      "new_testament": "신약",
      "gospels": "복음서",
      "wisdom": "지혜서"
    },
    "verse_count": "{count}절",
    "name": {
      "label": "목표 이름",
      "placeholder": "예: 바울 서신"
    },
    "books": {
      "prompt": "읽을 책을 선택하세요.",
      "old_testament": "구약",
      "new_testament": "신약"
    },
    "order": {
      "prompt": "읽고 싶은 순서대로 책을 정렬하세요.",
      "move_up": "{book} 위로 이동",
      "move_down": "{book} 아래로 이동"
    },
    "dates": {
      "start": "시작일",
      "end": "목표일",
      "required": "{days}일 동안 {total}절을 마치려면 하루에 {count}절을 읽으세요.",
      "daily_goal": "하루 목표 구절 수는 {count}절입니다."
    },
    "cancel": "취소",
    "back": "뒤로",
    "next": "다음",
    "save": "저장",
    "save_error": "목표를 저장하지 못했습니다. 다시 시도해 주세요."
  },
  "pt": {
    "new_goal": "Nova meta",
    "edit_goal": "Editar meta",
    "start": {
      "prompt": "Comece com um plano de leitura comum ou crie o seu.",
      "custom": "Meta personalizada",
      "custom_description": "Escolha seus próprios livros"
    },
    "template": {
      "whole_bible": "Bíblia inteira",
      "old_testament": "Antigo Testamento",
      "new_testament": "Novo Testamento",
      "gospels": "Evangelhos",
      "wisdom": "Sabedoria"
    },
    "verse_count": "{count} versículos",
    "name": {
      "label": "Nome da meta",
      "placeholder": "ex.: Cartas de Paulo"
    },
    "books": {
      "prompt": "Selecione os livros para ler.",
      "old_testament": "Antigo Testamento",
      "new_testament": "Novo Testamento"
    },
    "order": {
      "prompt": "Coloque os livros na ordem em que deseja lê-los.",
      "move_up": "Mover {book} para cima",
      "move_down": "Mover {book} para baixo"
    },
    "dates": {
      "start": "Data de início",
      "end": "Data da meta",
      "required": "Leia {count} versículos por dia para concluir {total} versículos em {days} dias.",
      "daily_goal": "Sua meta diária é de {count} versículos."
    },
    "cancel": "Cancelar",
    "back": "Voltar",
    "next": "Próximo",
    "save": "Salvar",
    "save_error": "Não foi possível salvar a meta. Tente novamente."
  },
  "uk": {
    "new_goal": "Нова мета",
    "edit_goal": "Редагувати мету",
    "start": {
      "prompt": "Почніть зі стандартного плану читання або створіть власний.",
      "custom": "Власна мета",
      "custom_description": "Виберіть власні книги"
    },
    "template": {
      "whole_bible": "Уся Біблія",
      "old_testament": "Старий Заповіт",
      "new_testament": "Новий Заповіт",
      "gospels": "Євангелія",
      "wisdom": "Мудрість"
    },
    "verse_count": "Віршів: {count}",
    "name": {
      "label": "Назва мети",
      "placeholder": "напр., Послання Павла"
    },
    "books": {
      "prompt": "Виберіть книги для читання.",
      "old_testament": "Старий Заповіт",
      "new_testament": "Новий Заповіт"
    },
    "order": {
      "prompt": "Розташуйте книги в порядку, в якому хочете їх читати.",
      "move_up": "Перемістити {book} вгору",
      "move_down": "Перемістити {book} вниз"
    },
    "dates": {
      "start": "Дата початку",
      "end": "Цільова дата",
      "required": "Читайте {count} віршів на день, щоб завершити {total} віршів за {days} днів.",
      "daily_goal": "Ваша щоденна мета: {count} віршів."
    },
    "cancel": "Скасувати",
    "back": "Назад",
    "next": "Далі",
    "save": "Зберегти",
    "save_error": "Не вдалося зберегти мету. Спробуйте ще раз."
  }
}
</i18n>
