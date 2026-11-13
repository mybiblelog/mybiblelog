<template>
  <main class="content-column">
    <skeleton-loader v-if="!readingGoalsStore.isLoaded" :count="3" />
    <div v-else-if="!goal" class="mbl-empty-state" data-testid="reading-goal-not-found">
      <p>{{ t('not_found') }}</p>
      <NuxtLink class="mbl-button" :to="localePath('goals')">
        {{ t('all_goals') }}
      </NuxtLink>
    </div>
    <template v-else-if="progress">
      <NuxtLink class="goal-detail__back" :to="localePath('goals')">
        <caret-left-icon fill="currentColor" /> {{ t('goals') }}
      </NuxtLink>
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3" data-testid="reading-goal-detail-title">
          {{ goal.title }}
        </h1>
        <div class="goal-detail__actions">
          <NuxtLink class="mbl-button" :to="localePath({ name: 'goals-id-edit', params: { id: goal.id } })" data-testid="reading-goal-detail-edit">
            {{ t('edit') }}
          </NuxtLink>
          <reading-goal-menu :goal="goal" @deleted="navigateTo(localePath('goals'), { replace: true })" />
        </div>
      </header>

      <section class="mbl-box goal-detail__hero" :data-status="progress.status">
        <reading-goal-ring :percent="progress.percent" :complete="progress.isComplete" :size="104" />
        <div class="goal-detail__hero-text">
          <reading-goal-status :goal="goal" :progress="progress" />
          <p class="goal-detail__headline" :data-testid="progress.isComplete ? 'reading-goal-detail-complete' : 'reading-goal-detail-headline'">
            {{ headline }}
          </p>
          <p class="goal-detail__dates">
            {{ formatDate(goal.startDate) }} – {{ formatDate(goal.endDate) }}
            <template v-if="['on_track', 'ahead', 'behind'].includes(progress.status)">
              · <span data-testid="reading-goal-detail-plan-days">{{ t('day_of_plan', { day: currentDay, total: planDays }) }}</span>
            </template>
          </p>
        </div>
      </section>

      <div v-if="!goal.active && !progress.isComplete" class="mbl-message goal-detail__notice" data-testid="reading-goal-detail-archived">
        <div class="mbl-message__body">
          <p>{{ t('archived_note') }}</p>
          <div class="mbl-button-group">
            <button type="button" class="mbl-button" @click="restore">
              {{ t('restore') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="booksOutsideCanon" class="mbl-message mbl-message--info goal-detail__notice" data-testid="reading-goal-detail-outside-canon">
        <div class="mbl-message__body">
          {{ t('outside_canon', { books: booksOutsideCanon }) }}
          <NuxtLink :to="localePath('settings-reading')" data-testid="reading-goal-detail-reading-settings">
            {{ t('reading_settings') }}
          </NuxtLink>
        </div>
      </div>

      <reading-goal-next-up
        v-if="progress.nextUp && goal.active && progress.status !== 'upcoming'"
        class="goal-detail__next-up"
        data-testid="reading-goal-detail-next-up"
        :passage="progress.nextUp"
      />

      <dl class="goal-detail__stats">
        <div class="mbl-box goal-detail__stat">
          <dt>{{ t('verses_read') }}</dt>
          <dd>
            {{ $n(progress.versesRead, 'grouped') }}
            <small>/ {{ $n(progress.totalVerses, 'grouped') }}</small>
          </dd>
          <dd class="goal-detail__stat-note">
            {{ t('verses_left', { count: $n(progress.versesRemaining, 'grouped') }) }}
          </dd>
        </div>
        <div class="mbl-box goal-detail__stat">
          <dt>{{ progress.isComplete ? t('days_taken') : t('days_left') }}</dt>
          <dd>{{ $n(progress.isComplete ? daysTaken : progress.daysLeft, 'grouped') }}</dd>
          <dd class="goal-detail__stat-note">
            {{ t('plan_days', { count: $n(planDays, 'grouped') }, planDays) }}
          </dd>
        </div>
        <div class="mbl-box goal-detail__stat">
          <dt>{{ t('your_pace') }}</dt>
          <dd>
            <span data-testid="reading-goal-detail-average">{{ $n(roundTenth(progress.averagePerDay)) }}</span>
            <small>{{ t('per_day') }}</small>
          </dd>
          <dd class="goal-detail__stat-note">
            {{ t('plan_pace', { count: $n(roundTenth(progress.requiredPerDay)) }) }}
          </dd>
        </div>
        <div class="mbl-box goal-detail__stat">
          <dt>{{ progress.isComplete ? t('finished') : t('projected_finish') }}</dt>
          <dd class="goal-detail__stat-date" data-testid="reading-goal-detail-projected-finish">
            {{ progress.projectedFinishDate ? formatDate(progress.projectedFinishDate) : '—' }}
          </dd>
          <dd
            class="goal-detail__stat-note"
            :class="{ 'goal-detail__stat-note--late': finishOffset > 0 }"
            data-testid="reading-goal-detail-finish-days"
          >
            {{ finishNote }}
          </dd>
        </div>
      </dl>

      <section class="mbl-box goal-detail__section">
        <h2 class="mbl-title mbl-title--5">
          {{ t('progress') }}
        </h2>
        <reading-goal-chart
          :series="series"
          :total-verses="progress.totalVerses"
          :end-date="goal.endDate"
          :average-per-day="progress.averagePerDay"
          :complete="progress.isComplete"
        />
      </section>

      <section class="mbl-box goal-detail__section">
        <h2 class="mbl-title mbl-title--5">
          {{ t('books') }}
          <small class="goal-detail__books-count">{{ booksDone }} / {{ progress.perPassage.length }}</small>
        </h2>
        <ol class="goal-detail__books" data-testid="reading-goal-detail-books">
          <li
            v-for="item in progress.perPassage"
            :key="item.passage.startVerseId"
            class="goal-detail__book"
            :class="{ 'goal-detail__book--done': item.versesRead >= item.totalVerses }"
          >
            <div class="goal-detail__book-label">
              <span>
                <checkmark-icon v-if="item.versesRead >= item.totalVerses" width="14px" height="14px" stroke="var(--mbl-success)" />
                {{ passageLabel(item.passage) }}
              </span>
              <span class="goal-detail__book-count">
                {{ $n(item.versesRead, 'grouped') }} / {{ $n(item.totalVerses, 'grouped') }}
              </span>
            </div>
            <completion-bar
              :percentage="item.versesRead / item.totalVerses * 100"
              background-color="var(--mbl-border)"
              :foreground-color="item.versesRead >= item.totalVerses ? 'var(--mbl-success)' : 'var(--mbl-link-bright)'"
            />
          </li>
        </ol>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import {
  Bible,
  computeGoalChartSeries,
  inclusiveDays,
  isWholeBookPassage,
  passageBookIndex,
  type GoalPassage,
} from '@mybiblelog/shared';
import ReadingGoalChart from '~/components/goals/ReadingGoalChart.vue';
import ReadingGoalMenu from '~/components/goals/ReadingGoalMenu.vue';
import ReadingGoalNextUp from '~/components/goals/ReadingGoalNextUp.vue';
import ReadingGoalRing from '~/components/goals/ReadingGoalRing.vue';
import ReadingGoalStatus from '~/components/goals/ReadingGoalStatus.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useGoalBooksOutsideCanon } from '~/composables/useGoalBooksOutsideCanon';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useReadingGoalsStore } from '~/stores/reading-goals';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });

const { t, n, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const formatDate = useLocalizedDate();
const readingGoalsStore = useReadingGoalsStore();
const logEntriesStore = useLogEntriesStore();

const today = dayjs().format('YYYY-MM-DD');

const goal = computed(() => readingGoalsStore.getGoal(String(route.params.id)));
const progress = computed(() => (goal.value ? readingGoalsStore.getProgress(goal.value) : null));
const booksOutsideCanon = useGoalBooksOutsideCanon(progress);
const series = computed(() => (goal.value ? computeGoalChartSeries(goal.value, logEntriesStore.logEntries, today) : []));

useHead({
  title: () => goal.value?.title ?? t('goal'),
  meta: [{ name: 'robots', content: 'noindex' }],
});

const roundTenth = (value: number) => Math.round(value * 10) / 10;

const passageLabel = (passage: GoalPassage) => (isWholeBookPassage(passage)
  ? Bible.getBookName(passageBookIndex(passage), locale.value)
  : Bible.displayVerseRange(passage.startVerseId, passage.endVerseId, locale.value));

const planDays = computed(() => (goal.value ? inclusiveDays(goal.value.startDate, goal.value.endDate) : 0));
const currentDay = computed(() => (goal.value ? inclusiveDays(goal.value.startDate, today) : 0));
const daysTaken = computed(() => (goal.value && progress.value?.completedDate
  ? inclusiveDays(goal.value.startDate, progress.value.completedDate)
  : 0));
const booksDone = computed(() => progress.value?.perPassage.filter(p => p.versesRead >= p.totalVerses).length ?? 0);

/** The one thing to know right now, in a sentence. */
const headline = computed(() => {
  const p = progress.value;
  if (!p) { return ''; }
  switch (p.status) {
  case 'complete': return t('completed_on', { date: formatDate(p.completedDate!, 'LL') });
  case 'upcoming': return t('headline.upcoming', { count: n(Math.ceil(p.requiredPerDay), 'grouped') });
  case 'overdue': return t('headline.overdue', { count: n(p.versesRemaining, 'grouped') });
  default: {
    const left = p.todayTarget - p.versesReadToday;
    return left > 0 ? t('headline.today', { count: n(left, 'grouped') }) : t('headline.today_done');
  }
  }
});

/** Days the projected (or actual) finish lands after the goal date; negative is early. */
const finishOffset = computed(() => {
  const finish = progress.value?.projectedFinishDate;
  if (!goal.value || !finish) { return 0; }
  return finish >= goal.value.endDate
    ? inclusiveDays(goal.value.endDate, finish) - 1
    : -(inclusiveDays(finish, goal.value.endDate) - 1);
});

const finishNote = computed(() => {
  if (!progress.value?.projectedFinishDate) { return t('not_enough_reading'); }
  const days = Math.abs(finishOffset.value);
  if (days === 0) { return t('finish_on_time'); }
  return t(finishOffset.value > 0 ? 'finish_late' : 'finish_early', { count: n(days, 'grouped') }, days);
});

const restore = async () => {
  try {
    await readingGoalsStore.setGoalActive(goal.value!, true);
  }
  catch {
    useToastStore().add({ type: 'error', text: t('save_error') });
  }
};

onMounted(() => useAppInitStore().loadUserData());
</script>

<style scoped>
.goal-detail__back {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-2xs);
  margin-bottom: var(--mbl-space-xs);
  color: var(--mbl-text-muted);
  font-size: 0.9rem;
  text-decoration: none;
}

.goal-detail__back:hover {
  color: var(--mbl-text-strong);
}

.goal-detail__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--mbl-space-2xs);
}

