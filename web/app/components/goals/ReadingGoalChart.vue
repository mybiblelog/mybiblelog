<template>
  <div class="goal-chart">
    <svg
      class="goal-chart__svg"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="t('chart_label', { read: versesRead, total: totalVerses })"
      data-testid="reading-goal-chart"
    >
      <!-- horizontal gridlines + y-axis labels -->
      <template v-for="tick in yTicks" :key="`tick-${tick.value}`">
        <line class="goal-chart__gridline" :x1="padLeft" :y1="tick.y" :x2="width - padRight" :y2="tick.y" />
        <text class="goal-chart__axis-text" :x="padLeft - 6" :y="tick.y + 3" text-anchor="end">
          {{ tick.label }}
        </text>
      </template>

      <!-- cumulative verses read, one bar per elapsed day -->
      <rect
        v-for="bar in bars"
        :key="bar.date"
        class="goal-chart__bar"
        :x="bar.x"
        :y="bar.y"
        :width="barWidth"
        :height="bar.height"
        data-testid="reading-goal-chart-bar"
      >
        <title>{{ bar.title }}</title>
      </rect>

      <!-- target pace -->
      <line v-if="targetLine" class="goal-chart__target" v-bind="targetLine" data-testid="reading-goal-chart-target" />
      <!-- projected pace from the average so far -->
      <line v-if="projectionLine" class="goal-chart__projection" v-bind="projectionLine" data-testid="reading-goal-chart-projection" />

      <!-- x-axis end labels -->
      <text class="goal-chart__axis-text" :x="padLeft" :y="height - 4" text-anchor="start">
        {{ formatAxisDate(series[0]?.date) }}
      </text>
      <text class="goal-chart__axis-text" :x="width - padRight" :y="height - 4" text-anchor="end">
        {{ formatAxisDate(series[series.length - 1]?.date) }}
      </text>
    </svg>
    <ul class="goal-chart__legend mbl-text-small">
      <li><span class="goal-chart__swatch goal-chart__swatch--bar" />{{ t('legend_read') }}</li>
      <li><span class="goal-chart__swatch goal-chart__swatch--target" />{{ t('legend_target') }}</li>
      <li v-if="projectionLine">
        <span class="goal-chart__swatch goal-chart__swatch--projection" />{{ t('legend_projection') }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { DEFAULT_CHART_DIMENSIONS, type GoalChartPoint } from '@mybiblelog/shared';

const props = defineProps<{
  series: GoalChartPoint[];
  totalVerses: number;
  requiredPerDay: number;
  averagePerDay: number;
}>();

const { t, locale, n } = useI18n();

const { width, height, padLeft, padRight, padTop, padBottom } = { ...DEFAULT_CHART_DIMENSIONS, padLeft: 44 };
const innerW = width - padLeft - padRight;
const innerH = height - padTop - padBottom;

const dayCount = computed(() => Math.max(1, props.series.length));
const slotWidth = computed(() => innerW / dayCount.value);
const barWidth = computed(() => Math.max(1, slotWidth.value * 0.7));
const total = computed(() => Math.max(1, props.totalVerses));

/** Day `i` (0-based) → x at the center of that day's slot. */
const xAt = (i: number) => padLeft + slotWidth.value * (i + 0.5);
/** Day `i` (0-based, fractional allowed) → x at the end of that day. */
const xEndOf = (i: number) => padLeft + slotWidth.value * (i + 1);
const yAt = (verses: number) => padTop + innerH - (Math.min(verses, total.value) / total.value) * innerH;

const versesRead = computed(() => {
  const read = props.series.filter(p => p.count !== null);
  return read.length ? read[read.length - 1]!.count! : 0;
});

const yTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
  const value = Math.round(total.value * fraction);
  return { value, y: yAt(value), label: n(value, 'grouped') };
}));

const bars = computed(() => props.series.flatMap((point, i) => {
  if (point.count === null) { return []; }
  const y = yAt(point.count);
  return [{
    date: point.date,
    x: xAt(i) - barWidth.value / 2,
    y,
    height: padTop + innerH - y,
    title: `${dayjs(point.date).locale(locale.value).format('LL')}: ${t('verses_read', { count: n(point.count, 'grouped') })}`,
  }];
}));

