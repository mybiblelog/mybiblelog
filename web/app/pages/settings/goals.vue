<template>
  <div>
    <reading-goal-editor
      v-if="editorOpen"
      :key="editingGoal?.id ?? 'new'"
      :goal="editingGoal"
      @saved="closeEditor"
      @cancel="closeEditor"
    />
    <template v-else>
      <div class="mbl-level mbl-level--mobile">
        <div class="mbl-level-left">
          <div class="mbl-level-item">
            <h2 class="mbl-title mbl-title--4">
              {{ t('goals') }}
            </h2>
          </div>
        </div>
        <div class="mbl-level-right">
          <div class="mbl-level-item">
            <button class="mbl-button mbl-button--primary" :disabled="!hydrated" data-testid="reading-goal-new" @click="openEditor()">
              {{ t('new_goal') }}
            </button>
          </div>
        </div>
      </div>
      <p class="reading-goals__intro">
        {{ t('intro') }}
      </p>

      <div class="mbl-tabs">
        <ul>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'active' }"
              data-testid="reading-goals-tab-active"
              @click.prevent="view = 'active'"
            >
              {{ t('tab_active', { count: readingGoalsStore.activeGoals.length }) }}
            </a>
          </li>
          <li>
            <a
              href="#"
              :class="{ 'router-link-exact-active': view === 'inactive' }"
              data-testid="reading-goals-tab-inactive"
              @click.prevent="view = 'inactive'"
            >
              {{ t('tab_inactive', { count: readingGoalsStore.inactiveGoals.length }) }}
            </a>
          </li>
        </ul>
      </div>

      <skeleton-loader v-if="!readingGoalsStore.isLoaded" />
      <p v-else-if="!visibleGoals.length" class="mbl-text-muted" data-testid="reading-goals-empty">
        {{ view === 'active' ? t('no_active_goals') : t('no_inactive_goals') }}
      </p>
      <div v-else class="reading-goals__list" role="list" data-testid="reading-goals-list">
        <div
          v-for="{ goal, progress } in visibleGoals"
          :key="goal.id"
          role="listitem"
          class="mbl-card mbl-card--list-item reading-goals__row"
          data-testid="reading-goal-row"
          :data-goal-id="goal.id"
        >
          <div class="reading-goals__summary">
            <NuxtLink class="reading-goals__title" :to="localePath(`/goals/${goal.id}`)" data-testid="reading-goal-row-title">
              {{ goal.title }}
            </NuxtLink>
            <span class="mbl-text-small mbl-text-muted">
              {{ formatDate(goal.startDate) }} – {{ formatDate(goal.endDate) }}
              · {{ $n(Math.floor(progress.percent) / 100, 'percent') }}
              <template v-if="progress.isComplete">· {{ t('complete') }}</template>
            </span>
          </div>
          <div class="reading-goals__actions">
            <label class="mbl-checkbox mbl-text-small">
              <input
                type="checkbox"
                :checked="goal.active"
                :disabled="busyGoalId === goal.id"
                data-testid="reading-goal-active-toggle"
                @change="toggleActive(goal)"
              >
              {{ t('active') }}
            </label>
            <button class="mbl-button mbl-button--sm" data-testid="reading-goal-edit" @click="openEditor(goal)">
              {{ t('edit') }}
            </button>
            <button class="mbl-button mbl-button--sm mbl-button--danger" data-testid="reading-goal-delete" @click="deleteGoal(goal)">
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { ReadingGoal } from '@mybiblelog/shared';
import ReadingGoalEditor from '~/components/goals/ReadingGoalEditor.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import { useAppInitStore } from '~/stores/app-init';
import { useReadingGoalsStore } from '~/stores/reading-goals';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';

dayjs.extend(localizedFormat);

