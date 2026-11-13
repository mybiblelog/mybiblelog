<template>
  <main class="content-column">
    <NuxtLink class="goal-page__back" :to="localePath('goals')">
      <caret-left-icon fill="currentColor" /> {{ t('goals') }}
    </NuxtLink>
    <header class="page-header">
      <h1 class="mbl-title mbl-title--3">
        {{ t('new_goal') }}
      </h1>
    </header>
    <!-- Templates and the default goal date depend on the reader's settings. -->
    <skeleton-loader v-if="!readingGoalsStore.isLoaded" :count="3" />
    <reading-goal-form
      v-else
      :plan="plan"
      @update:plan="choosePlan"
      @saved="onSaved"
      @cancel="navigateTo(localePath('goals'))"
    />
  </main>
</template>

<script setup lang="ts">
import type { ReadingGoal } from '@mybiblelog/shared';
import ReadingGoalForm from '~/components/goals/ReadingGoalForm.vue';
import CaretLeftIcon from '~/components/svg/CaretLeftIcon.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useReadingGoalsStore } from '~/stores/reading-goals';

definePageMeta({ middleware: ['auth'] });

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const readingGoalsStore = useReadingGoalsStore();

useHead({ title: () => t('new_goal'), meta: [{ name: 'robots', content: 'noindex' }] });

// The chosen plan lives in the query so Back returns to the plan picker.
const plan = computed(() => (typeof route.query.plan === 'string' ? route.query.plan : ''));
const choosePlan = (id: string) => router.push({ query: { plan: id } });

// Replace, so Back from the new goal doesn't reopen the finished form.
const onSaved = (goal: ReadingGoal) =>
  navigateTo(localePath({ name: 'goals-id', params: { id: goal.id } }), { replace: true });

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
  "en": { "goals": "Goals", "new_goal": "New goal" },
  "de": { "goals": "Ziele", "new_goal": "Neues Ziel" },
  "es": { "goals": "Metas", "new_goal": "Nueva meta" },
  "fr": { "goals": "Objectifs", "new_goal": "Nouvel objectif" },
  "ko": { "goals": "목표", "new_goal": "새 목표" },
  "pt": { "goals": "Metas", "new_goal": "Nova meta" },
  "uk": { "goals": "Цілі", "new_goal": "Нова мета" }
}
</i18n>
