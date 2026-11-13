<template>
  <main class="content-column">
    <header class="page-header">
      <h1 class="mbl-title">
        {{ t('goals') }}
      </h1>
      <NuxtLink
        v-if="readingGoalsStore.goals.length"
        class="mbl-button mbl-button--primary"
        :to="localePath('goals-new')"
        data-testid="reading-goal-new"
      >
        {{ t('new_goal') }}
      </NuxtLink>
    </header>

    <skeleton-loader v-if="!readingGoalsStore.isLoaded" :count="2" />

    <div v-else-if="!readingGoalsStore.goals.length" class="mbl-box goals-page__empty" data-testid="reading-goals-empty">
      <reading-goal-ring :percent="62" :size="72" />
      <h2 class="mbl-title mbl-title--4">
        {{ t('empty.title') }}
      </h2>
      <p>{{ t('empty.body') }}</p>
      <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('goals-new')" data-testid="reading-goal-new">
        {{ t('empty.action') }}
      </NuxtLink>
    </div>

    <template v-else>
      <section class="goals-page__section" data-testid="reading-goals-current">
        <h2 class="goals-page__section-title">
          {{ t('section.current') }}
        </h2>
        <p v-if="!sections.current.length" class="goals-page__none">
          {{ t('none_current') }}
        </p>
        <div v-else class="goals-page__list" role="list">
          <reading-goal-card
            v-for="{ goal, progress } in sections.current"
            :key="goal.id"
            role="listitem"
            :goal="goal"
            :progress="progress"
            manageable
          />
        </div>
      </section>

      <template v-for="key in rowSections" :key="key">
        <component
          :is="key === 'archived' ? 'details' : 'section'"
          v-if="sections[key].length"
          class="goals-page__section"
          :data-testid="`reading-goals-${key}`"
        >
          <component :is="key === 'archived' ? 'summary' : 'h2'" class="goals-page__section-title">
            {{ t(`section.${key}`) }}
            <span class="goals-page__count">{{ sections[key].length }}</span>
          </component>
          <div class="goals-page__list" role="list">
            <div
              v-for="{ goal, progress } in sections[key]"
              :key="goal.id"
              role="listitem"
              class="mbl-card goals-page__row"
              data-testid="reading-goal-row"
              :data-goal-id="goal.id"
            >
              <div class="goals-page__row-main">
                <NuxtLink class="goals-page__row-link" :to="localePath({ name: 'goals-id', params: { id: goal.id } })">
                  <reading-goal-ring :percent="progress.percent" :complete="progress.isComplete" :size="40" />
                  <span class="goals-page__row-text">
                    <span class="goals-page__row-title" data-testid="reading-goal-row-title">{{ goal.title }}</span>
                    <span class="goals-page__row-meta">{{ rowMeta(key, goal, progress) }}</span>
                  </span>
                </NuxtLink>
                <reading-goal-status v-if="key === 'upcoming'" :goal="goal" :progress="progress" />
                <reading-goal-menu :goal="goal" />
              </div>
              <reading-goal-outside-canon-note :progress="progress" data-testid="reading-goal-row-outside-canon" />
            </div>
          </div>
        </component>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import type { ReadingGoal, ReadingGoalProgress } from '@mybiblelog/shared';
import ReadingGoalCard from '~/components/goals/ReadingGoalCard.vue';
import ReadingGoalMenu from '~/components/goals/ReadingGoalMenu.vue';
import ReadingGoalOutsideCanonNote from '~/components/goals/ReadingGoalOutsideCanonNote.vue';
import ReadingGoalRing from '~/components/goals/ReadingGoalRing.vue';
import ReadingGoalStatus from '~/components/goals/ReadingGoalStatus.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useReadingGoalsStore, type ReadingGoalSection } from '~/stores/reading-goals';

definePageMeta({ middleware: ['auth'] });