const { t, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const hydrated = useHydrated();
const readingGoalsStore = useReadingGoalsStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();

definePageMeta({ middleware: ['auth'] });
useHead({ title: () => t('goals'), meta: [{ name: 'robots', content: 'noindex' }] });

const formatDate = (date: string) => dayjs(date).locale(locale.value).format('ll');

const view = ref<'active' | 'inactive'>('active');
const busyGoalId = ref<string | null>(null);

// The editor is driven by the query string (`?new` or `?edit=<id>`) so the
// goal detail page can link straight into editing.
const editorOpen = computed(() => route.query.new !== undefined || typeof route.query.edit === 'string');
const editingGoal = computed(() =>
  typeof route.query.edit === 'string' ? readingGoalsStore.getGoal(route.query.edit) ?? null : null,
);

const visibleGoals = computed(() => {
  const goals = view.value === 'active' ? readingGoalsStore.activeGoals : readingGoalsStore.inactiveGoals;
  return goals.map(goal => ({ goal, progress: readingGoalsStore.getProgress(goal) }));
});

const openEditor = (goal?: ReadingGoal) => {
  router.push({ query: goal ? { edit: goal.id } : { new: null } });
};

const closeEditor = () => {
  router.push({ query: {} });
};

const toggleActive = async (goal: ReadingGoal) => {
  busyGoalId.value = goal.id;
  try {
    await readingGoalsStore.setGoalActive(goal, !goal.active);
  }
  catch {
    toastStore.add({ type: 'error', text: t('save_error') });
  }
  finally {
    busyGoalId.value = null;
  }
};

const deleteGoal = async (goal: ReadingGoal) => {
  const confirmed = await dialogStore.confirm({
    message: t('confirm_delete', { title: goal.title }),
    confirmButtonText: t('delete'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  try {
    await readingGoalsStore.deleteGoal(goal.id);
  }
  catch {
    toastStore.add({ type: 'error', text: t('delete_error') });
  }
};

onMounted(async () => {
  await useAppInitStore().loadUserData();
  // An `?edit=` id that doesn't match a goal (deleted, or another account's)
  // falls back to the list rather than opening a blank editor.
  if (typeof route.query.edit === 'string' && !editingGoal.value) {
    closeEditor();
  }
});
</script>

<style scoped>
.reading-goals__intro {
  margin-bottom: var(--mbl-space-md);
}

.reading-goals__list {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-xs);
}

.reading-goals__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mbl-space-xs) var(--mbl-space-md);
}

.reading-goals__summary {
  display: flex;
  flex-direction: column;
}

.reading-goals__title {
  font-weight: 600;
}

.reading-goals__actions {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-sm);
}
</style>

