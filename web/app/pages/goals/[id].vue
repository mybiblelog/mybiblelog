<template>
  <main>
    <div class="content-column">
      <skeleton-loader v-if="!readingGoalsStore.isLoaded" />
      <div v-else-if="!goal" class="mbl-empty-state" data-testid="reading-goal-not-found">
        <p>{{ t('not_found') }}</p>
        <NuxtLink class="mbl-button" :to="localePath('/settings/goals')">
          {{ t('all_goals') }}
        </NuxtLink>
      </div>
      <template v-else-if="progress">
        <header class="page-header">
          <h1 class="mbl-title mbl-title--3" data-testid="reading-goal-detail-title">
            {{ goal.title }}
          </h1>
          <NuxtLink class="mbl-button" :to="localePath({ path: '/settings/goals', query: { edit: goal.id } })" data-testid="reading-goal-detail-edit">
            {{ t('edit') }}
          </NuxtLink>
        </header>
        <p class="mbl-text-muted">
          {{ displayDate(goal.startDate, locale) }} – {{ displayDate(goal.endDate, locale) }}
          <span v-if="!goal.active">· {{ t('inactive') }}</span>
        </p>

        <div v-if="progress.isComplete" class="mbl-message mbl-message--success" data-testid="reading-goal-detail-complete">
          <div class="mbl-message__body">
            {{ t('completed_on', { date: displayDate(progress.completedDate!, locale) }) }}
          </div>
        </div>

        <div class="mbl-box goal-detail__chart">
          <reading-goal-chart
            :series="series"
            :total-verses="progress.totalVerses"
            :required-per-day="progress.requiredPerDay"
            :average-per-day="progress.averagePerDay"
          />
        </div>

        <dl class="goal-detail__stats">
          <div>
            <dt>{{ progress.isComplete ? t('finished') : t('projected_finish') }}</dt>
            <dd data-testid="reading-goal-detail-projected-finish">
              {{ progress.projectedFinishDate ? displayDate(progress.projectedFinishDate, locale) : t('not_enough_reading') }}
            </dd>
          </div>
          <div>
            <dt>{{ t('average_per_day') }}</dt>
            <dd data-testid="reading-goal-detail-average">
              {{ $n(roundTenth(progress.averagePerDay)) }}
            </dd>
          </div>
          <div>
            <dt>{{ t('required_per_day') }}</dt>
            <dd>{{ $n(roundTenth(progress.requiredPerDay)) }}</dd>
          </div>
          <div>
            <dt>{{ t('verses_read') }}</dt>
            <dd>
              {{ $n(progress.versesRead, 'grouped') }} / {{ $n(progress.totalVerses, 'grouped') }}
              ({{ $n(Math.floor(progress.percent) / 100, 'percent') }})
            </dd>
          </div>
        </dl>

        <p v-if="nextUpLabel" data-testid="reading-goal-detail-next-up">
          {{ t('next_up', { passage: nextUpLabel }) }}
        </p>

        <h2 class="mbl-title mbl-title--5">
          {{ t('books') }}
        </h2>
        <ol class="goal-detail__books" data-testid="reading-goal-detail-books">
          <li v-for="item in progress.perPassage" :key="item.passage.startVerseId" class="goal-detail__book">
            <div class="goal-detail__book-label">
              <span>{{ passageLabel(item.passage) }}</span>
              <span class="mbl-text-small mbl-text-muted">
                {{ $n(item.versesRead, 'grouped') }} / {{ $n(item.totalVerses, 'grouped') }}
              </span>
            </div>
            <completion-bar
              :percentage="item.versesRead / item.totalVerses * 100"
              :foreground-color="item.versesRead >= item.totalVerses ? 'var(--mbl-success)' : 'var(--mbl-link-bright)'"
            />
          </li>
        </ol>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import {
  Bible,
  computeGoalChartSeries,
  displayDate,
  isWholeBookPassage,
  passageBookIndex,
  type GoalPassage,
} from '@mybiblelog/shared';
import ReadingGoalChart from '~/components/goals/ReadingGoalChart.vue';
import CompletionBar from '~/components/ui/CompletionBar.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useReadingGoalsStore } from '~/stores/reading-goals';

definePageMeta({ middleware: ['auth'] });

const { t, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const readingGoalsStore = useReadingGoalsStore();
const logEntriesStore = useLogEntriesStore();

const goal = computed(() => readingGoalsStore.getGoal(String(route.params.id)));
const progress = computed(() => (goal.value ? readingGoalsStore.getProgress(goal.value) : null));
const series = computed(() => (goal.value
  ? computeGoalChartSeries(goal.value, logEntriesStore.logEntries, dayjs().format('YYYY-MM-DD'))
  : []));

useHead({
  title: () => goal.value?.title ?? t('goal'),
  meta: [{ name: 'robots', content: 'noindex' }],
});

const roundTenth = (value: number) => Math.round(value * 10) / 10;

const passageLabel = (passage: GoalPassage) => (isWholeBookPassage(passage)
  ? Bible.getBookName(passageBookIndex(passage), locale.value)
  : Bible.displayVerseRange(passage.startVerseId, passage.endVerseId, locale.value));

const nextUpLabel = computed(() => {
  const nextUp = progress.value?.nextUp;
  return nextUp ? Bible.displayVerseRange(nextUp.startVerseId, nextUp.endVerseId, locale.value) : '';
});

onMounted(async () => {
  await useAppInitStore().loadUserData();
});
</script>

<style scoped>
.goal-detail__chart {
  margin: var(--mbl-space-lg) 0;
}

.goal-detail__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--mbl-space-md);
  margin: 0 0 var(--mbl-space-lg);
}