.goal-detail__hero {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-lg);
  margin-bottom: var(--mbl-space-md);
}

.goal-detail__hero-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mbl-space-2xs);
  min-width: 0;
}

.goal-detail__headline {
  margin: var(--mbl-space-2xs) 0 0;
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-4);
  font-weight: 700;
  line-height: 1.25;
}

.goal-detail__dates {
  margin: 0;
  color: var(--mbl-text-muted);
  font-size: 0.9rem;
}

.goal-detail__notice {
  margin-bottom: var(--mbl-space-md);
}

.goal-detail__next-up {
  margin-bottom: var(--mbl-space-md);
  background: var(--mbl-bg);
  box-shadow: var(--mbl-shadow-card);
}

.goal-detail__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--mbl-space-sm);
  margin: 0 0 var(--mbl-space-md);
}

.goal-detail__stat {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-3xs);
  padding: var(--mbl-space-sm) var(--mbl-space-md);
}

.goal-detail__stat dt {
  color: var(--mbl-text-muted);
  font-size: 0.8rem;
}

.goal-detail__stat dd {
  margin: 0;
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-4);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.goal-detail__stat dd small {
  margin-left: var(--mbl-space-3xs);
  color: var(--mbl-text-muted);
  font-size: 0.8rem;
  font-weight: 400;
}