<i18n lang="json">
{
  "en": {
    "goals": "Goals",
    "new_goal": "New goal",
    "intro": "Set a goal to read a group of books by a date you choose. Active goals appear on your Today page.",
    "tab_active": "Active ({count})",
    "tab_inactive": "Inactive ({count})",
    "no_active_goals": "You have no active goals.",
    "no_inactive_goals": "You have no inactive goals.",
    "complete": "Complete",
    "active": "Active",
    "edit": "Edit",
    "delete": "Delete",
    "save_error": "The goal could not be saved. Please try again.",
    "delete_error": "The goal could not be deleted.",
    "confirm_delete": "Delete the goal \"{title}\"? This cannot be undone."
  },
  "de": {
    "goals": "Ziele",
    "new_goal": "Neues Ziel",
    "intro": "Setzen Sie sich das Ziel, eine Gruppe von Büchern bis zu einem gewählten Datum zu lesen. Aktive Ziele erscheinen auf Ihrer Heute-Seite.",
    "tab_active": "Aktiv ({count})",
    "tab_inactive": "Inaktiv ({count})",
    "no_active_goals": "Sie haben keine aktiven Ziele.",
    "no_inactive_goals": "Sie haben keine inaktiven Ziele.",
    "complete": "Abgeschlossen",
    "active": "Aktiv",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "save_error": "Das Ziel konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    "delete_error": "Das Ziel konnte nicht gelöscht werden.",
    "confirm_delete": "Das Ziel „{title}“ löschen? Dies kann nicht rückgängig gemacht werden."
  },
  "es": {
    "goals": "Metas",
    "new_goal": "Nueva meta",
    "intro": "Fíjate la meta de leer un grupo de libros para una fecha que elijas. Las metas activas aparecen en tu página de Hoy.",
    "tab_active": "Activas ({count})",
    "tab_inactive": "Inactivas ({count})",
    "no_active_goals": "No tienes metas activas.",
    "no_inactive_goals": "No tienes metas inactivas.",
    "complete": "Completada",
    "active": "Activa",
    "edit": "Editar",
    "delete": "Eliminar",
    "save_error": "No se pudo guardar la meta. Inténtalo de nuevo.",
    "delete_error": "No se pudo eliminar la meta.",
    "confirm_delete": "¿Eliminar la meta «{title}»? Esta acción no se puede deshacer."
  },
  "fr": {
    "goals": "Objectifs",
    "new_goal": "Nouvel objectif",
    "intro": "Fixez-vous l'objectif de lire un ensemble de livres d'ici une date de votre choix. Les objectifs actifs apparaissent sur votre page Aujourd'hui.",
    "tab_active": "Actifs ({count})",
    "tab_inactive": "Inactifs ({count})",
    "no_active_goals": "Vous n'avez aucun objectif actif.",
    "no_inactive_goals": "Vous n'avez aucun objectif inactif.",
    "complete": "Terminé",
    "active": "Actif",
    "edit": "Modifier",
    "delete": "Supprimer",
    "save_error": "L'objectif n'a pas pu être enregistré. Veuillez réessayer.",
    "delete_error": "L'objectif n'a pas pu être supprimé.",
    "confirm_delete": "Supprimer l'objectif « {title} » ? Cette action est irréversible."
  },
  "ko": {
    "goals": "목표",
    "new_goal": "새 목표",
    "intro": "원하는 날짜까지 여러 권의 책을 읽는 목표를 세워 보세요. 활성 목표는 오늘 페이지에 표시됩니다.",
    "tab_active": "활성 ({count})",
    "tab_inactive": "비활성 ({count})",
    "no_active_goals": "활성 목표가 없습니다.",
    "no_inactive_goals": "비활성 목표가 없습니다.",
    "complete": "완료",
    "active": "활성",
    "edit": "편집",
    "delete": "삭제",
    "save_error": "목표를 저장하지 못했습니다. 다시 시도해 주세요.",
    "delete_error": "목표를 삭제하지 못했습니다.",
    "confirm_delete": "\"{title}\" 목표를 삭제할까요? 이 작업은 되돌릴 수 없습니다."
  },
  "pt": {
    "goals": "Metas",
    "new_goal": "Nova meta",
    "intro": "Defina uma meta para ler um grupo de livros até a data que escolher. As metas ativas aparecem na sua página Hoje.",
    "tab_active": "Ativas ({count})",
    "tab_inactive": "Inativas ({count})",
    "no_active_goals": "Você não tem metas ativas.",
    "no_inactive_goals": "Você não tem metas inativas.",
    "complete": "Concluída",
    "active": "Ativa",
    "edit": "Editar",
    "delete": "Excluir",
    "save_error": "Não foi possível salvar a meta. Tente novamente.",
    "delete_error": "Não foi possível excluir a meta.",
    "confirm_delete": "Excluir a meta \"{title}\"? Esta ação não pode ser desfeita."
  },
  "uk": {
    "goals": "Цілі",
    "new_goal": "Нова мета",
    "intro": "Поставте мету прочитати групу книг до обраної дати. Активні цілі відображаються на сторінці «Сьогодні».",
    "tab_active": "Активні ({count})",
    "tab_inactive": "Неактивні ({count})",
    "no_active_goals": "У вас немає активних цілей.",
    "no_inactive_goals": "У вас немає неактивних цілей.",
    "complete": "Виконано",
    "active": "Активна",
    "edit": "Редагувати",
    "delete": "Видалити",
    "save_error": "Не вдалося зберегти мету. Спробуйте ще раз.",
    "delete_error": "Не вдалося видалити мету.",
    "confirm_delete": "Видалити мету «{title}»? Цю дію не можна скасувати."
  }
}
</i18n>
