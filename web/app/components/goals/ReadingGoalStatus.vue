<template>
  <span class="goal-status" :class="`goal-status--${tone}`" data-testid="reading-goal-status" :data-status="status">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import type { ReadingGoal, ReadingGoalProgress } from '@mybiblelog/shared';

const props = defineProps<{
  goal: Pick<ReadingGoal, 'startDate' | 'active'>;
  progress: Pick<ReadingGoalProgress, 'status' | 'scheduleDays'>;
}>();

const { t } = useI18n();
const formatDate = useLocalizedDate();

// An archived goal that isn't finished reads as archived everywhere: its
// schedule keeps running, but the reader has set it aside.
const status = computed(() => (!props.goal.active && props.progress.status !== 'complete' ? 'archived' : props.progress.status));

const tone = computed(() => ({
  complete: 'success',
  ahead: 'success',
  on_track: 'info',
  behind: 'warning',
  overdue: 'warning',
  upcoming: 'neutral',
  archived: 'neutral',
})[status.value]);

const label = computed(() => {
  const days = Math.abs(props.progress.scheduleDays);
  switch (status.value) {
  case 'ahead': return t('ahead', { count: days }, days);
  case 'behind': return t('behind', { count: days }, days);
  case 'upcoming': return t('upcoming', { date: formatDate(props.goal.startDate, 'MMM D') });
  default: return t(status.value);
  }
});
</script>

<style scoped>
.goal-status {
  display: inline-flex;
  align-items: center;
  padding: var(--mbl-space-3xs) var(--mbl-space-xs);
  border: 1px solid var(--mbl-border);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-bg-muted);
  color: var(--mbl-text-body);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.goal-status--info {
  border-color: var(--mbl-message-info-border);
  background: var(--mbl-message-info-bg);
  color: var(--mbl-message-info-fg);
}

.goal-status--success {
  border-color: var(--mbl-message-success-border);
  background: var(--mbl-message-success-bg);
  color: var(--mbl-message-success-fg);
}

.goal-status--warning {
  border-color: var(--mbl-message-warning-border);
  background: var(--mbl-message-warning-bg);
  color: var(--mbl-message-warning-fg);
}
</style>

<i18n lang="json">
{
  "en": {
    "complete": "Complete",
    "on_track": "On track",
    "overdue": "Past goal date",
    "archived": "Archived",
    "ahead": "{count} day ahead | {count} days ahead",
    "behind": "{count} day behind | {count} days behind",
    "upcoming": "Starts {date}"
  },
  "de": {
    "complete": "Abgeschlossen",
    "on_track": "Im Plan",
    "overdue": "Zieldatum überschritten",
    "archived": "Archiviert",
    "ahead": "{count} Tag voraus | {count} Tage voraus",
    "behind": "{count} Tag im Rückstand | {count} Tage im Rückstand",
    "upcoming": "Beginnt am {date}"
  },
  "es": {
    "complete": "Completada",
    "on_track": "Al día",
    "overdue": "Fecha objetivo pasada",
    "archived": "Archivada",
    "ahead": "{count} día de adelanto | {count} días de adelanto",
    "behind": "{count} día de atraso | {count} días de atraso",
    "upcoming": "Empieza el {date}"
  },
  "fr": {
    "complete": "Terminé",
    "on_track": "Dans les temps",
    "overdue": "Date cible dépassée",
    "archived": "Archivé",
    "ahead": "{count} jour d'avance | {count} jours d'avance",
    "behind": "{count} jour de retard | {count} jours de retard",
    "upcoming": "Commence le {date}"
  },
  "ko": {
    "complete": "완료",
    "on_track": "순조로움",
    "overdue": "목표일 지남",
    "archived": "보관됨",
    "ahead": "{count}일 앞섬",
    "behind": "{count}일 뒤처짐",
    "upcoming": "{date} 시작"
  },
  "pt": {
    "complete": "Concluída",
    "on_track": "Em dia",
    "overdue": "Data da meta ultrapassada",
    "archived": "Arquivada",
    "ahead": "{count} dia de adiantamento | {count} dias de adiantamento",
    "behind": "{count} dia de atraso | {count} dias de atraso",
    "upcoming": "Começa em {date}"
  },
  "uk": {
    "complete": "Виконано",
    "on_track": "За графіком",
    "overdue": "Цільова дата минула",
    "archived": "В архіві",
    "ahead": "На {count} день попереду | На {count} дні попереду | На {count} днів попереду",
    "behind": "Відставання на {count} день | Відставання на {count} дні | Відставання на {count} днів",
    "upcoming": "Початок {date}"
  }
}
</i18n>
