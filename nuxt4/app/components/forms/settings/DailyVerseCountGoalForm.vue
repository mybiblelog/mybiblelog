<template>
  <div>
    <h2 class="mbl-title mbl-title--5">
      {{ t('start_page.daily_verse_count_goal.title') }}
    </h2>
    <div class="mbl-content">
      <p>
        {{ t('start_page.daily_verse_count_goal.description') }}
      </p>

      <h3 class="mbl-title mbl-title--6">
        {{ t('start_page.daily_verse_count_goal.i_want_to') }}
      </h3>
    </div>

    <div class="option-cards">
      <!-- Read in 1 year -->
      <div class="option-card" :class="{ 'is-selected': selectedOption === 'year' }" @click="selectedOption = 'year'">
        <div class="option-card-radio">
          <input v-model="selectedOption" type="radio" value="year" @click.stop>
        </div>
        <div class="option-mbl-card__content">
          <div class="option-card-title">
            {{ t('start_page.daily_verse_count_goal.read_in_year') }}
          </div>
          <div class="option-card-details">
            <div class="detail-row">
              <span class="detail-label">{{ t('start_page.daily_verse_count_goal.daily_verse_count') }}:</span>
              <span class="detail-value">{{ getDailyGoalForOption('year').toLocaleString() }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('start_page.daily_verse_count_goal.finish_on') }}:</span>
              <span class="detail-value">{{ getFinishDateForOption('year') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Read by specific date -->
      <div class="option-card" :class="{ 'is-selected': selectedOption === 'specific' }" @click="selectedOption = 'specific'">
        <div class="option-card-radio">
          <input v-model="selectedOption" type="radio" value="specific" @click.stop>
        </div>
        <div class="option-mbl-card__content">
          <div class="option-card-title">
            {{ t('start_page.daily_verse_count_goal.read_by_specific_date') }}
          </div>
          <div class="option-card-details">
            <div class="detail-row">
              <label class="detail-label">{{ t('start_page.daily_verse_count_goal.goal_finish_date') }}:</label>
              <input
                v-model="goalFinishDate"
                class="mbl-input detail-input"
                type="date"
                :min="minDate"
                :disabled="selectedOption !== 'specific'"
                @click.stop
              >
            </div>
            <div v-if="calculatedDailyGoal" class="detail-row">
              <span class="detail-label">{{ t('start_page.daily_verse_count_goal.daily_verse_count') }}:</span>
              <span class="detail-value">{{ calculatedDailyGoal.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Read at my own pace -->
      <div class="option-card" :class="{ 'is-selected': selectedOption === 'ownpace' }" @click="selectedOption = 'ownpace'">
        <div class="option-card-radio">
          <input v-model="selectedOption" type="radio" value="ownpace" @click.stop>
        </div>
        <div class="option-mbl-card__content">
          <div class="option-card-title">
            {{ t('start_page.daily_verse_count_goal.read_at_own_pace') }}
          </div>
          <div class="option-card-details">
            <div class="detail-row">
              <label class="detail-label">{{ t('start_page.daily_verse_count_goal.daily_verse_count') }}:</label>
              <input
                v-model.number="dailyVerseCountGoal"
                class="mbl-input detail-input"
                type="number"
                min="1"
                max="1111"
                :disabled="selectedOption !== 'ownpace'"
                @click.stop
              >
            </div>
            <div v-if="calculatedFinishDate" class="detail-row">
              <span class="detail-label">{{ t('start_page.daily_verse_count_goal.finish_on') }}:</span>
              <span class="detail-value">{{ calculatedFinishDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mbl-help mbl-help--danger">
      {{ error }}
    </div>

    <div class="mbl-content">
      <p class="mbl-help">
        {{ t('start_page.daily_verse_count_goal.change_hint') }}
      </p>
    </div>

    <div class="mbl-field">
      <div class="mbl-control buttons">
        <button class="mbl-button" :disabled="isSaving" @click="handlePrevious">
          {{ previousButtonText }}
        </button>
        <button class="mbl-button mbl-button--primary" data-testid="start-goal-next" :disabled="isSaving" @click="handleSubmit">
          {{ nextButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useToastStore } from '~/stores/toast';
import { useUserSettingsStore } from '~/stores/user-settings';

const TOTAL_BIBLE_VERSES = 31102;

type GoalOption = 'year' | '2years' | '6months' | 'specific' | 'ownpace';

const props = withDefaults(defineProps<{
  initialValue?: number;
  nextButtonText?: string;
  previousButtonText?: string;
  showToast?: boolean;
}>(), {
  initialValue: 0,
  nextButtonText: 'Save and Continue',
  previousButtonText: 'Back',
  showToast: true,
});

const emit = defineEmits<{
  next: [];
  previous: [];
  saved: [value: number];
}>();

const { t, locale } = useI18n();

const dailyVerseCountGoal = ref<number>(props.initialValue || 0);
const goalFinishDate = ref('');
const selectedOption = ref<GoalOption>('year');
const error = ref('');
const isSaving = ref(false);

const minDate = computed(() => dayjs().add(1, 'day').format('YYYY-MM-DD'));

const daysToFinish = computed(() => {
  if (!goalFinishDate.value) { return null; }
  const today = dayjs().startOf('day');
  const goalDate = dayjs(goalFinishDate.value).startOf('day');
  const difference = goalDate.diff(today, 'day');
  return difference > 0 ? difference : null;
});

const calculatedDailyGoal = computed(() => {
  if (selectedOption.value !== 'specific' || !daysToFinish.value || daysToFinish.value <= 0) {
    return null;
  }
  return Math.ceil(TOTAL_BIBLE_VERSES / daysToFinish.value);
});

const calculatedFinishDate = computed(() => {
  if (selectedOption.value !== 'ownpace' || !dailyVerseCountGoal.value || dailyVerseCountGoal.value <= 0) {
    return null;
  }
  const daysNeeded = Math.ceil(TOTAL_BIBLE_VERSES / dailyVerseCountGoal.value);
  return displayDate(dayjs().add(daysNeeded, 'day').format('YYYY-MM-DD'));
});

function getDailyGoalForOption(option: GoalOption) {
  const today = dayjs().startOf('day');
  let days;
  switch (option) {
  case '2years': days = today.add(2, 'year').diff(today, 'day'); break;
  case 'year': days = today.add(1, 'year').diff(today, 'day'); break;
  case '6months': days = today.add(6, 'month').diff(today, 'day'); break;
  default: return 0;
  }
  return Math.ceil(TOTAL_BIBLE_VERSES / days);
}

function getFinishDateForOption(option: GoalOption) {
  const today = dayjs().startOf('day');
  let targetDate;
  switch (option) {
  case '2years': targetDate = today.add(2, 'year'); break;
  case 'year': targetDate = today.add(1, 'year'); break;
  case '6months': targetDate = today.add(6, 'month'); break;
  default: return '';
  }
  return displayDate(targetDate.format('YYYY-MM-DD'));
}

function displayDate(dateString: string) {
  const date = dayjs(dateString).toDate();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(locale.value, options);
}

function updateDateFromOption(option: GoalOption) {
  const today = dayjs().startOf('day');
  let targetDate;
  switch (option) {
  case '2years': targetDate = today.add(2, 'year'); break;
  case 'year': targetDate = today.add(1, 'year'); break;
  case '6months': targetDate = today.add(6, 'month'); break;
  default: return;
  }
  goalFinishDate.value = targetDate.format('YYYY-MM-DD');
}

watch(selectedOption, (newOption) => {
  if (newOption === 'specific') {
    if (!goalFinishDate.value) { updateDateFromOption('year'); }
  }
  else if (newOption === 'ownpace') {
    if (!dailyVerseCountGoal.value || dailyVerseCountGoal.value < 1) {
      dailyVerseCountGoal.value = getDailyGoalForOption('year');
    }
  }
  else {
    updateDateFromOption(newOption);
    dailyVerseCountGoal.value = getDailyGoalForOption(newOption);
  }
});

watch(goalFinishDate, (newDate) => {
  if (newDate && selectedOption.value === 'specific' && calculatedDailyGoal.value) {
    dailyVerseCountGoal.value = calculatedDailyGoal.value;
  }
});

watch(calculatedDailyGoal, (newGoal) => {
  if (newGoal && selectedOption.value === 'specific') {
    dailyVerseCountGoal.value = newGoal;
  }
});

watch(() => props.initialValue, (newValue) => {
  if (newValue) {
    dailyVerseCountGoal.value = newValue;
    if (!selectedOption.value || selectedOption.value === 'year') {
      const yearGoal = getDailyGoalForOption('year');
      const twoYearGoal = getDailyGoalForOption('2years');
      const sixMonthGoal = getDailyGoalForOption('6months');
      if (Math.abs(newValue - yearGoal) < Math.abs(newValue - twoYearGoal) &&
        Math.abs(newValue - yearGoal) < Math.abs(newValue - sixMonthGoal)) {
        selectedOption.value = 'year';
      }
      else if (Math.abs(newValue - twoYearGoal) < Math.abs(newValue - sixMonthGoal)) {
        selectedOption.value = '2years';
      }
      else if (Math.abs(newValue - sixMonthGoal) < 5) {
        selectedOption.value = '6months';
      }
      else {
        selectedOption.value = 'ownpace';
      }
    }
  }
});

onMounted(() => {
  updateDateFromOption('year');
  dailyVerseCountGoal.value = getDailyGoalForOption('year');
});

function handlePrevious() {
  emit('previous');
}

async function handleSubmit() {
  if (isSaving.value) { return; }
  error.value = '';

  if (!dailyVerseCountGoal.value || dailyVerseCountGoal.value < 1 || dailyVerseCountGoal.value > 1111) {
    error.value = t('messaging.unable_to_save_daily_verse_count_goal');
    return;
  }

  isSaving.value = true;
  const success = await useUserSettingsStore().updateSettings({ dailyVerseCountGoal: dailyVerseCountGoal.value });

  if (success) {
    if (props.showToast) {
      useToastStore().add({ type: 'success', text: t('messaging.daily_verse_count_goal_saved_successfully') });
    }
    emit('saved', dailyVerseCountGoal.value);
    emit('next');
  }
  else {
    error.value = t('messaging.unable_to_save_daily_verse_count_goal');
  }

  isSaving.value = false;
}
</script>

<style scoped>
.option-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.option-card {
  display: flex;
  align-items: flex-start;
  border: 2px solid var(--mbl-border);
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}
.option-card:hover {
  border-color: var(--mbl-secondary);
  background-color: var(--mbl-bg-muted);
}
.option-card.is-selected {
  border-color: var(--mbl-secondary);
  background-color: var(--mbl-message-info-bg);
}
.option-card-radio {
  margin-right: 1rem;
  margin-top: 0.25rem;
  flex-shrink: 0;
}
.option-card-radio input[type="radio"] {
  cursor: pointer;
}
.option-mbl-card__content {
  flex: 1;
  min-width: 0;
}
.option-card-title {
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}
.option-card-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.detail-label {
  font-weight: 500;
  min-width: fit-content;
}
.detail-value {
  color: var(--secondary-color);
  font-weight: 600;
}
.detail-input {
  max-width: 200px;
  flex: 0 0 auto;
}
.detail-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<i18n lang="json">
{
  "en": { "start_page": { "daily_verse_count_goal": { "title": "Daily Reading Goal", "description": "How many verses do you want to read each day? My Bible Log will show your progress toward this goal.", "i_want_to": "I want to...", "read_in_year": "Read the Bible in a year", "read_by_specific_date": "Read the Bible by a specific date", "read_at_own_pace": "Read at my own pace", "goal_finish_date": "Goal Finish Date", "finish_on": "Finish on", "daily_verse_count": "Verses to read each day", "change_hint": "You can change this setting at any time." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "Daily verse count goal saved successfully.", "unable_to_save_daily_verse_count_goal": "Unable to save. Please enter a number between 1 and 1111." } },
  "de": { "start_page": { "daily_verse_count_goal": { "title": "Tägliches Leseziel", "description": "Wie viele Verse möchten Sie jeden Tag lesen? My Bible Log zeigt Ihnen Ihren Fortschritt zu diesem Ziel.", "i_want_to": "Ich möchte...", "read_in_year": "Die Bibel in einem Jahr lesen", "read_by_specific_date": "Die Bibel bis zu einem bestimmten Datum lesen", "read_at_own_pace": "In meinem eigenen Tempo lesen", "goal_finish_date": "Ziel-Fertigstellungsdatum", "finish_on": "Fertig am", "daily_verse_count": "Verse pro Tag zu lesen", "change_hint": "Sie können diese Einstellung jederzeit ändern." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "Tägliche Verszahl Ziel erfolgreich gespeichert.", "unable_to_save_daily_verse_count_goal": "Nicht gespeichert. Bitte geben Sie eine Zahl zwischen 1 und 1111 ein." } },
  "es": { "start_page": { "daily_verse_count_goal": { "title": "Meta Diaria de Lectura", "description": "¿Cuántos versículos quiere leer cada día? My Bible Log mostrará su progreso hacia este objetivo.", "i_want_to": "Quiero...", "read_in_year": "Leer la Biblia en un año", "read_by_specific_date": "Leer la Biblia para una fecha específica", "read_at_own_pace": "Leer a mi propio ritmo", "goal_finish_date": "Fecha de Finalización del Objetivo", "finish_on": "Terminar el", "daily_verse_count": "Versículos para leer cada día", "change_hint": "Puede cambiar esta configuración en cualquier momento." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "Meta de versículos diarios guardada con éxito.", "unable_to_save_daily_verse_count_goal": "No se puede guardar. Por favor ingrese un número entre 1 y 1111." } },
  "fr": { "start_page": { "daily_verse_count_goal": { "title": "Objectif de lecture quotidien", "description": "Combien de versets voulez-vous lire chaque jour ? My Bible Log affichera vos progrès vers cet objectif.", "i_want_to": "Je veux...", "read_in_year": "Lire la Bible en un an", "read_by_specific_date": "Lire la Bible à une date spécifique", "read_at_own_pace": "Lire à mon propre rythme", "goal_finish_date": "Date de fin de l'objectif", "finish_on": "Terminer le", "daily_verse_count": "Versets à lire chaque jour", "change_hint": "Vous pouvez modifier ce paramètre à tout moment." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "Objectif de nombre de versets quotidiens enregistré avec succès.", "unable_to_save_daily_verse_count_goal": "Impossible d'enregistrer. Veuillez entrer un nombre entre 1 et 1111." } },
  "ko": { "start_page": { "daily_verse_count_goal": { "title": "일일 읽기 목표", "description": "매일 몇 구절을 읽고 싶으신가요? My Bible Log는 이 목표를 향한 진도를 표시해줍니다.", "i_want_to": "저는…", "read_in_year": "1년 1독하고 싶어요", "read_by_specific_date": "정해진 날짜까지 1독하고 싶어요", "read_at_own_pace": "저만의 속도대로 읽고 싶어요", "goal_finish_date": "목표달성일", "finish_on": "완료일", "daily_verse_count": "매일 읽어야 할 구절 수", "change_hint": "이 설정은 언제든지 바꿀 수 있습니다." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "일일 구절 수 목표가 저장되었습니다.", "unable_to_save_daily_verse_count_goal": "저장할 수 없습니다. 1~1111 사이의 숫자를 입력해 주세요." } },
  "pt": { "start_page": { "daily_verse_count_goal": { "title": "Meta Diária de Leitura", "description": "Quantos versículos você quer ler cada dia? My Bible Log mostrará seu progresso em direção a este objetivo.", "i_want_to": "Eu quero...", "read_in_year": "Ler a Bíblia em um ano", "read_by_specific_date": "Ler a Bíblia até uma data específica", "read_at_own_pace": "Ler no meu próprio ritmo", "goal_finish_date": "Data de Conclusão do Objetivo", "finish_on": "Terminar em", "daily_verse_count": "Versículos para ler cada dia", "change_hint": "Você pode alterar esta configuração a qualquer momento." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "Meta de versículos diários salva com sucesso.", "unable_to_save_daily_verse_count_goal": "Não foi possível salvar. Por favor, insira um número entre 1 e 1111." } },
  "uk": { "start_page": { "daily_verse_count_goal": { "title": "Щоденна мета читання", "description": "Скільки віршів ви хочете читати кожного дня? My Bible Log покаже ваш прогрес до цієї мети.", "i_want_to": "Я хочу...", "read_in_year": "Прочитати Біблію за рік", "read_by_specific_date": "Прочитати Біблію до певної дати", "read_at_own_pace": "Читати у своєму темпі", "goal_finish_date": "Дата завершення мети", "finish_on": "Завершити", "daily_verse_count": "Вірші для читання щодня", "change_hint": "Ви можете змінити це налаштування в будь-який час." } }, "messaging": { "daily_verse_count_goal_saved_successfully": "Мету щоденної кількості віршів успішно збережено.", "unable_to_save_daily_verse_count_goal": "Не вдалося зберегти. Будь ласка, введіть число від 1 до 1111." } }
}
</i18n>