const { t, n } = useI18n();
const localePath = useLocalePath();
const formatDate = useLocalizedDate();
const readingGoalsStore = useReadingGoalsStore();

useHead({ title: () => t('goals'), meta: [{ name: 'robots', content: 'noindex' }] });

const sections = computed(() => readingGoalsStore.sections);
const rowSections: Exclude<ReadingGoalSection, 'current'>[] = ['upcoming', 'completed', 'archived'];

const rowMeta = (section: ReadingGoalSection, goal: ReadingGoal, progress: ReadingGoalProgress) => {
  const verses = t('verse_count', { count: n(progress.totalVerses, 'grouped') });
  if (section === 'completed') {
    return `${t('finished', { date: formatDate(progress.completedDate!) })} · ${verses}`;
  }
  const dates = `${formatDate(goal.startDate)} – ${formatDate(goal.endDate)}`;
  if (section === 'upcoming') {
    return `${dates} · ${verses}`;
  }
  return `${t('verses_of_total', { read: n(progress.versesRead, 'grouped'), total: n(progress.totalVerses, 'grouped') })} · ${dates}`;
};

onMounted(() => useAppInitStore().loadUserData());
</script>

<style scoped>
.goals-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mbl-space-sm);
  padding: var(--mbl-space-3xl) var(--mbl-space-xl);
  text-align: center;
}

.goals-page__empty .mbl-title {
  margin: var(--mbl-space-xs) 0 0;
}

.goals-page__empty p {
  max-width: 28rem;
  margin: 0 0 var(--mbl-space-xs);
  color: var(--mbl-text-muted);
}

.goals-page__section {
  margin-bottom: var(--mbl-space-2xl);
}

.goals-page__section-title {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
  margin: 0 0 var(--mbl-space-sm);
  color: var(--mbl-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

summary.goals-page__section-title {
  cursor: pointer;
}

.goals-page__count {
  padding: 0 var(--mbl-space-xs);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-bg-muted);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.goals-page__none {
  color: var(--mbl-text-muted);
}

.goals-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-sm);
}

.goals-page__row {
  padding: var(--mbl-space-sm) var(--mbl-space-md);
}

.goals-page__row:has(.goals-page__row-link:hover) {
  box-shadow: var(--mbl-shadow-card-hover);
}

.goals-page__row-main {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.goals-page__row-link {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--mbl-space-sm);
  min-width: 0;
  color: var(--mbl-text-body);
  text-decoration: none;
}

