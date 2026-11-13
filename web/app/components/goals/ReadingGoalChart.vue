<template>
  <figure class="goal-chart" :class="{ 'goal-chart--complete': complete }">
    <div class="goal-chart__plot">
      <span class="goal-chart__y-label goal-chart__y-label--top">{{ $n(totalVerses, 'grouped') }}</span>
      <span class="goal-chart__y-label goal-chart__y-label--bottom">0</span>
      <!-- Stretched to the plot box (strokes don't scale), so every label is HTML and stays legible on a phone. -->
      <svg
        class="goal-chart__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('chart_label', { read: versesRead, total: totalVerses })"
        data-testid="reading-goal-chart"
      >
        <line
          v-for="y in [yAt(0), yAt(total / 2), yAt(total)]"
          :key="y"
          class="goal-chart__gridline"
          x1="0"
          :y1="y"
          x2="100"
          :y2="y"
        />
        <line
          v-if="isPastGoalDate"
          class="goal-chart__goal-date"
          :x1="planEndX"
          y1="0"
          :x2="planEndX"
          y2="100"
        />
        <path class="goal-chart__area" :d="areaPath" />
        <polyline class="goal-chart__target" :points="targetPoints" data-testid="reading-goal-chart-target" />
        <line v-if="projection" class="goal-chart__projection" v-bind="projection" data-testid="reading-goal-chart-projection" />
        <polyline class="goal-chart__line" :points="linePoints" data-testid="reading-goal-chart-line" />
      </svg>
      <span
        v-if="marker"
        class="goal-chart__marker"
        :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
        data-testid="reading-goal-chart-marker"
      />
    </div>
    <div class="goal-chart__x-labels">
      <span>{{ formatDate(series[0]?.date ?? '', 'MMM D') }}</span>
      <span>{{ formatDate(series[series.length - 1]?.date ?? '', 'MMM D') }}</span>
    </div>
    <figcaption class="goal-chart__legend">
      <span><i class="goal-chart__swatch goal-chart__swatch--read" />{{ t('legend_read') }}</span>
      <span><i class="goal-chart__swatch goal-chart__swatch--target" />{{ t('legend_target') }}</span>
      <span v-if="projection"><i class="goal-chart__swatch goal-chart__swatch--projection" />{{ t('legend_projection') }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import type { GoalChartPoint } from '@mybiblelog/shared';

const props = defineProps<{
  series: GoalChartPoint[];
  totalVerses: number;
  /** `YYYY-MM-DD`; the plan line reaches the total at the end of this day. */
  endDate: string;
  averagePerDay: number;
  complete?: boolean;
}>();

const { t } = useI18n();
const formatDate = useLocalizedDate();

const TOP = 6;
const BOTTOM = 96;

const dayCount = computed(() => Math.max(1, props.series.length));
const total = computed(() => Math.max(1, props.totalVerses));

/** The end of day `i` (0-based, fractional allowed); the start of day 0 is x = 0. */
const xEndOf = (i: number) => ((i + 1) / dayCount.value) * 100;
const yAt = (verses: number) => BOTTOM - (Math.min(verses, total.value) / total.value) * (BOTTOM - TOP);
const point = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;

const readPoints = computed(() => props.series.flatMap((p, i) => (p.count === null ? [] : [{ i, count: p.count }])));
const lastRead = computed(() => readPoints.value[readPoints.value.length - 1] ?? null);
const versesRead = computed(() => lastRead.value?.count ?? 0);

const linePoints = computed(() =>
  [point(0, yAt(0)), ...readPoints.value.map(p => point(xEndOf(p.i), yAt(p.count)))].join(' '));

const areaPath = computed(() => {
  if (!lastRead.value) { return ''; }
  return `M${linePoints.value.replaceAll(' ', ' L')} L${point(xEndOf(lastRead.value.i), yAt(0))} Z`;
});

const planEndIndex = computed(() => {
  const index = props.series.findIndex(p => p.date === props.endDate);
  return index === -1 ? dayCount.value - 1 : index;
});
const planEndX = computed(() => xEndOf(planEndIndex.value));
const isPastGoalDate = computed(() => planEndIndex.value < dayCount.value - 1);

const targetPoints = computed(() =>
  [point(0, yAt(0)), point(planEndX.value, yAt(total.value)), point(100, yAt(total.value))].join(' '));

/** From today's point onward at the average pace so far, until it reaches the total or the chart's edge. */
const projection = computed(() => {
  const from = lastRead.value;
  if (props.complete || !from || props.averagePerDay <= 0 || from.i >= dayCount.value - 1) { return null; }
  const daysToFinish = (total.value - from.count) / props.averagePerDay;
  const days = Math.min(daysToFinish, dayCount.value - 1 - from.i);
  return {
    x1: xEndOf(from.i),
    y1: yAt(from.count),
    x2: xEndOf(from.i + days),
    y2: yAt(from.count + props.averagePerDay * days),
  };
});

const marker = computed(() => (lastRead.value
  ? { x: xEndOf(lastRead.value.i), y: yAt(lastRead.value.count) }
  : null));
</script>

<style scoped>
.goal-chart {
  --goal-chart-accent: var(--mbl-link-bright);

  margin: 0;
}

.goal-chart--complete {
  --goal-chart-accent: var(--mbl-success);
}

.goal-chart__plot {
  position: relative;
  height: clamp(140px, 30vw, 200px);
}

.goal-chart__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.goal-chart__svg * {
  vector-effect: non-scaling-stroke;
}

.goal-chart__gridline {
  stroke: var(--mbl-border-soft);
  stroke-width: 1;
}

.goal-chart__goal-date {
  stroke: var(--mbl-border-strong);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}

.goal-chart__area {
  fill: var(--goal-chart-accent);
  opacity: 0.12;
}

.goal-chart__line,
.goal-chart__target,
.goal-chart__projection {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.goal-chart__line {
  stroke: var(--goal-chart-accent);
  stroke-width: 2.5;
}

.goal-chart__target {
  stroke: var(--mbl-text-muted);
  stroke-width: 1.5;
  stroke-dasharray: 6 5;
}

.goal-chart__projection {
  stroke: var(--goal-chart-accent);
  stroke-width: 2;
  stroke-dasharray: 1 5;
}

.goal-chart__marker {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: var(--mbl-radius-circle);
  background: var(--goal-chart-accent);
  box-shadow: var(--mbl-ring-knockout);
  transform: translate(-50%, -50%);
}

.goal-chart__y-label {
  position: absolute;
  left: 0;
  color: var(--mbl-text-muted);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.goal-chart__y-label--top {
  top: 6%;
  transform: translateY(-130%);
}

.goal-chart__y-label--bottom {
  top: 96%;
  transform: translateY(-130%);
}

.goal-chart__x-labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--mbl-space-2xs);
  color: var(--mbl-text-muted);
  font-size: 0.75rem;
}

.goal-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-2xs) var(--mbl-space-lg);
  margin-top: var(--mbl-space-sm);
  color: var(--mbl-text-muted);
  font-size: 0.8rem;
}

