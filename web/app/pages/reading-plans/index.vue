<template>
  <div class="content-column">
    <header class="page-header">
      <h1 class="mbl-title">
        {{ t('reading_plans') }}
      </h1>
      <button
        class="mbl-button mbl-button--primary"
        :disabled="!hydrated || readingPlansStore.atPlanLimit"
        data-testid="new-plan-button"
        @click="openCreate"
      >
        {{ t('new_plan') }}
      </button>
    </header>

    <div
      v-if="readingPlansStore.atPlanLimit"
      class="mbl-message mbl-message--info"
      data-testid="plan-limit-message"
    >
      <div class="mbl-message__body">
        {{ t('plan_limit_message', { count: readingPlansStore.planLimit }) }}
      </div>
    </div>

    <div class="reading-plans__list" role="list" data-testid="reading-plans-list">
      <ClientOnly>
        <skeleton-loader v-if="loading && !plans.length" :count="3" />
        <template v-else-if="!plans.length">
          <log-entry :message="t('no_plans')" role="listitem" />
        </template>
        <template v-else>
          <NuxtLink
            v-for="plan in plans"
            :key="plan.id"
            class="reading-plans__card"
            role="listitem"
            :to="localePath(`/reading-plans/${plan.id}`)"
            data-testid="reading-plan-card"
          >
            <div class="reading-plans__card-name">
              {{ plan.name }}
              <span v-if="trackerForPlan(plan.id)" class="reading-plans__badge">{{ t('tracking') }}</span>
            </div>
            <div class="reading-plans__card-meta">
              {{ t('day_count', { count: plan.days.length }) }}
              ·
              {{ t('verse_count', { count: uniqueVerses(plan) }) }}
            </div>
          </NuxtLink>
        </template>
        <template #fallback>
          <skeleton-loader :count="3" />
        </template>
      </ClientOnly>
    </div>

    <app-modal :open="createOpen" :title="t('new_plan')" @close="closeCreate">
      <template #content>
        <div class="mbl-field">
          <label class="mbl-label" for="new-plan-name">{{ t('plan_name') }}</label>
          <div class="mbl-control">
            <input
              id="new-plan-name"
              ref="nameInput"
              v-model="newName"
              class="mbl-input"
              type="text"
              maxlength="100"
              :placeholder="t('name_placeholder')"
              data-testid="new-plan-name-input"
              @keyup.enter="submitCreate"
            >
          </div>
        </div>
      </template>
      <template #footer>
        <button
          class="mbl-button mbl-button--primary"
          :disabled="!newName.trim() || creating"
          data-testid="new-plan-create"
          @click="submitCreate"
        >
          {{ t('create') }}
        </button>
        <button class="mbl-button mbl-button--light" @click="closeCreate">
          {{ t('cancel') }}
        </button>
      </template>
    </app-modal>
  </div>
</template>

<script setup lang="ts">
import { countPlanUniqueVerses, type ReadingPlan } from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import LogEntry from '~/components/log/LogEntry.vue';
import { useReadingPlansStore } from '~/stores/reading-plans';
import { usePlanTrackersStore } from '~/stores/plan-trackers';
import { useToastStore } from '~/stores/toast';

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

definePageMeta({ middleware: ['auth'] });
useHead({ title: () => t('reading_plans') });

const readingPlansStore = useReadingPlansStore();
const planTrackersStore = usePlanTrackersStore();
const toastStore = useToastStore();

const hydrated = ref(false);
const loading = ref(true);
const createOpen = ref(false);
const creating = ref(false);
const newName = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

const plans = computed(() => readingPlansStore.plans);

const uniqueVerses = (plan: ReadingPlan) => countPlanUniqueVerses(plan.days);
const trackerForPlan = (planId: number | string) => planTrackersStore.activeTrackerForPlan(planId);

const openCreate = () => {
  newName.value = '';
  createOpen.value = true;
  nextTick(() => nameInput.value?.focus());
};

const closeCreate = () => {
  createOpen.value = false;
};

const submitCreate = async () => {
  const name = newName.value.trim();
  if (!name || creating.value) { return; }
  creating.value = true;
  try {
    const plan = await readingPlansStore.createReadingPlan({ name, days: [] });
    createOpen.value = false;
    await router.push(localePath(`/reading-plans/${plan.id}`));
  }
  catch {
    toastStore.add({ type: 'error', text: t('could_not_create') });
  }
  finally {
    creating.value = false;
  }
};

