<template>
  <NuxtLink
    class="mbl-card mbl-card--list-item reading-goal-card"
    :class="{ 'reading-goal-card--complete': progress.isComplete }"
    :to="localePath(`/goals/${goal.id}`)"
    data-testid="reading-goal-card"
    :data-goal-id="goal.id"
    :data-complete="progress.isComplete"
  >
    <div class="reading-goal-card__header">
      <span class="reading-goal-card__title" data-testid="reading-goal-card-title">{{ goal.title }}</span>
      <span v-if="progress.isComplete" class="reading-goal-card__status reading-goal-card__status--complete" data-testid="reading-goal-card-complete">
        <checkmark-icon width="16px" height="16px" stroke="var(--mbl-success)" />
        {{ t('complete') }}
      </span>
      <span v-else-if="isOverdue" class="reading-goal-card__status reading-goal-card__status--overdue">
        {{ t('overdue') }}
      </span>
      <span v-else class="reading-goal-card__status mbl-text-muted">
        {{ t('days_left', { count: daysLeft }, daysLeft) }}
      </span>
    </div>
    <completion-bar
      class="reading-goal-card__bar"
      :percentage="progress.percent"
      :foreground-color="progress.isComplete ? 'var(--mbl-success)' : 'var(--mbl-link-bright)'"
    />
    <div class="reading-goal-card__stats mbl-text-small">
      <span data-testid="reading-goal-card-verses">
        {{ t('verses_of_total', { read: $n(progress.versesRead, 'grouped'), total: $n(progress.totalVerses, 'grouped') }) }}
        ({{ $n(Math.floor(progress.percent) / 100, 'percent') }})
      </span>
      <span v-if="!progress.isComplete" class="mbl-text-muted">
        {{ t('pace', { required: formatPace(progress.requiredPerDay), average: formatPace(progress.averagePerDay) }) }}
      </span>
    </div>
    <div v-if="nextUpLabel" class="reading-goal-card__next mbl-text-small" data-testid="reading-goal-card-next-up">
      {{ t('next_up', { passage: nextUpLabel }) }}
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible, inclusiveDays, type ReadingGoal, type ReadingGoalProgress } from '@mybiblelog/shared';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';

const props = defineProps<{
  goal: ReadingGoal;
  progress: ReadingGoalProgress;
}>();

const { t, locale, n } = useI18n();
const localePath = useLocalePath();

const today = computed(() => dayjs().format('YYYY-MM-DD'));
const isOverdue = computed(() => today.value > props.goal.endDate);
const daysLeft = computed(() => inclusiveDays(today.value, props.goal.endDate));

const formatPace = (versesPerDay: number) => n(Math.round(versesPerDay * 10) / 10);

const nextUpLabel = computed(() => {
  const nextUp = props.progress.nextUp;
  return nextUp ? Bible.displayVerseRange(nextUp.startVerseId, nextUp.endVerseId, locale.value) : '';
});
</script>

<style scoped>
.reading-goal-card {
  display: block;
  color: var(--mbl-text-body);
  text-decoration: none;
}

.reading-goal-card:hover {
  box-shadow: var(--mbl-shadow-card-hover);
}

.reading-goal-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mbl-space-sm);
  margin-bottom: var(--mbl-space-xs);
}

.reading-goal-card__title {
  color: var(--mbl-text-strong);
  font-weight: 600;
}

.reading-goal-card__status {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-3xs);
  white-space: nowrap;
  font-size: var(--mbl-title-6);
}

.reading-goal-card__status--complete {
  color: var(--mbl-success);
}

.reading-goal-card__status--overdue {
  color: var(--mbl-warning-fg);
}

.reading-goal-card__bar {
  margin-bottom: var(--mbl-space-xs);
}

.reading-goal-card__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--mbl-space-3xs) var(--mbl-space-md);
}

.reading-goal-card__next {
  margin-top: var(--mbl-space-3xs);
}
</style>

<i18n lang="json">
{
  "en": {
    "complete": "Complete",
    "overdue": "Overdue",
    "days_left": "{count} day left | {count} days left",
    "verses_of_total": "{read} of {total} verses",
    "pace": "Need {required}/day · Averaging {average}/day",
    "next_up": "Next up: {passage}"
  },
  "de": {
    "complete": "Abgeschlossen",
    "overdue": "Überfällig",
    "days_left": "Noch {count} Tag | Noch {count} Tage",
    "verses_of_total": "{read} von {total} Versen",
    "pace": "Nötig: {required}/Tag · Schnitt: {average}/Tag",
    "next_up": "Als Nächstes: {passage}"
  },
  "es": {
    "complete": "Completada",
    "overdue": "Atrasada",
    "days_left": "Queda {count} día | Quedan {count} días",
    "verses_of_total": "{read} de {total} versículos",
    "pace": "Necesario: {required}/día · Promedio: {average}/día",
    "next_up": "Siguiente: {passage}"
  },
  "fr": {
    "complete": "Terminé",
    "overdue": "En retard",
    "days_left": "{count} jour restant | {count} jours restants",
    "verses_of_total": "{read} versets sur {total}",
    "pace": "Requis : {required}/jour · Moyenne : {average}/jour",
    "next_up": "À suivre : {passage}"
  },
  "ko": {
    "complete": "완료",
    "overdue": "기한 지남",
    "days_left": "{count}일 남음",
    "verses_of_total": "{total}절 중 {read}절",
    "pace": "필요: 하루 {required}절 · 평균: 하루 {average}절",
    "next_up": "다음 읽을 곳: {passage}"
  },
  "pt": {
    "complete": "Concluída",
    "overdue": "Atrasada",
    "days_left": "Falta {count} dia | Faltam {count} dias",
    "verses_of_total": "{read} de {total} versículos",
    "pace": "Necessário: {required}/dia · Média: {average}/dia",
    "next_up": "A seguir: {passage}"
  },
  "uk": {
    "complete": "Виконано",
    "overdue": "Прострочено",
    "days_left": "Залишився {count} день | Залишилося {count} дні | Залишилося {count} днів",
    "verses_of_total": "{read} з {total} віршів",
    "pace": "Потрібно: {required}/день · В середньому: {average}/день",
    "next_up": "Далі: {passage}"
  }
}
</i18n>
