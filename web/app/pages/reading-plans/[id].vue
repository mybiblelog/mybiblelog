<template>
  <div class="content-column">
    <div class="plan-detail__back">
      <NuxtLink class="mbl-button mbl-button--light" :to="localePath('/reading-plans')">
        {{ t('back_to_plans') }}
      </NuxtLink>
    </div>

    <ClientOnly>
      <skeleton-loader v-if="loading" :count="2" />

      <template v-else-if="!plan">
        <log-entry :message="t('not_found')" />
      </template>

      <template v-else>
        <header class="page-header">
          <input
            v-model="name"
            class="mbl-input plan-detail__name"
            type="text"
            maxlength="100"
            :aria-label="t('plan_name')"
            data-testid="plan-name-input"
            @change="saveName"
            @blur="saveName"
          >
          <button
            class="mbl-button mbl-button--danger"
            data-testid="delete-plan-button"
            @click="deletePlan"
          >
            {{ t('delete') }}
          </button>
        </header>

        <!-- Stats -->
        <div class="plan-detail__stats" data-testid="plan-stats">
          <div class="plan-detail__stat">
            <div class="plan-detail__stat-value">
              {{ n(stats.uniqueVerses) }}
            </div>
            <div class="plan-detail__stat-label">
              {{ t('unique_verses') }}
            </div>
          </div>
          <div class="plan-detail__stat">
            <div class="plan-detail__stat-value">
              {{ n(stats.totalVerses) }}
            </div>
            <div class="plan-detail__stat-label">
              {{ t('total_verses') }}
            </div>
          </div>
          <div class="plan-detail__stat" :class="{ 'plan-detail__stat--warn': stats.repeatedVerses > 0 }">
            <div class="plan-detail__stat-value">
              {{ n(stats.repeatedVerses) }}
            </div>
            <div class="plan-detail__stat-label">
              {{ t('repeated_verses') }}
            </div>
          </div>
          <div class="plan-detail__stat">
            <div class="plan-detail__stat-value">
              {{ n(stats.dayCount) }}
            </div>
            <div class="plan-detail__stat-label">
              {{ t('days') }}
            </div>
          </div>
        </div>

        <!-- Bible coverage -->
        <div class="plan-detail__section">
          <h3 class="mbl-title mbl-title--5">
            {{ t('bible_coverage') }}
          </h3>
          <div class="plan-detail__coverage" data-testid="plan-coverage">
            <segment-bar :thick="true" :segments="coverageSegments" />
            <div class="plan-detail__coverage-pct">
              {{ n(coveragePercent / 100, 'percent') }}
            </div>
          </div>
        </div>

        <!-- Tracker -->
        <div class="plan-detail__section" data-testid="plan-tracker-section">
          <h3 class="mbl-title mbl-title--5">
            {{ t('tracker') }}
          </h3>
          <div v-if="activeTracker" class="mbl-message mbl-message--info">
            <div class="mbl-message__body">
              <p>{{ t('tracking_since', { date: activeTracker.startDate }) }}</p>
              <button class="mbl-button mbl-button--light" data-testid="stop-tracker-button" @click="stopTracker">
                {{ t('stop_tracker') }}
              </button>
            </div>
          </div>
          <div v-else>
            <p class="plan-detail__hint">
              {{ t('tracker_hint') }}
            </p>
            <button
              class="mbl-button mbl-button--primary"
              :disabled="!stats.passageCount || startingTracker"
              data-testid="start-tracker-button"
              @click="startTracker"
            >
              {{ t('start_tracker') }}
            </button>
          </div>
        </div>

        <!-- Days -->
        <div class="plan-detail__section">
          <h3 class="mbl-title mbl-title--5">
            {{ t('days') }}
          </h3>
          <div class="plan-detail__days" role="list" data-testid="plan-days">
            <div
              v-for="(day, dayIndex) in plan.days"
              :key="`day-${dayIndex}-${day.passages.length}`"
              class="plan-detail__day"
              role="listitem"
              data-testid="plan-day"
            >
              <div class="plan-detail__day-header">
                <span class="plan-detail__day-title">{{ t('day_label', { number: dayIndex + 1 }) }}</span>
                <button
                  class="mbl-button mbl-button--light plan-detail__day-remove"
                  :aria-label="t('remove_day')"
                  data-testid="remove-day-button"
                  @click="removeDay(dayIndex)"
                >
                  &times;
                </button>
              </div>
              <div class="plan-detail__passages" role="list" data-testid="plan-day-passages">
                <div
                  v-for="(passage, passageIndex) in day.passages"
                  :key="`${dayIndex}-${passageIndex}-${passage.startVerseId}-${passage.endVerseId}`"
                  class="plan-detail__passage"
                  role="listitem"
                >
                  <span class="plan-detail__passage-ref">{{ displayRange(passage) }}</span>
                  <span
                    v-if="repeatedKeys.has(`${dayIndex}:${passageIndex}`)"
                    class="plan-detail__repeat-flag"
                    data-testid="repeated-flag"
                    :title="t('repeated_hint')"
                  >{{ t('repeated') }}</span>
                  <button
                    class="mbl-button mbl-button--light plan-detail__passage-remove"
                    :aria-label="t('remove')"
                    data-testid="remove-passage-button"
                    @click="removePassage(dayIndex, passageIndex)"
                  >
                    &times;
                  </button>
                </div>
                <p v-if="!day.passages.length" class="plan-detail__hint">
                  {{ t('no_passages_in_day') }}
                </p>
              </div>
              <div v-if="!atPassageLimit" class="plan-detail__add">
                <template v-if="addPassageDayIndex === dayIndex">
                  <label class="mbl-label">{{ t('add_passage') }}</label>
                  <passage-selector
                    :key="passageSelectorKey"
                    data-testid="plan-passage-selector"
                    @change="addPassage(dayIndex, $event)"
                  />
                </template>
                <button
                  v-else
                  class="mbl-button mbl-button--light"
                  data-testid="add-passage-button"
                  @click="addPassageDayIndex = dayIndex"
                >
                  {{ t('add_passage') }}
                </button>
              </div>
            </div>
            <p v-if="!plan.days.length" class="plan-detail__hint">
              {{ t('no_days') }}
            </p>
          </div>

          <div
            v-if="atPassageLimit"
            class="mbl-message mbl-message--info"
            data-testid="passage-limit-message"
          >
            <div class="mbl-message__body">
              {{ t('passage_limit_message', { count: passageLimit }) }}
            </div>
          </div>
          <div
            v-if="atDayLimit"
            class="mbl-message mbl-message--info"
            data-testid="day-limit-message"
          >
            <div class="mbl-message__body">
              {{ t('day_limit_message', { count: dayLimit }) }}
            </div>
          </div>
          <button
            v-else
            class="mbl-button mbl-button--primary plan-detail__add-day"
            data-testid="add-day-button"
            @click="addDay"
          >
            {{ t('add_day') }}
          </button>
        </div>
      </template>

      <template #fallback>
        <skeleton-loader :count="2" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import {
  Bible,
  MAX_DAYS_PER_PLAN,
  MAX_PASSAGES_PER_PLAN,
  computeReadingPlanStats,
  flattenPlanDays,
  type ReadingPlan,
} from '@mybiblelog/shared';
import type { Segment } from '@mybiblelog/shared';
import SegmentBar from '~/components/bible/SegmentBar.vue';
import PassageSelector from '~/components/forms/PassageSelector.vue';
import SkeletonLoader from '~/components/ui/SkeletonLoader.vue';
import LogEntry from '~/components/log/LogEntry.vue';
import { useReadingPlansStore } from '~/stores/reading-plans';
import { usePlanTrackersStore } from '~/stores/plan-trackers';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';