onMounted(async () => {
  hydrated.value = true;
  try {
    await Promise.all([
      readingPlansStore.loadReadingPlans(),
      planTrackersStore.loadPlanTrackers(),
    ]);
  }
  finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.reading-plans__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.reading-plans__card {
  display: block;
  padding: 1rem;
  background: var(--mbl-bg-elevated);
  border-radius: var(--mbl-radius);
  box-shadow: var(--mbl-shadow-elev-1);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.reading-plans__card:hover {
  box-shadow: var(--mbl-shadow-elev-2);
}

.reading-plans__card-name {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reading-plans__card-meta {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--mbl-text-subtle);
}

.reading-plans__badge {
  font-size: 0.7rem;
  font-weight: normal;
  color: var(--mbl-on-accent);
  background: var(--mbl-link-bright);
  padding: 0.1em 0.5em;
  border-radius: 0.5em;
}
</style>

<i18n lang="json">
{
  "en": {
    "reading_plans": "Reading Plans",
    "new_plan": "New Plan",
    "plan_limit_message": "You can only have {count} reading plans. Delete some if you need to make room.",
    "no_plans": "No reading plans yet.",
    "day_count": "{count} days",
    "verse_count": "{count} verses",
    "tracking": "Tracking",
    "plan_name": "Plan name",
    "name_placeholder": "e.g. Gospel of John",
    "create": "Create",
    "cancel": "Cancel",
    "could_not_create": "The reading plan could not be created."
  },
  "de": {
    "reading_plans": "Lesepläne",
    "new_plan": "Neuer Plan",
    "plan_limit_message": "Sie können nur {count} Lesepläne haben. Löschen Sie einige, um Platz zu schaffen.",
    "no_plans": "Noch keine Lesepläne.",
    "day_count": "{count} Tage",
    "verse_count": "{count} Verse",
    "tracking": "Wird verfolgt",
    "plan_name": "Planname",
    "name_placeholder": "z. B. Johannesevangelium",
    "create": "Erstellen",
    "cancel": "Abbrechen",
    "could_not_create": "Der Leseplan konnte nicht erstellt werden."
  },
  "es": {
    "reading_plans": "Planes de lectura",
    "new_plan": "Nuevo plan",
    "plan_limit_message": "Solo puedes tener {count} planes de lectura. Elimina algunos si necesitas hacer espacio.",
    "no_plans": "Aún no hay planes de lectura.",
    "day_count": "{count} días",
    "verse_count": "{count} versículos",
    "tracking": "Siguiendo",
    "plan_name": "Nombre del plan",
    "name_placeholder": "p. ej. Evangelio de Juan",
    "create": "Crear",
    "cancel": "Cancelar",
    "could_not_create": "No se pudo crear el plan de lectura."
  },
  "fr": {
    "reading_plans": "Plans de lecture",
    "new_plan": "Nouveau plan",
    "plan_limit_message": "Vous ne pouvez avoir que {count} plans de lecture. Supprimez-en pour faire de la place.",
    "no_plans": "Aucun plan de lecture pour le moment.",
    "day_count": "{count} jours",
    "verse_count": "{count} versets",
    "tracking": "Suivi",
    "plan_name": "Nom du plan",
    "name_placeholder": "p. ex. Évangile de Jean",
    "create": "Créer",
    "cancel": "Annuler",
    "could_not_create": "Le plan de lecture n'a pas pu être créé."
  },
  "ko": {
    "reading_plans": "읽기 계획",
    "new_plan": "새 계획",
    "plan_limit_message": "읽기 계획은 최대 {count}개까지 만들 수 있습니다. 공간이 필요하면 일부를 삭제하세요.",
    "no_plans": "아직 읽기 계획이 없습니다.",
    "day_count": "{count}일",
    "verse_count": "{count}절",
    "tracking": "추적 중",
    "plan_name": "계획 이름",
    "name_placeholder": "예: 요한복음",
    "create": "만들기",
    "cancel": "취소",
    "could_not_create": "읽기 계획을 만들 수 없습니다."
  },
  "pt": {
    "reading_plans": "Planos de leitura",
    "new_plan": "Novo plano",
    "plan_limit_message": "Você só pode ter {count} planos de leitura. Exclua alguns se precisar de espaço.",
    "no_plans": "Ainda não há planos de leitura.",
    "day_count": "{count} dias",
    "verse_count": "{count} versículos",
    "tracking": "Acompanhando",
    "plan_name": "Nome do plano",
    "name_placeholder": "ex.: Evangelho de João",
    "create": "Criar",
    "cancel": "Cancelar",
    "could_not_create": "Não foi possível criar o plano de leitura."
  },
  "uk": {
    "reading_plans": "Плани читання",
    "new_plan": "Новий план",
    "plan_limit_message": "Ви можете мати лише {count} планів читання. Видаліть деякі, щоб звільнити місце.",
    "no_plans": "Ще немає планів читання.",
    "day_count": "{count} днів",
    "verse_count": "{count} віршів",
    "tracking": "Відстежується",
    "plan_name": "Назва плану",
    "name_placeholder": "напр. Євангеліє від Івана",
    "create": "Створити",
    "cancel": "Скасувати",
    "could_not_create": "Не вдалося створити план читання."
  }
}
</i18n>
