<template>
  <main class="content-column">
    <skeleton-loader v-if="!readingGoalsStore.isLoaded" :count="3" />
    <div v-else-if="!goal" class="mbl-empty-state" data-testid="reading-goal-not-found">
      <p>{{ t('not_found') }}</p>
      <NuxtLink class="mbl-button" :to="localePath('goals')">
        {{ t('all_goals') }}
      </NuxtLink>
    </div>
    <template v-else>
      <NuxtLink class="goal-page__back" :to="detailPath">
        <caret-left-icon fill="currentColor" /> {{ goal.title }}
      </NuxtLink>
      <header class="page-header">
        <h1 class="mbl-title mbl-title--3">
          {{ t('edit_goal') }}
        </h1>
      </header>
      <reading-goal-form :goal="goal" @saved="backToGoal" @cancel="backToGoal" />
    </template>
  </main>
</template>

<script setup lang="ts">
import ReadingGoalForm from '~/components/goals/ReadingGoalForm.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useReadingGoalsStore } from '~/stores/reading-goals';

definePageMeta({ middleware: ['auth'] });

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const readingGoalsStore = useReadingGoalsStore();

const goal = computed(() => readingGoalsStore.getGoal(String(route.params.id)));
const detailPath = computed(() => localePath({ name: 'goals-id', params: { id: String(route.params.id) } }));

useHead({ title: () => t('edit_goal'), meta: [{ name: 'robots', content: 'noindex' }] });

const backToGoal = () => navigateTo(detailPath.value, { replace: true });

onMounted(() => useAppInitStore().loadUserData());
</script>

<style scoped>
.goal-page__back {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-2xs);
  margin-bottom: var(--mbl-space-xs);
  color: var(--mbl-text-muted);
  font-size: 0.9rem;
  text-decoration: none;
}

.goal-page__back:hover {
  color: var(--mbl-text-strong);
}
</style>

<i18n lang="json">
{
  "en": { "edit_goal": "Edit goal", "not_found": "This goal could not be found.", "all_goals": "All goals" },
  "de": { "edit_goal": "Ziel bearbeiten", "not_found": "Dieses Ziel wurde nicht gefunden.", "all_goals": "Alle Ziele" },
  "es": { "edit_goal": "Editar meta", "not_found": "No se encontró esta meta.", "all_goals": "Todas las metas" },
  "fr": { "edit_goal": "Modifier l'objectif", "not_found": "Cet objectif est introuvable.", "all_goals": "Tous les objectifs" },
  "ko": { "edit_goal": "목표 편집", "not_found": "이 목표를 찾을 수 없습니다.", "all_goals": "모든 목표" },
  "pt": { "edit_goal": "Editar meta", "not_found": "Esta meta não foi encontrada.", "all_goals": "Todas as metas" },
  "uk": { "edit_goal": "Редагувати мету", "not_found": "Цю мету не знайдено.", "all_goals": "Усі цілі" }
}
</i18n>