type Passage = { startVerseId: number; endVerseId: number };
type PlainDay = { passages: Passage[] };

const { t, n, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();

definePageMeta({ middleware: ['auth'] });

const readingPlansStore = useReadingPlansStore();
const planTrackersStore = usePlanTrackersStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();

const planId = computed(() => String(route.params.id));
const loading = ref(true);
const startingTracker = ref(false);
const passageSelectorKey = ref(0);
const addPassageDayIndex = ref<number | null>(null);
const name = ref('');

const plan = computed<ReadingPlan | undefined>(() => readingPlansStore.getPlanById(planId.value));

useHead({ title: () => plan.value?.name ?? t('reading_plans') });

watch(plan, (value) => {
  if (value && name.value === '') { name.value = value.name; }
}, { immediate: true });

const stats = computed(() => computeReadingPlanStats(plan.value?.days ?? []));
const repeatedKeys = computed(() => new Set(
  stats.value.repeatedPassagePositions.map(pos => `${pos.dayIndex}:${pos.passageIndex}`),
));

const totalBibleVerses = Bible.getTotalVerseCount();
const coverageSegments = computed(() => {
  const passages = flattenPlanDays(plan.value?.days ?? []);
  const segments = Bible.generateBibleSegments(passages) as Segment[];
  return segments.map(segment => ({
    ...segment,
    percentage: segment.verseCount * 100 / totalBibleVerses,
  }));
});
const coveragePercent = computed(() =>
  Math.floor(stats.value.uniqueVerses / totalBibleVerses * 100),
);

const dayLimit = MAX_DAYS_PER_PLAN;
const passageLimit = MAX_PASSAGES_PER_PLAN;
const atDayLimit = computed(() => stats.value.dayCount >= MAX_DAYS_PER_PLAN);
const atPassageLimit = computed(() => stats.value.passageCount >= MAX_PASSAGES_PER_PLAN);

const activeTracker = computed(() => planTrackersStore.activeTrackerForPlan(planId.value));

const displayRange = (passage: Passage) =>
  Bible.displayVerseRange(passage.startVerseId, passage.endVerseId, locale.value);

/** The plan's days stripped to the plain wire shape (no subdocument ids). */
const toPlainDays = (): PlainDay[] =>
  (plan.value?.days ?? []).map(day => ({
    passages: day.passages.map(p => ({ startVerseId: p.startVerseId, endVerseId: p.endVerseId })),
  }));

const persistDays = async (days: PlainDay[]) => {
  if (!plan.value) { return; }
  try {
    await readingPlansStore.updateReadingPlan({ id: plan.value.id, name: plan.value.name, days });
  }
  catch {
    toastStore.add({ type: 'error', text: t('could_not_save') });
  }
};

const addDay = async () => {
  if (!plan.value || atDayLimit.value) { return; }
  const days = [...toPlainDays(), { passages: [] }];
  await persistDays(days);
  // Open the new day's passage selector so it is ready to fill.
  addPassageDayIndex.value = days.length - 1;
};

const removeDay = async (dayIndex: number) => {
  if (!plan.value) { return; }
  await persistDays(toPlainDays().filter((_, i) => i !== dayIndex));
  addPassageDayIndex.value = null;
};

const addPassage = async (dayIndex: number, passage: Passage) => {
  if (!plan.value || atPassageLimit.value) { return; }
  const days = toPlainDays();
  if (!days[dayIndex]) { return; }
  days[dayIndex]!.passages.push(passage);
  await persistDays(days);
  // Reset the selector so it is ready for the next passage.
  passageSelectorKey.value++;
};

const removePassage = async (dayIndex: number, passageIndex: number) => {
  if (!plan.value) { return; }
  const days = toPlainDays();
  if (!days[dayIndex]) { return; }
  days[dayIndex]!.passages = days[dayIndex]!.passages.filter((_, i) => i !== passageIndex);
  await persistDays(days);
};

const saveName = async () => {
  if (!plan.value) { return; }
  const trimmed = name.value.trim();
  if (!trimmed || trimmed === plan.value.name) {
    name.value = plan.value.name;
    return;
  }
  try {
    await readingPlansStore.updateReadingPlan({
      id: plan.value.id,
      name: trimmed,
      days: toPlainDays(),
    });
  }
  catch {
    toastStore.add({ type: 'error', text: t('could_not_save') });
  }
};

const startTracker = async () => {
  if (!plan.value) { return; }
  startingTracker.value = true;
  try {
    await planTrackersStore.createPlanTracker({
      planId: plan.value.id,
      startDate: dayjs().format('YYYY-MM-DD'),
    });
  }
  catch {
    toastStore.add({ type: 'error', text: t('could_not_start_tracker') });
  }
  finally {
    startingTracker.value = false;
  }
};

const stopTracker = async () => {
  if (!activeTracker.value) { return; }
  const confirmed = await dialogStore.confirm({
    message: t('confirm_stop_tracker'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await planTrackersStore.deletePlanTracker(activeTracker.value.id);
  if (!success) {
    toastStore.add({ type: 'error', text: t('could_not_stop_tracker') });
  }
};

const deletePlan = async () => {
  if (!plan.value) { return; }
  const confirmed = await dialogStore.confirm({
    message: t('confirm_delete'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  const success = await readingPlansStore.deleteReadingPlan(plan.value.id);
  if (success) {
    await router.push(localePath('/reading-plans'));
  }
  else {
    toastStore.add({ type: 'error', text: t('could_not_delete') });
  }
};

onMounted(async () => {
  try {
    const tasks: Promise<unknown>[] = [];
    if (!readingPlansStore.isLoaded) { tasks.push(readingPlansStore.loadReadingPlans()); }
    if (!planTrackersStore.isLoaded) { tasks.push(planTrackersStore.loadPlanTrackers()); }
    await Promise.all(tasks);
    if (plan.value) { name.value = plan.value.name; }
  }
  finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.plan-detail__back {
  margin-bottom: 1rem;
}

.plan-detail__name {
  font-size: 1.25rem;
  font-weight: bold;
  flex: 1;
  margin-right: 1rem;
}

.plan-detail__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.plan-detail__stat {
  background: var(--mbl-bg-elevated);
  border-radius: var(--mbl-radius-card);
  box-shadow: var(--mbl-shadow-elev-1);
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.plan-detail__stat--warn .plan-detail__stat-value {
  color: var(--mbl-warning);
}

.plan-detail__stat-value {
  font-size: 1.25rem;
  font-weight: bold;
}

.plan-detail__stat-label {
  font-size: 0.75rem;
  color: var(--mbl-text-subtle);
  margin-top: 0.25rem;
}

.plan-detail__section {
  margin: 1.5rem 0;
}

.plan-detail__coverage {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.plan-detail__coverage :deep(.segment-bar) {
  flex: 1;
}

.plan-detail__coverage-pct {
  font-weight: bold;
  min-width: 3rem;
  text-align: right;
}

.plan-detail__days {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.plan-detail__day {
  background: var(--mbl-bg-elevated);
  border-radius: var(--mbl-radius-card);
  box-shadow: var(--mbl-shadow-elev-1);
  padding: 0.75rem;
}

.plan-detail__day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.plan-detail__day-title {
  font-weight: bold;
}

.plan-detail__day-remove {
  padding: 0 0.5rem;
}

.plan-detail__passages {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.plan-detail__passage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--mbl-bg);
  border-radius: var(--mbl-radius);
}

.plan-detail__passage-ref {
  flex: 1;
}

.plan-detail__repeat-flag {
  font-size: 0.7rem;
  color: var(--mbl-on-accent);
  background: var(--mbl-warning);
  padding: 0.1em 0.5em;
  border-radius: 0.5em;
}

.plan-detail__passage-remove {
  padding: 0 0.5rem;
}

.plan-detail__add-day {
  margin-top: 0.25rem;
}

.plan-detail__hint {
  color: var(--mbl-text-subtle);
  font-size: 0.9rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "reading_plans": "Reading Plans",
    "back_to_plans": "← All Plans",
    "not_found": "Reading plan not found.",
    "plan_name": "Plan name",
    "delete": "Delete",
    "unique_verses": "Unique verses",
    "total_verses": "Total verses",
    "repeated_verses": "Repeated verses",
    "days": "Days",
    "bible_coverage": "Bible Coverage",
    "tracker": "Tracker",
    "tracking_since": "Tracking since {date}.",
    "stop_tracker": "Stop Tracking",
    "tracker_hint": "Start a tracker to get your next day of this plan suggested on your Today page.",
    "start_tracker": "Start Tracker",
    "day_label": "Day {number}",
    "add_day": "Add Day",
    "remove_day": "Remove day",
    "no_days": "No days yet. Add one below.",
    "no_passages_in_day": "No passages yet.",
    "repeated": "Repeat",
    "repeated_hint": "This passage overlaps an earlier passage in the plan.",
    "remove": "Remove",
    "add_passage": "Add a passage",
    "day_limit_message": "You can only have {count} days per plan. Delete some if you need to make room.",
    "passage_limit_message": "You can only have {count} passages per plan. Delete some if you need to make room.",
    "confirm_stop_tracker": "Stop tracking this plan? Your reading log is not affected.",
    "confirm_delete": "Delete this reading plan? This cannot be undone.",
    "could_not_save": "Your changes could not be saved.",
    "could_not_start_tracker": "The tracker could not be started.",
    "could_not_stop_tracker": "The tracker could not be stopped.",
    "could_not_delete": "The reading plan could not be deleted."
  },
  "de": {
    "reading_plans": "Lesepläne",
    "back_to_plans": "← Alle Pläne",
    "not_found": "Leseplan nicht gefunden.",
    "plan_name": "Planname",
    "delete": "Löschen",
    "unique_verses": "Eindeutige Verse",
    "total_verses": "Verse gesamt",
    "repeated_verses": "Wiederholte Verse",
    "days": "Tage",
    "bible_coverage": "Bibelabdeckung",
    "tracker": "Tracker",
    "tracking_since": "Wird seit {date} verfolgt.",
    "stop_tracker": "Verfolgung stoppen",
    "tracker_hint": "Starten Sie einen Tracker, um den nächsten Tag dieses Plans auf Ihrer Heute-Seite vorgeschlagen zu bekommen.",
    "start_tracker": "Tracker starten",
    "day_label": "Tag {number}",
    "add_day": "Tag hinzufügen",
    "remove_day": "Tag entfernen",
    "no_days": "Noch keine Tage. Fügen Sie unten einen hinzu.",
    "no_passages_in_day": "Noch keine Abschnitte.",
    "repeated": "Wiederholung",
    "repeated_hint": "Dieser Abschnitt überschneidet sich mit einem früheren Abschnitt im Plan.",
    "remove": "Entfernen",
    "add_passage": "Abschnitt hinzufügen",
    "day_limit_message": "Sie können nur {count} Tage pro Plan haben. Löschen Sie einige, um Platz zu schaffen.",
    "passage_limit_message": "Sie können nur {count} Abschnitte pro Plan haben. Löschen Sie einige, um Platz zu schaffen.",
    "confirm_stop_tracker": "Verfolgung dieses Plans stoppen? Ihr Leseprotokoll ist nicht betroffen.",
    "confirm_delete": "Diesen Leseplan löschen? Dies kann nicht rückgängig gemacht werden.",
    "could_not_save": "Ihre Änderungen konnten nicht gespeichert werden.",
    "could_not_start_tracker": "Der Tracker konnte nicht gestartet werden.",
    "could_not_stop_tracker": "Der Tracker konnte nicht gestoppt werden.",
    "could_not_delete": "Der Leseplan konnte nicht gelöscht werden."
  },
  "es": {
    "reading_plans": "Planes de lectura",
    "back_to_plans": "← Todos los planes",
    "not_found": "Plan de lectura no encontrado.",
    "plan_name": "Nombre del plan",
    "delete": "Borrar",
    "unique_verses": "Versículos únicos",
    "total_verses": "Versículos totales",
    "repeated_verses": "Versículos repetidos",
    "days": "Días",
    "bible_coverage": "Cobertura bíblica",
    "tracker": "Rastreador",
    "tracking_since": "Siguiendo desde {date}.",
    "stop_tracker": "Dejar de seguir",
    "tracker_hint": "Inicia un rastreador para que el siguiente día de este plan aparezca sugerido en tu página de Hoy.",
    "start_tracker": "Iniciar rastreador",
    "day_label": "Día {number}",
    "add_day": "Añadir día",
    "remove_day": "Quitar día",
    "no_days": "Aún no hay días. Añade uno abajo.",
    "no_passages_in_day": "Aún no hay pasajes.",
    "repeated": "Repetido",
    "repeated_hint": "Este pasaje se superpone con un pasaje anterior del plan.",
    "remove": "Quitar",
    "add_passage": "Añadir un pasaje",
    "day_limit_message": "Solo puedes tener {count} días por plan. Elimina algunos si necesitas hacer espacio.",
    "passage_limit_message": "Solo puedes tener {count} pasajes por plan. Elimina algunos si necesitas hacer espacio.",
    "confirm_stop_tracker": "¿Dejar de seguir este plan? Tu registro de lectura no se ve afectado.",
    "confirm_delete": "¿Borrar este plan de lectura? Esto no se puede deshacer.",
    "could_not_save": "No se pudieron guardar los cambios.",
    "could_not_start_tracker": "No se pudo iniciar el rastreador.",
    "could_not_stop_tracker": "No se pudo detener el rastreador.",
    "could_not_delete": "No se pudo borrar el plan de lectura."
  },
  "fr": {
    "reading_plans": "Plans de lecture",
    "back_to_plans": "← Tous les plans",
    "not_found": "Plan de lecture introuvable.",
    "plan_name": "Nom du plan",
    "delete": "Supprimer",
    "unique_verses": "Versets uniques",
    "total_verses": "Versets au total",
    "repeated_verses": "Versets répétés",
    "days": "Jours",
    "bible_coverage": "Couverture biblique",
    "tracker": "Suivi",
    "tracking_since": "Suivi depuis le {date}.",
    "stop_tracker": "Arrêter le suivi",
    "tracker_hint": "Démarrez un suivi pour voir le prochain jour de ce plan suggéré sur votre page Aujourd'hui.",
    "start_tracker": "Démarrer le suivi",
    "day_label": "Jour {number}",
    "add_day": "Ajouter un jour",
    "remove_day": "Retirer le jour",
    "no_days": "Aucun jour pour le moment. Ajoutez-en un ci-dessous.",
    "no_passages_in_day": "Aucun passage pour le moment.",
    "repeated": "Répétition",
    "repeated_hint": "Ce passage chevauche un passage précédent du plan.",
    "remove": "Retirer",
    "add_passage": "Ajouter un passage",
    "day_limit_message": "Vous ne pouvez avoir que {count} jours par plan. Supprimez-en pour faire de la place.",
    "passage_limit_message": "Vous ne pouvez avoir que {count} passages par plan. Supprimez-en pour faire de la place.",
    "confirm_stop_tracker": "Arrêter le suivi de ce plan ? Votre journal de lecture n'est pas affecté.",
    "confirm_delete": "Supprimer ce plan de lecture ? Cette action est irréversible.",
    "could_not_save": "Vos modifications n'ont pas pu être enregistrées.",
    "could_not_start_tracker": "Le suivi n'a pas pu être démarré.",
    "could_not_stop_tracker": "Le suivi n'a pas pu être arrêté.",
    "could_not_delete": "Le plan de lecture n'a pas pu être supprimé."
  },
  "ko": {
    "reading_plans": "읽기 계획",
    "back_to_plans": "← 모든 계획",
    "not_found": "읽기 계획을 찾을 수 없습니다.",
    "plan_name": "계획 이름",
    "delete": "삭제",
    "unique_verses": "고유 구절",
    "total_verses": "전체 구절",
    "repeated_verses": "중복 구절",
    "days": "일수",
    "bible_coverage": "성경 범위",
    "tracker": "추적기",
    "tracking_since": "{date}부터 추적 중.",
    "stop_tracker": "추적 중지",
    "tracker_hint": "추적기를 시작하면 오늘 페이지에 이 계획의 다음 일차가 제안됩니다.",
    "start_tracker": "추적 시작",
    "day_label": "{number}일차",
    "add_day": "일차 추가",
    "remove_day": "일차 제거",
    "no_days": "아직 일차가 없습니다. 아래에서 추가하세요.",
    "no_passages_in_day": "아직 구절이 없습니다.",
    "repeated": "중복",
    "repeated_hint": "이 구절은 계획의 이전 구절과 겹칩니다.",
    "remove": "제거",
    "add_passage": "구절 추가",
    "day_limit_message": "계획당 일차는 최대 {count}개까지 가능합니다. 공간이 필요하면 일부를 삭제하세요.",
    "passage_limit_message": "계획당 구절은 최대 {count}개까지 가능합니다. 공간이 필요하면 일부를 삭제하세요.",
    "confirm_stop_tracker": "이 계획 추적을 중지할까요? 읽기 기록에는 영향이 없습니다.",
    "confirm_delete": "이 읽기 계획을 삭제할까요? 되돌릴 수 없습니다.",
    "could_not_save": "변경 사항을 저장할 수 없습니다.",
    "could_not_start_tracker": "추적기를 시작할 수 없습니다.",
    "could_not_stop_tracker": "추적기를 중지할 수 없습니다.",
    "could_not_delete": "읽기 계획을 삭제할 수 없습니다."
  },
  "pt": {
    "reading_plans": "Planos de leitura",
    "back_to_plans": "← Todos os planos",
    "not_found": "Plano de leitura não encontrado.",
    "plan_name": "Nome do plano",
    "delete": "Excluir",
    "unique_verses": "Versículos únicos",
    "total_verses": "Versículos no total",
    "repeated_verses": "Versículos repetidos",
    "days": "Dias",
    "bible_coverage": "Cobertura bíblica",
    "tracker": "Rastreador",
    "tracking_since": "Acompanhando desde {date}.",
    "stop_tracker": "Parar de acompanhar",
    "tracker_hint": "Inicie um rastreador para ver o próximo dia deste plano sugerido na sua página Hoje.",
    "start_tracker": "Iniciar rastreador",
    "day_label": "Dia {number}",
    "add_day": "Adicionar dia",
    "remove_day": "Remover dia",
    "no_days": "Ainda não há dias. Adicione um abaixo.",
    "no_passages_in_day": "Ainda não há passagens.",
    "repeated": "Repetida",
    "repeated_hint": "Esta passagem se sobrepõe a uma passagem anterior do plano.",
    "remove": "Remover",
    "add_passage": "Adicionar uma passagem",
    "day_limit_message": "Você só pode ter {count} dias por plano. Exclua alguns se precisar de espaço.",
    "passage_limit_message": "Você só pode ter {count} passagens por plano. Exclua algumas se precisar de espaço.",
    "confirm_stop_tracker": "Parar de acompanhar este plano? Seu registro de leitura não é afetado.",
    "confirm_delete": "Excluir este plano de leitura? Isso não pode ser desfeito.",
    "could_not_save": "Suas alterações não puderam ser salvas.",
    "could_not_start_tracker": "O rastreador não pôde ser iniciado.",
    "could_not_stop_tracker": "O rastreador não pôde ser parado.",
    "could_not_delete": "O plano de leitura não pôde ser excluído."
  },
  "uk": {
    "reading_plans": "Плани читання",
    "back_to_plans": "← Усі плани",
    "not_found": "План читання не знайдено.",
    "plan_name": "Назва плану",
    "delete": "Видалити",
    "unique_verses": "Унікальні вірші",
    "total_verses": "Усього віршів",
    "repeated_verses": "Повторені вірші",
    "days": "Дні",
    "bible_coverage": "Охоплення Біблії",
    "tracker": "Трекер",
    "tracking_since": "Відстежується з {date}.",
    "stop_tracker": "Зупинити відстеження",
    "tracker_hint": "Запустіть трекер, щоб наступний день цього плану пропонувався на вашій сторінці «Сьогодні».",
    "start_tracker": "Запустити трекер",
    "day_label": "День {number}",
    "add_day": "Додати день",
    "remove_day": "Видалити день",
    "no_days": "Ще немає днів. Додайте один нижче.",
    "no_passages_in_day": "Ще немає уривків.",
    "repeated": "Повтор",
    "repeated_hint": "Цей уривок перетинається з попереднім уривком у плані.",
    "remove": "Видалити",
    "add_passage": "Додати уривок",
    "day_limit_message": "Ви можете мати лише {count} днів на план. Видаліть деякі, щоб звільнити місце.",
    "passage_limit_message": "Ви можете мати лише {count} уривків на план. Видаліть деякі, щоб звільнити місце.",
    "confirm_stop_tracker": "Зупинити відстеження цього плану? Ваш журнал читання не зміниться.",
    "confirm_delete": "Видалити цей план читання? Це неможливо скасувати.",
    "could_not_save": "Не вдалося зберегти зміни.",
    "could_not_start_tracker": "Не вдалося запустити трекер.",
    "could_not_stop_tracker": "Не вдалося зупинити трекер.",
    "could_not_delete": "Не вдалося видалити план читання."
  }
}
</i18n>
