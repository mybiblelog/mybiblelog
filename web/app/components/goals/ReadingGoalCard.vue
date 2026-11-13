<template>
  <div
    class="mbl-card mbl-card--list-item reading-goal-card"
    :class="{ 'reading-goal-card--complete': progress.isComplete }"
    data-testid="reading-goal-card"
    :data-goal-id="goal.id"
    :data-complete="progress.isComplete"
  >
    <NuxtLink class="reading-goal-card__link" :to="localePath({ name: 'goals-id', params: { id: goal.id } })">
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
    </NuxtLink>
    <log-entry
      v-if="progress.nextUp"
      class="reading-goal-card__next"
      data-testid="reading-goal-card-next-up"
      :message="t('next_up')"
      :passage="progress.nextUp"
      :actions="nextUpActions(progress.nextUp)"
    />
    <reading-goal-outside-canon-note :progress="progress" data-testid="reading-goal-card-outside-canon" />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { inclusiveDays, type GoalPassage, type ReadingGoal, type ReadingGoalProgress } from '@mybiblelog/shared';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';
import ReadingGoalOutsideCanonNote from '~/components/goals/ReadingGoalOutsideCanonNote.vue';
import LogEntry from '~/components/log/LogEntry.vue';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';

const props = defineProps<{
  goal: ReadingGoal;
  progress: ReadingGoalProgress;
}>();

const { t, n } = useI18n();
const localePath = useLocalePath();
const logEntryEditorStore = useLogEntryEditorStore();
const { openPassageInBible } = useOpenInBible();

const today = computed(() => dayjs().format('YYYY-MM-DD'));
const isOverdue = computed(() => today.value > props.goal.endDate);
const daysLeft = computed(() => inclusiveDays(today.value, props.goal.endDate));

const formatPace = (versesPerDay: number) => n(Math.round(versesPerDay * 10) / 10);

const nextUpActions = (passage: GoalPassage) => [
  { label: t('open_bible'), callback: () => openPassageInBible(passage) },
  {
    label: t('log_reading'),
    callback: () => logEntryEditorStore.openEditor({
      id: null,
      date: today.value,
      startVerseId: passage.startVerseId,
      endVerseId: passage.endVerseId,
    }),
  },
];
</script>

<style scoped>
.reading-goal-card__link {
  display: block;
  color: var(--mbl-text-body);
  text-decoration: none;
}

.reading-goal-card:has(.reading-goal-card__link:hover) {
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
  margin: var(--mbl-space-xs) 0 0;
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
    "next_up": "Next up",
    "open_bible": "Open Bible",
    "log_reading": "Log Reading"
  },
  "de": {
    "complete": "Abgeschlossen",
    "overdue": "Überfällig",
    "days_left": "Noch {count} Tag | Noch {count} Tage",
    "verses_of_total": "{read} von {total} Versen",
    "pace": "Nötig: {required}/Tag · Schnitt: {average}/Tag",
    "next_up": "Als Nächstes",
    "open_bible": "Bibel öffnen",
    "log_reading": "Lesen protokollieren"
  },
  "es": {
    "complete": "Completada",
    "overdue": "Atrasada",
    "days_left": "Queda {count} día | Quedan {count} días",
    "verses_of_total": "{read} de {total} versículos",
    "pace": "Necesario: {required}/día · Promedio: {average}/día",
    "next_up": "Siguiente",
    "open_bible": "Abrir en la Biblia",
    "log_reading": "Agregar lectura a registro"
  },
  "fr": {
    "complete": "Terminé",
    "overdue": "En retard",
    "days_left": "{count} jour restant | {count} jours restants",
    "verses_of_total": "{read} versets sur {total}",
    "pace": "Requis : {required}/jour · Moyenne : {average}/jour",
    "next_up": "À suivre",
    "open_bible": "Ouvrir dans la Bible",
    "log_reading": "Ajouter lecture à registre"
  },
  "ko": {
    "complete": "완료",
    "overdue": "기한 지남",
    "days_left": "{count}일 남음",
    "verses_of_total": "{total}절 중 {read}절",
    "pace": "필요: 하루 {required}절 · 평균: 하루 {average}절",
    "next_up": "다음 읽을 곳",
    "open_bible": "성경 열기",
    "log_reading": "기록 추가"
  },
  "pt": {
    "complete": "Concluída",
    "overdue": "Atrasada",
    "days_left": "Falta {count} dia | Faltam {count} dias",
    "verses_of_total": "{read} de {total} versículos",
    "pace": "Necessário: {required}/dia · Média: {average}/dia",
    "next_up": "A seguir",
    "open_bible": "Ler na Biblia",
    "log_reading": "Adicionar leitura a registro"
  },
  "uk": {
    "complete": "Виконано",
    "overdue": "Прострочено",
    "days_left": "Залишився {count} день | Залишилося {count} дні | Залишилося {count} днів",
    "verses_of_total": "{read} з {total} віршів",
    "pace": "Потрібно: {required}/день · В середньому: {average}/день",
    "next_up": "Далі",
    "open_bible": "Читати в Біблії",
    "log_reading": "Додати читання до журналу"
  }
}
</i18n>
