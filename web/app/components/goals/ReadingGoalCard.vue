<template>
  <article
    class="mbl-card reading-goal-card"
    data-testid="reading-goal-card"
    :data-goal-id="goal.id"
    :data-complete="progress.isComplete"
  >
    <div class="reading-goal-card__header">
      <NuxtLink class="reading-goal-card__link" :to="localePath({ name: 'goals-id', params: { id: goal.id } })">
        <reading-goal-ring :percent="progress.percent" :complete="progress.isComplete" :size="52" />
        <span class="reading-goal-card__heading">
          <span class="reading-goal-card__title" data-testid="reading-goal-card-title">{{ goal.title }}</span>
          <span class="reading-goal-card__meta">
            <span data-testid="reading-goal-card-verses">
              {{ t('verses_of_total', { read: $n(progress.versesRead, 'grouped'), total: $n(progress.totalVerses, 'grouped') }) }}
            </span>
            <template v-if="progress.isComplete">
              · {{ t('finished', { date: formatDate(progress.completedDate!) }) }}
            </template>
            <template v-else-if="progress.status !== 'overdue' && progress.status !== 'upcoming'">
              · {{ t('days_left', { count: progress.daysLeft }, progress.daysLeft) }}
            </template>
          </span>
        </span>
      </NuxtLink>
      <reading-goal-status class="reading-goal-card__status" :goal="goal" :progress="progress" />
      <reading-goal-menu v-if="manageable" class="reading-goal-card__menu" :goal="goal" />
    </div>

    <div v-if="showToday" class="reading-goal-card__today" data-testid="reading-goal-card-today">
      <div class="reading-goal-card__today-label">
        <span>{{ t('today') }}</span>
        <span :class="{ 'reading-goal-card__today-done': todayDone }">
          <checkmark-icon v-if="todayDone" width="14px" height="14px" stroke="currentColor" />
          {{ t('today_progress', { read: $n(progress.versesReadToday, 'grouped'), target: $n(progress.todayTarget, 'grouped') }) }}
        </span>
      </div>
      <completion-bar
        :percentage="todayPercent"
        background-color="var(--mbl-border)"
        :foreground-color="todayDone ? 'var(--mbl-success)' : 'var(--mbl-link-bright)'"
      />
    </div>

    <reading-goal-next-up
      v-if="progress.nextUp && goal.active && progress.status !== 'upcoming'"
      data-testid="reading-goal-card-next-up"
      :passage="progress.nextUp"
    />
    <reading-goal-outside-canon-note :progress="progress" data-testid="reading-goal-card-outside-canon" />
  </article>
</template>

<script setup lang="ts">
import type { ReadingGoal, ReadingGoalProgress } from '@mybiblelog/shared';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';
import ReadingGoalMenu from '~/components/goals/ReadingGoalMenu.vue';
import ReadingGoalNextUp from '~/components/goals/ReadingGoalNextUp.vue';
import ReadingGoalOutsideCanonNote from '~/components/goals/ReadingGoalOutsideCanonNote.vue';
import ReadingGoalRing from '~/components/goals/ReadingGoalRing.vue';
import ReadingGoalStatus from '~/components/goals/ReadingGoalStatus.vue';

const props = defineProps<{
  goal: ReadingGoal;
  progress: ReadingGoalProgress;
  /** Adds the edit / archive / delete menu (the goals page; Today keeps cards to reading). */
  manageable?: boolean;
}>();

const { t } = useI18n();
const localePath = useLocalePath();
const formatDate = useLocalizedDate();

// An overdue goal's "target" is everything left, which isn't a day's reading.
const showToday = computed(() =>
  props.goal.active && ['on_track', 'ahead', 'behind'].includes(props.progress.status));
const todayDone = computed(() => props.progress.versesReadToday >= props.progress.todayTarget);
const todayPercent = computed(() =>
  Math.min(100, (props.progress.versesReadToday / Math.max(1, props.progress.todayTarget)) * 100));
</script>

<style scoped>
.reading-goal-card {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-sm);
  padding: var(--mbl-space-md);
  transition: box-shadow 0.15s ease;
}

.reading-goal-card:has(.reading-goal-card__link:hover) {
  box-shadow: var(--mbl-shadow-card-hover);
}

.reading-goal-card__header {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.reading-goal-card__link {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--mbl-space-sm);
  min-width: 0;
  color: var(--mbl-text-body);
  text-decoration: none;
}

.reading-goal-card__heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.reading-goal-card__title {
  overflow: hidden;
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-5);
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reading-goal-card__meta {
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
}

.reading-goal-card__today-label {
  display: flex;
  justify-content: space-between;
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-2xs);
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
}

.reading-goal-card__today-label > :last-child {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-2xs);
  color: var(--mbl-text-strong);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.reading-goal-card__today-label > .reading-goal-card__today-done {
  color: var(--mbl-message-success-icon);
}

.reading-goal-card__today :deep(.completion-bar--container) {
  height: 6px;
  border-radius: var(--mbl-radius-pill);
}

@mixin mbl-mobile {
  /* The pill drops to its own line under the title so a long goal name keeps its room. */
  .reading-goal-card__header {
    flex-wrap: wrap;
    row-gap: var(--mbl-space-2xs);
  }

  .reading-goal-card__header::after {
    flex-basis: 100%;
    order: 2;
    content: '';
  }

  .reading-goal-card__menu {
    order: 1;
  }

  .reading-goal-card__status {
    order: 3;
    margin-left: calc(52px + var(--mbl-space-sm));
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "verses_of_total": "{read} of {total} verses",
    "finished": "Finished {date}",
    "days_left": "{count} day left | {count} days left",
    "today": "Today",
    "today_progress": "{read} / {target} verses"
  },
  "de": {
    "verses_of_total": "{read} von {total} Versen",
    "finished": "Abgeschlossen am {date}",
    "days_left": "Noch {count} Tag | Noch {count} Tage",
    "today": "Heute",
    "today_progress": "{read} / {target} Verse"
  },
  "es": {
    "verses_of_total": "{read} de {total} versículos",
    "finished": "Terminada el {date}",
    "days_left": "Queda {count} día | Quedan {count} días",
    "today": "Hoy",
    "today_progress": "{read} / {target} versículos"
  },
  "fr": {
    "verses_of_total": "{read} versets sur {total}",
    "finished": "Terminé le {date}",
    "days_left": "{count} jour restant | {count} jours restants",
    "today": "Aujourd'hui",
    "today_progress": "{read} / {target} versets"
  },
  "ko": {
    "verses_of_total": "{total}절 중 {read}절",
    "finished": "{date} 완료",
    "days_left": "{count}일 남음",
    "today": "오늘",
    "today_progress": "{read} / {target}절"
  },
  "pt": {
    "verses_of_total": "{read} de {total} versículos",
    "finished": "Concluída em {date}",
    "days_left": "Falta {count} dia | Faltam {count} dias",
    "today": "Hoje",
    "today_progress": "{read} / {target} versículos"
  },
  "uk": {
    "verses_of_total": "{read} з {total} віршів",
    "finished": "Завершено {date}",
    "days_left": "Залишився {count} день | Залишилося {count} дні | Залишилося {count} днів",
    "today": "Сьогодні",
    "today_progress": "{read} / {target} віршів"
  }
}
</i18n>