.goal-detail__stat dd.goal-detail__stat-date {
  font-size: var(--mbl-title-5);
}

.goal-detail__stat dd.goal-detail__stat-note {
  color: var(--mbl-text-muted);
  font-size: 0.8rem;
  font-weight: 400;
}

.goal-detail__stat dd.goal-detail__stat-note--late {
  color: var(--mbl-message-warning-fg);
}

.goal-detail__section {
  margin-bottom: var(--mbl-space-md);
}

.goal-detail__section .mbl-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 var(--mbl-space-sm);
}

.goal-detail__books-count {
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.goal-detail__books {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mbl-space-sm) var(--mbl-space-xl);
  margin: 0;
  padding: 0;
  list-style: none;
}

.goal-detail__book-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mbl-space-xs);
  margin-bottom: var(--mbl-space-2xs);
  color: var(--mbl-text-strong);
  font-size: 0.9rem;
}

.goal-detail__book--done .goal-detail__book-label {
  color: var(--mbl-text-muted);
}

.goal-detail__book-count {
  color: var(--mbl-text-muted);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.goal-detail__book :deep(.completion-bar--container) {
  border-radius: var(--mbl-radius-pill);
}

@mixin mbl-mobile {
  .goal-detail__hero {
    gap: var(--mbl-space-md);
  }

  .goal-detail__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .goal-detail__books {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "goals": "Goals",
    "goal": "Goal",
    "not_found": "This goal could not be found.",
    "all_goals": "All goals",
    "edit": "Edit",
    "day_of_plan": "Day {day} of {total}",
    "completed_on": "Goal complete! You finished on {date}.",
    "headline": {
      "today": "{count} verses to read today",
      "today_done": "Today's reading is done",
      "overdue": "{count} verses left to read",
      "upcoming": "{count} verses a day once it starts"
    },
    "archived_note": "This goal is archived, so it doesn't show on Today.",
    "restore": "Restore",
    "save_error": "The goal could not be saved. Please try again.",
    "outside_canon": "This goal includes {books}, but deuterocanonical books are turned off in your reading settings, so you can't log them. Turn them back on, or edit the goal to remove those books.",
    "reading_settings": "Reading settings",
    "verses_read": "Verses read",
    "verses_left": "{count} left",
    "days_left": "Days left",
    "days_taken": "Days taken",
    "plan_days": "of a {count}-day plan | of a {count}-day plan",
    "your_pace": "Your pace",
    "per_day": "/ day",
    "plan_pace": "Plan: {count} / day",
    "finished": "Finished",
    "projected_finish": "Projected finish",
    "not_enough_reading": "Not enough reading yet",
    "finish_on_time": "On your goal date",
    "finish_early": "{count} day early | {count} days early",
    "finish_late": "{count} day late | {count} days late",
    "progress": "Progress",
    "books": "Books"
  },
  "de": {
    "goals": "Ziele",
    "goal": "Ziel",
    "not_found": "Dieses Ziel wurde nicht gefunden.",
    "all_goals": "Alle Ziele",
    "edit": "Bearbeiten",
    "day_of_plan": "Tag {day} von {total}",
    "completed_on": "Ziel erreicht! Sie waren am {date} fertig.",
    "headline": {
      "today": "Heute noch {count} Verse zu lesen",
      "today_done": "Die heutige Lesung ist geschafft",
      "overdue": "Noch {count} Verse zu lesen",
      "upcoming": "{count} Verse pro Tag, sobald es losgeht"
    },
    "archived_note": "Dieses Ziel ist archiviert und erscheint daher nicht unter Heute.",
    "restore": "Wiederherstellen",
    "save_error": "Das Ziel konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    "outside_canon": "Dieses Ziel enthält {books}, aber deuterokanonische Bücher sind in Ihren Leseeinstellungen ausgeschaltet, daher können Sie sie nicht erfassen. Schalten Sie sie wieder ein oder bearbeiten Sie das Ziel, um diese Bücher zu entfernen.",
    "reading_settings": "Leseeinstellungen",
    "verses_read": "Gelesene Verse",
    "verses_left": "Noch {count}",
    "days_left": "Verbleibende Tage",
    "days_taken": "Benötigte Tage",
    "plan_days": "eines {count}-Tage-Plans | eines {count}-Tage-Plans",
    "your_pace": "Ihr Tempo",
    "per_day": "/ Tag",
    "plan_pace": "Plan: {count} / Tag",
    "finished": "Abgeschlossen am",
    "projected_finish": "Voraussichtliches Ende",
    "not_enough_reading": "Noch nicht genug gelesen",
    "finish_on_time": "Am Zieldatum",
    "finish_early": "{count} Tag früher | {count} Tage früher",
    "finish_late": "{count} Tag später | {count} Tage später",
    "progress": "Fortschritt",
    "books": "Bücher"
  },
  "es": {
    "goals": "Metas",
    "goal": "Meta",
    "not_found": "No se encontró esta meta.",
    "all_goals": "Todas las metas",
    "edit": "Editar",
    "day_of_plan": "Día {day} de {total}",
    "completed_on": "¡Meta cumplida! Terminaste el {date}.",
    "headline": {
      "today": "{count} versículos por leer hoy",
      "today_done": "La lectura de hoy está hecha",
      "overdue": "Quedan {count} versículos por leer",
      "upcoming": "{count} versículos al día cuando empiece"
    },
    "archived_note": "Esta meta está archivada, así que no aparece en Hoy.",
    "restore": "Restaurar",
    "save_error": "No se pudo guardar la meta. Inténtalo de nuevo.",
    "outside_canon": "Esta meta incluye {books}, pero los libros deuterocanónicos están desactivados en tu configuración de lectura, así que no puedes registrarlos. Vuelve a activarlos o edita la meta para quitar esos libros.",
    "reading_settings": "Configuración de lectura",
    "verses_read": "Versículos leídos",
    "verses_left": "Quedan {count}",
    "days_left": "Días restantes",
    "days_taken": "Días empleados",
    "plan_days": "de un plan de {count} día | de un plan de {count} días",
    "your_pace": "Tu ritmo",
    "per_day": "/ día",
    "plan_pace": "Plan: {count} / día",
    "finished": "Terminada",
    "projected_finish": "Fin estimado",
    "not_enough_reading": "Aún no hay suficiente lectura",
    "finish_on_time": "En tu fecha objetivo",
    "finish_early": "{count} día antes | {count} días antes",
    "finish_late": "{count} día después | {count} días después",
    "progress": "Progreso",
    "books": "Libros"
  },
  "fr": {
    "goals": "Objectifs",
    "goal": "Objectif",
    "not_found": "Cet objectif est introuvable.",
    "all_goals": "Tous les objectifs",
    "edit": "Modifier",
    "day_of_plan": "Jour {day} sur {total}",
    "completed_on": "Objectif atteint ! Vous avez terminé le {date}.",
    "headline": {
      "today": "{count} versets à lire aujourd'hui",
      "today_done": "La lecture du jour est faite",
      "overdue": "{count} versets restant à lire",
      "upcoming": "{count} versets par jour dès le début"
    },
    "archived_note": "Cet objectif est archivé et n'apparaît donc pas dans Aujourd'hui.",
    "restore": "Restaurer",
    "save_error": "L'objectif n'a pas pu être enregistré. Veuillez réessayer.",
    "outside_canon": "Cet objectif comprend {books}, mais les livres deutérocanoniques sont désactivés dans vos paramètres de lecture : vous ne pouvez donc pas les enregistrer. Réactivez-les ou modifiez l'objectif pour retirer ces livres.",
    "reading_settings": "Paramètres de lecture",
    "verses_read": "Versets lus",
    "verses_left": "{count} restants",
    "days_left": "Jours restants",
    "days_taken": "Jours passés",
    "plan_days": "d'un plan de {count} jour | d'un plan de {count} jours",
    "your_pace": "Votre rythme",
    "per_day": "/ jour",
    "plan_pace": "Plan : {count} / jour",
    "finished": "Terminé le",
    "projected_finish": "Fin prévue",
    "not_enough_reading": "Pas encore assez de lecture",
    "finish_on_time": "À la date cible",
    "finish_early": "{count} jour d'avance | {count} jours d'avance",
    "finish_late": "{count} jour de retard | {count} jours de retard",
    "progress": "Progression",
    "books": "Livres"
  },
  "ko": {
    "goals": "목표",
    "goal": "목표",
    "not_found": "이 목표를 찾을 수 없습니다.",
    "all_goals": "모든 목표",
    "edit": "편집",
    "day_of_plan": "{total}일 중 {day}일차",
    "completed_on": "목표 달성! {date}에 완료했습니다.",
    "headline": {
      "today": "오늘 읽을 분량 {count}절",
      "today_done": "오늘 읽기를 마쳤습니다",
      "overdue": "남은 분량 {count}절",
      "upcoming": "시작하면 하루 {count}절"
    },
    "archived_note": "이 목표는 보관되어 오늘 페이지에 표시되지 않습니다.",
    "restore": "복원",
    "save_error": "목표를 저장하지 못했습니다. 다시 시도해 주세요.",
    "outside_canon": "이 목표에는 {books}이(가) 포함되어 있지만 읽기 설정에서 제2경전이 꺼져 있어 기록할 수 없습니다. 다시 켜거나 목표를 편집하여 해당 책을 제거하세요.",
    "reading_settings": "읽기 설정",
    "verses_read": "읽은 구절",
    "verses_left": "{count}절 남음",
    "days_left": "남은 일수",
    "days_taken": "걸린 일수",
    "plan_days": "{count}일 계획 중",
    "your_pace": "내 속도",
    "per_day": "절/일",
    "plan_pace": "계획: 하루 {count}절",
    "finished": "완료일",
    "projected_finish": "예상 완료일",
    "not_enough_reading": "아직 읽은 내용이 부족합니다",
    "finish_on_time": "목표일에 완료",
    "finish_early": "{count}일 일찍",
    "finish_late": "{count}일 늦게",
    "progress": "진행 상황",
    "books": "책"
  },
  "pt": {
    "goals": "Metas",
    "goal": "Meta",
    "not_found": "Esta meta não foi encontrada.",
    "all_goals": "Todas as metas",
    "edit": "Editar",
    "day_of_plan": "Dia {day} de {total}",
    "completed_on": "Meta concluída! Você terminou em {date}.",
    "headline": {
      "today": "{count} versículos para ler hoje",
      "today_done": "A leitura de hoje está feita",
      "overdue": "Faltam {count} versículos para ler",
      "upcoming": "{count} versículos por dia quando começar"
    },
    "archived_note": "Esta meta está arquivada, por isso não aparece em Hoje.",
    "restore": "Restaurar",
    "save_error": "Não foi possível salvar a meta. Tente novamente.",
    "outside_canon": "Esta meta inclui {books}, mas os livros deuterocanônicos estão desativados nas suas configurações de leitura, então você não pode registrá-los. Ative-os novamente ou edite a meta para remover esses livros.",
    "reading_settings": "Configurações de leitura",
    "verses_read": "Versículos lidos",
    "verses_left": "Faltam {count}",
    "days_left": "Dias restantes",
    "days_taken": "Dias levados",
    "plan_days": "de um plano de {count} dia | de um plano de {count} dias",
    "your_pace": "Seu ritmo",
    "per_day": "/ dia",
    "plan_pace": "Plano: {count} / dia",
    "finished": "Concluída em",
    "projected_finish": "Término previsto",
    "not_enough_reading": "Ainda não há leitura suficiente",
    "finish_on_time": "Na data da meta",
    "finish_early": "{count} dia antes | {count} dias antes",
    "finish_late": "{count} dia depois | {count} dias depois",
    "progress": "Progresso",
    "books": "Livros"
  },
  "uk": {
    "goals": "Цілі",
    "goal": "Мета",
    "not_found": "Цю мету не знайдено.",
    "all_goals": "Усі цілі",
    "edit": "Редагувати",
    "day_of_plan": "День {day} з {total}",
    "completed_on": "Мету досягнуто! Ви завершили {date}.",
    "headline": {
      "today": "Сьогодні залишилося прочитати віршів: {count}",
      "today_done": "Сьогоднішнє читання виконано",
      "overdue": "Залишилося прочитати віршів: {count}",
      "upcoming": "Віршів на день після початку: {count}"
    },
    "archived_note": "Ця мета в архіві, тому не показується на сторінці «Сьогодні».",
    "restore": "Відновити",
    "save_error": "Не вдалося зберегти мету. Спробуйте ще раз.",
    "outside_canon": "Ця ціль містить {books}, але девтероканонічні книги вимкнено в налаштуваннях читання, тому їх не можна записати. Увімкніть їх знову або відредагуйте ціль, щоб прибрати ці книги.",
    "reading_settings": "Налаштування читання",
    "verses_read": "Прочитані вірші",
    "verses_left": "Залишилося: {count}",
    "days_left": "Залишилося днів",
    "days_taken": "Витрачено днів",
    "plan_days": "з плану на {count} день | з плану на {count} дні | з плану на {count} днів",
    "your_pace": "Ваш темп",
    "per_day": "/ день",
    "plan_pace": "План: {count} / день",
    "finished": "Завершено",
    "projected_finish": "Прогнозоване завершення",
    "not_enough_reading": "Поки недостатньо прочитаного",
    "finish_on_time": "У цільову дату",
    "finish_early": "На {count} день раніше | На {count} дні раніше | На {count} днів раніше",
    "finish_late": "На {count} день пізніше | На {count} дні пізніше | На {count} днів пізніше",
    "progress": "Прогрес",
    "books": "Книги"
  }
}
</i18n>