.goals-page__row-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.goals-page__row-title {
  overflow: hidden;
  color: var(--mbl-text-strong);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goals-page__row-meta {
  color: var(--mbl-text-muted);
  font-size: 0.85rem;
}

details[data-testid="reading-goals-archived"] .goals-page__row {
  opacity: 0.85;
}
</style>

<i18n lang="json">
{
  "en": {
    "goals": "Goals",
    "new_goal": "New goal",
    "empty": {
      "title": "Read with a finish line",
      "body": "Pick the books you want to read and the date you want to finish. We'll show what to read each day and whether you're on track.",
      "action": "Set your first goal"
    },
    "section": {
      "current": "In progress",
      "upcoming": "Upcoming",
      "completed": "Completed",
      "archived": "Archived"
    },
    "none_current": "No goals in progress right now.",
    "verse_count": "{count} verses",
    "verses_of_total": "{read} of {total} verses",
    "finished": "Finished {date}"
  },
  "de": {
    "goals": "Ziele",
    "new_goal": "Neues Ziel",
    "empty": {
      "title": "Lesen mit einer Ziellinie",
      "body": "Wählen Sie die Bücher, die Sie lesen möchten, und das Datum, bis zu dem Sie fertig sein wollen. Wir zeigen Ihnen, was Sie täglich lesen sollten und ob Sie im Plan liegen.",
      "action": "Erstes Ziel festlegen"
    },
    "section": {
      "current": "Laufend",
      "upcoming": "Bevorstehend",
      "completed": "Abgeschlossen",
      "archived": "Archiviert"
    },
    "none_current": "Derzeit keine laufenden Ziele.",
    "verse_count": "{count} Verse",
    "verses_of_total": "{read} von {total} Versen",
    "finished": "Abgeschlossen am {date}"
  },
  "es": {
    "goals": "Metas",
    "new_goal": "Nueva meta",
    "empty": {
      "title": "Lee con una línea de meta",
      "body": "Elige los libros que quieres leer y la fecha en la que quieres terminar. Te mostraremos qué leer cada día y si vas al día.",
      "action": "Crea tu primera meta"
    },
    "section": {
      "current": "En curso",
      "upcoming": "Próximas",
      "completed": "Completadas",
      "archived": "Archivadas"
    },
    "none_current": "No hay metas en curso por ahora.",
    "verse_count": "{count} versículos",
    "verses_of_total": "{read} de {total} versículos",
    "finished": "Terminada el {date}"
  },
  "fr": {
    "goals": "Objectifs",
    "new_goal": "Nouvel objectif",
    "empty": {
      "title": "Lisez avec une ligne d'arrivée",
      "body": "Choisissez les livres que vous voulez lire et la date à laquelle vous voulez terminer. Nous vous indiquerons quoi lire chaque jour et si vous êtes dans les temps.",
      "action": "Créer votre premier objectif"
    },
    "section": {
      "current": "En cours",
      "upcoming": "À venir",
      "completed": "Terminés",
      "archived": "Archivés"
    },
    "none_current": "Aucun objectif en cours pour le moment.",
    "verse_count": "{count} versets",
    "verses_of_total": "{read} versets sur {total}",
    "finished": "Terminé le {date}"
  },
  "ko": {
    "goals": "목표",
    "new_goal": "새 목표",
    "empty": {
      "title": "결승선을 정하고 읽어 보세요",
      "body": "읽고 싶은 책과 마치고 싶은 날짜를 고르세요. 매일 읽을 분량과 진행 상황을 알려 드립니다.",
      "action": "첫 목표 세우기"
    },
    "section": {
      "current": "진행 중",
      "upcoming": "예정",
      "completed": "완료",
      "archived": "보관됨"
    },
    "none_current": "지금 진행 중인 목표가 없습니다.",
    "verse_count": "{count}절",
    "verses_of_total": "{total}절 중 {read}절",
    "finished": "{date} 완료"
  },
  "pt": {
    "goals": "Metas",
    "new_goal": "Nova meta",
    "empty": {
      "title": "Leia com uma linha de chegada",
      "body": "Escolha os livros que quer ler e a data em que quer terminar. Mostraremos o que ler a cada dia e se você está em dia.",
      "action": "Crie sua primeira meta"
    },
    "section": {
      "current": "Em andamento",
      "upcoming": "Próximas",
      "completed": "Concluídas",
      "archived": "Arquivadas"
    },
    "none_current": "Nenhuma meta em andamento no momento.",
    "verse_count": "{count} versículos",
    "verses_of_total": "{read} de {total} versículos",
    "finished": "Concluída em {date}"
  },
  "uk": {
    "goals": "Цілі",
    "new_goal": "Нова мета",
    "empty": {
      "title": "Читайте з фінішною лінією",
      "body": "Виберіть книги, які хочете прочитати, і дату, до якої хочете завершити. Ми покажемо, що читати щодня і чи встигаєте ви за графіком.",
      "action": "Поставити першу мету"
    },
    "section": {
      "current": "У процесі",
      "upcoming": "Майбутні",
      "completed": "Завершені",
      "archived": "В архіві"
    },
    "none_current": "Зараз немає цілей у процесі.",
    "verse_count": "Віршів: {count}",
    "verses_of_total": "{read} з {total} віршів",
    "finished": "Завершено {date}"
  }
}
</i18n>