.goal-detail__stats dt {
  color: var(--mbl-text-muted);
  font-size: var(--mbl-title-6);
}

.goal-detail__stats dd {
  margin: 0;
  color: var(--mbl-text-strong);
  font-size: var(--mbl-title-5);
  font-weight: 600;
}

.goal-detail__books {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.goal-detail__book-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--mbl-space-3xs);
}
</style>

<i18n lang="json">
{
  "en": {
    "goal": "Goal",
    "not_found": "This goal could not be found.",
    "all_goals": "All goals",
    "edit": "Edit",
    "inactive": "Inactive",
    "completed_on": "Goal complete! You finished on {date}.",
    "finished": "Finished",
    "projected_finish": "Projected finish",
    "not_enough_reading": "Not enough reading yet",
    "average_per_day": "Average verses per day",
    "required_per_day": "Verses per day needed",
    "verses_read": "Verses read",
    "next_up": "Next up: {passage}",
    "books": "Books"
  },
  "de": {
    "goal": "Ziel",
    "not_found": "Dieses Ziel wurde nicht gefunden.",
    "all_goals": "Alle Ziele",
    "edit": "Bearbeiten",
    "inactive": "Inaktiv",
    "completed_on": "Ziel erreicht! Sie waren am {date} fertig.",
    "finished": "Abgeschlossen am",
    "projected_finish": "Voraussichtliches Ende",
    "not_enough_reading": "Noch nicht genug gelesen",
    "average_per_day": "Durchschnittliche Verse pro Tag",
    "required_per_day": "Benötigte Verse pro Tag",
    "verses_read": "Gelesene Verse",
    "next_up": "Als Nächstes: {passage}",
    "books": "Bücher"
  },
  "es": {
    "goal": "Meta",
    "not_found": "No se encontró esta meta.",
    "all_goals": "Todas las metas",
    "edit": "Editar",
    "inactive": "Inactiva",
    "completed_on": "¡Meta cumplida! Terminaste el {date}.",
    "finished": "Terminada",
    "projected_finish": "Fin estimado",
    "not_enough_reading": "Aún no hay suficiente lectura",
    "average_per_day": "Promedio de versículos al día",
    "required_per_day": "Versículos necesarios al día",
    "verses_read": "Versículos leídos",
    "next_up": "Siguiente: {passage}",
    "books": "Libros"
  },
  "fr": {
    "goal": "Objectif",
    "not_found": "Cet objectif est introuvable.",
    "all_goals": "Tous les objectifs",
    "edit": "Modifier",
    "inactive": "Inactif",
    "completed_on": "Objectif atteint ! Vous avez terminé le {date}.",
    "finished": "Terminé le",
    "projected_finish": "Fin prévue",
    "not_enough_reading": "Pas encore assez de lecture",
    "average_per_day": "Moyenne de versets par jour",
    "required_per_day": "Versets nécessaires par jour",
    "verses_read": "Versets lus",
    "next_up": "À suivre : {passage}",
    "books": "Livres"
  },
  "ko": {
    "goal": "목표",
    "not_found": "이 목표를 찾을 수 없습니다.",
    "all_goals": "모든 목표",
    "edit": "편집",
    "inactive": "비활성",
    "completed_on": "목표 달성! {date}에 완료했습니다.",
    "finished": "완료일",
    "projected_finish": "예상 완료일",
    "not_enough_reading": "아직 읽은 내용이 부족합니다",
    "average_per_day": "하루 평균 구절 수",
    "required_per_day": "하루 필요한 구절 수",
    "verses_read": "읽은 구절",
    "next_up": "다음 읽을 곳: {passage}",
    "books": "책"
  },
  "pt": {
    "goal": "Meta",
    "not_found": "Esta meta não foi encontrada.",
    "all_goals": "Todas as metas",
    "edit": "Editar",
    "inactive": "Inativa",
    "completed_on": "Meta concluída! Você terminou em {date}.",
    "finished": "Concluída em",
    "projected_finish": "Término previsto",
    "not_enough_reading": "Ainda não há leitura suficiente",
    "average_per_day": "Média de versículos por dia",
    "required_per_day": "Versículos necessários por dia",
    "verses_read": "Versículos lidos",
    "next_up": "A seguir: {passage}",
    "books": "Livros"
  },
  "uk": {
    "goal": "Мета",
    "not_found": "Цю мету не знайдено.",
    "all_goals": "Усі цілі",
    "edit": "Редагувати",
    "inactive": "Неактивна",
    "completed_on": "Мету досягнуто! Ви завершили {date}.",
    "finished": "Завершено",
    "projected_finish": "Прогнозоване завершення",
    "not_enough_reading": "Поки недостатньо прочитаного",
    "average_per_day": "Середня кількість віршів на день",
    "required_per_day": "Потрібно віршів на день",
    "verses_read": "Прочитані вірші",
    "next_up": "Далі: {passage}",
    "books": "Книги"
  }
}
</i18n>