/**
 * Cumulative verses at a constant pace: 0 at the start of day 0 and
 * rate × (i + 1) at the end of day i, clipped where it reaches the total.
 */
const paceLine = (rate: number) => {
  if (rate <= 0) { return null; }
  const lastDay = Math.min(dayCount.value - 1, total.value / rate - 1);
  return {
    x1: padLeft,
    y1: yAt(0),
    x2: xEndOf(lastDay),
    y2: yAt(rate * (lastDay + 1)),
  };
};

const targetLine = computed(() => paceLine(props.requiredPerDay));
const projectionLine = computed(() => paceLine(props.averagePerDay));

const formatAxisDate = (date?: string) => (date ? dayjs(date).locale(locale.value).format('MMM D') : '');
</script>

<style scoped>
.goal-chart__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.goal-chart__gridline {
  stroke: var(--mbl-border-soft);
  stroke-width: 1;
}

.goal-chart__axis-text {
  fill: var(--mbl-text-muted);
  font-size: 11px;
}

.goal-chart__bar {
  fill: var(--mbl-success);
  opacity: 0.55;
}

.goal-chart__target,
.goal-chart__projection {
  stroke-width: 2;
  stroke-dasharray: 6 5;
  stroke-linecap: round;
}

.goal-chart__target {
  stroke: var(--mbl-text-muted);
}

.goal-chart__projection {
  stroke: var(--mbl-link-bright);
}

.goal-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-xs) var(--mbl-space-lg);
  margin: var(--mbl-space-md) 0 0;
  padding: 0;
  list-style: none;
}

.goal-chart__legend li {
  display: inline-flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.goal-chart__swatch {
  display: inline-block;
  width: 18px;
  height: 0;
  border-top: 2px dashed var(--mbl-text-muted);
}

.goal-chart__swatch--bar {
  height: 10px;
  border: 0;
  background: var(--mbl-success);
  opacity: 0.55;
}

.goal-chart__swatch--projection {
  border-top-color: var(--mbl-link-bright);
}
</style>

<i18n lang="json">
{
  "en": {
    "chart_label": "Reading goal progress: {read} of {total} verses read",
    "legend_read": "Verses read",
    "legend_target": "Target pace",
    "legend_projection": "Your pace so far",
    "verses_read": "{count} verses read"
  },
  "de": {
    "chart_label": "Fortschritt des Leseziels: {read} von {total} Versen gelesen",
    "legend_read": "Gelesene Verse",
    "legend_target": "Zieltempo",
    "legend_projection": "Ihr bisheriges Tempo",
    "verses_read": "{count} Verse gelesen"
  },
  "es": {
    "chart_label": "Progreso de la meta de lectura: {read} de {total} versículos leídos",
    "legend_read": "Versículos leídos",
    "legend_target": "Ritmo objetivo",
    "legend_projection": "Tu ritmo hasta ahora",
    "verses_read": "{count} versículos leídos"
  },
  "fr": {
    "chart_label": "Progression de l'objectif de lecture : {read} versets lus sur {total}",
    "legend_read": "Versets lus",
    "legend_target": "Rythme visé",
    "legend_projection": "Votre rythme jusqu'ici",
    "verses_read": "{count} versets lus"
  },
  "ko": {
    "chart_label": "읽기 목표 진행 상황: {total}절 중 {read}절 읽음",
    "legend_read": "읽은 구절",
    "legend_target": "목표 속도",
    "legend_projection": "지금까지의 속도",
    "verses_read": "{count}절 읽음"
  },
  "pt": {
    "chart_label": "Progresso da meta de leitura: {read} de {total} versículos lidos",
    "legend_read": "Versículos lidos",
    "legend_target": "Ritmo planejado",
    "legend_projection": "Seu ritmo até agora",
    "verses_read": "{count} versículos lidos"
  },
  "uk": {
    "chart_label": "Прогрес мети читання: прочитано {read} з {total} віршів",
    "legend_read": "Прочитані вірші",
    "legend_target": "Цільовий темп",
    "legend_projection": "Ваш темп дотепер",
    "verses_read": "прочитано віршів: {count}"
  }
}
</i18n>