.goal-chart__legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.goal-chart__swatch {
  display: inline-block;
  width: 18px;
  border-top: 2px solid var(--goal-chart-accent);
}

.goal-chart__swatch--target {
  border-top: 2px dashed var(--mbl-text-muted);
}

.goal-chart__swatch--projection {
  border-top-style: dotted;
}
</style>

<i18n lang="json">
{
  "en": {
    "chart_label": "Reading goal progress: {read} of {total} verses read",
    "legend_read": "Verses read",
    "legend_target": "Plan",
    "legend_projection": "At your pace"
  },
  "de": {
    "chart_label": "Fortschritt des Leseziels: {read} von {total} Versen gelesen",
    "legend_read": "Gelesene Verse",
    "legend_target": "Plan",
    "legend_projection": "In Ihrem Tempo"
  },
  "es": {
    "chart_label": "Progreso de la meta de lectura: {read} de {total} versículos leídos",
    "legend_read": "Versículos leídos",
    "legend_target": "Plan",
    "legend_projection": "A tu ritmo"
  },
  "fr": {
    "chart_label": "Progression de l'objectif de lecture : {read} versets lus sur {total}",
    "legend_read": "Versets lus",
    "legend_target": "Plan",
    "legend_projection": "À votre rythme"
  },
  "ko": {
    "chart_label": "읽기 목표 진행 상황: {total}절 중 {read}절 읽음",
    "legend_read": "읽은 구절",
    "legend_target": "계획",
    "legend_projection": "현재 속도"
  },
  "pt": {
    "chart_label": "Progresso da meta de leitura: {read} de {total} versículos lidos",
    "legend_read": "Versículos lidos",
    "legend_target": "Plano",
    "legend_projection": "No seu ritmo"
  },
  "uk": {
    "chart_label": "Прогрес мети читання: прочитано {read} з {total} віршів",
    "legend_read": "Прочитані вірші",
    "legend_target": "План",
    "legend_projection": "У вашому темпі"
  }
}
</i18n>
