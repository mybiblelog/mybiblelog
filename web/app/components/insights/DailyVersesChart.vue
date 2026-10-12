<template>
  <div class="trend mbl-box">
    <div class="trend__controls">
      <div class="trend__control">
        <label class="mbl-label" for="trend-window">{{ t('window') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="trend-window" v-model.number="days">
            <option v-for="opt in windowOptions" :key="opt" :value="opt">
              {{ t('last_n_days', { count: opt }) }}
            </option>
          </select>
        </div>
      </div>

      <div class="trend__control">
        <label class="mbl-label" for="trend-metric">{{ t('metric') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="trend-metric" v-model="metric">
            <option v-for="opt in metricOptions" :key="opt.value" :value="opt.value">
              {{ t(opt.label) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <svg
      class="trend__svg"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="t(averageWindow > 1 ? 'chart_label_avg' : 'chart_label')"
    >
      <!-- horizontal gridlines -->
      <line
        v-for="tick in yTicks"
        :key="`g-${tick.value}`"
        class="trend__gridline"
        :x1="padLeft"
        :y1="tick.y"
        :x2="width - padRight"
        :y2="tick.y"
      />
      <!-- y-axis labels -->
      <text
        v-for="tick in yTicks"
        :key="`t-${tick.value}`"
        class="trend__axis-text"
        :x="padLeft - 6"
        :y="tick.y + 3"
        text-anchor="end"
      >
        {{ tick.value }}
      </text>

      <!-- area + line -->
      <path class="trend__area" :d="areaPath" />
      <path class="trend__line" :d="linePath" />

      <!-- points (only when not too dense) -->
      <template v-if="showPoints">
        <circle
          v-for="pt in points"
          :key="pt.date"
          class="trend__point"
          :cx="pt.x"
          :cy="pt.y"
          r="2.5"
        >
          <title>{{ pt.title }}</title>
        </circle>
      </template>

      <!-- x-axis end labels -->
      <text class="trend__axis-text" :x="padLeft" :y="height - 4" text-anchor="start">
        {{ firstLabel }}
      </text>
      <text class="trend__axis-text" :x="width - padRight" :y="height - 4" text-anchor="end">
        {{ lastLabel }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {
  DEFAULT_CHART_DIMENSIONS,
  buildLineChartGeometry,
  computeDailyVerseSeries,
  type InsightsLogEntry,
} from '@mybiblelog/shared';

dayjs.extend(localizedFormat);

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const { locale, t } = useI18n();

const windowOptions = [7, 14, 30, 60, 90, 180, 365];
const days = ref(30);

const { width, height, padLeft, padRight } = DEFAULT_CHART_DIMENSIONS;

const metricOptions = [
  { value: 'daily', label: 'metric_daily', window: 1 },
  { value: 'avg3', label: 'metric_avg3', window: 3 },
  { value: 'avg7', label: 'metric_avg7', window: 7 },
];
const metric = ref('daily');
const averageWindow = computed(() => metricOptions.find(o => o.value === metric.value)?.window ?? 1);

const series = computed(() => computeDailyVerseSeries(
  props.entries as InsightsLogEntry[],
  days.value,
  undefined,
  averageWindow.value,
));

const geometry = computed(() => buildLineChartGeometry(series.value));

const showPoints = computed(() => series.value.length <= 60);

const pointLabel = (count: number) => (averageWindow.value > 1
  ? t('avg_verses_per_day', { count: Math.round(count * 10) / 10 })
  : t('verses_read', { count }));

// Decorate the framework-agnostic geometry points with a localized tooltip.
const points = computed(() => geometry.value.points.map(p => ({
  ...p,
  title: `${pointLabel(p.count)} — ${dayjs(p.date).locale(locale.value).format('LL')}`,
})));

const linePath = computed(() => geometry.value.linePath);

const areaPath = computed(() => geometry.value.areaPath);

const yTicks = computed(() => geometry.value.yTicks);

const firstLabel = computed(() => {
  const first = series.value[0];
  return first ? dayjs(first.date).locale(locale.value).format('MMM D') : '';
});

const lastLabel = computed(() => {
  const last = series.value[series.value.length - 1];
  return last ? dayjs(last.date).locale(locale.value).format('MMM D') : '';
});
</script>

<style scoped>
.trend__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mbl-space-xs) var(--mbl-space-lg);
  margin-bottom: var(--mbl-space-xl);
}

.trend__control {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

.trend__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.trend__gridline {
  stroke: var(--mbl-border-soft);
  stroke-width: 1;
}

.trend__axis-text {
  fill: var(--mbl-text-muted);
  font-size: 11px;
}

.trend__area {
  fill: var(--mbl-success);
  opacity: 0.12;
}

.trend__line {
  fill: none;
  stroke: var(--mbl-success);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.trend__point {
  fill: var(--mbl-success);
}
</style>

<i18n lang="json">
{
  "en": {
    "window": "Time window",
    "metric": "Show",
    "metric_daily": "Daily reading",
    "metric_avg3": "3-day average",
    "metric_avg7": "7-day average",
    "chart_label_avg": "Average verses read per day",
    "avg_verses_per_day": "{count} verses/day (average)",
    "last_n_days": "Last {count} days",
    "chart_label": "Verses read per day",
    "verses_read": "{count} verse read | {count} verses read"
  },
  "de": {
    "window": "Zeitfenster",
    "metric": "Anzeige",
    "metric_daily": "Tägliches Lesen",
    "metric_avg3": "3-Tage-Durchschnitt",
    "metric_avg7": "7-Tage-Durchschnitt",
    "chart_label_avg": "Durchschnittlich gelesene Verse pro Tag",
    "avg_verses_per_day": "{count} Verse/Tag (Durchschnitt)",
    "last_n_days": "Letzte {count} Tage",
    "chart_label": "Verse pro Tag gelesen",
    "verses_read": "{count} Vers gelesen | {count} Verse gelesen"
  },
  "es": {
    "window": "Ventana de tiempo",
    "metric": "Mostrar",
    "metric_daily": "Lectura diaria",
    "metric_avg3": "Promedio de 3 días",
    "metric_avg7": "Promedio de 7 días",
    "chart_label_avg": "Promedio de versículos leídos por día",
    "avg_verses_per_day": "{count} versículos/día (promedio)",
    "last_n_days": "Últimos {count} días",
    "chart_label": "Versículos leídos por día",
    "verses_read": "{count} versículo leído | {count} versículos leídos"
  },
  "fr": {
    "window": "Fenêtre de temps",
    "metric": "Afficher",
    "metric_daily": "Lecture quotidienne",
    "metric_avg3": "Moyenne sur 3 jours",
    "metric_avg7": "Moyenne sur 7 jours",
    "chart_label_avg": "Moyenne de versets lus par jour",
    "avg_verses_per_day": "{count} versets/jour (moyenne)",
    "last_n_days": "{count} derniers jours",
    "chart_label": "Versets lus par jour",
    "verses_read": "{count} verset lu | {count} versets lus"
  },
  "ko": {
    "window": "기간",
    "metric": "표시",
    "metric_daily": "일일 읽기",
    "metric_avg3": "3일 평균",
    "metric_avg7": "7일 평균",
    "chart_label_avg": "하루 평균 읽은 구절",
    "avg_verses_per_day": "하루 평균 {count}개 구절",
    "last_n_days": "최근 {count}일",
    "chart_label": "하루에 읽은 구절",
    "verses_read": "{count}개 구절 읽음"
  },
  "pt": {
    "window": "Janela de tempo",
    "metric": "Mostrar",
    "metric_daily": "Leitura diária",
    "metric_avg3": "Média de 3 dias",
    "metric_avg7": "Média de 7 dias",
    "chart_label_avg": "Média de versículos lidos por dia",
    "avg_verses_per_day": "{count} versículos/dia (média)",
    "last_n_days": "Últimos {count} dias",
    "chart_label": "Versículos lidos por dia",
    "verses_read": "{count} versículo lido | {count} versículos lidos"
  },
  "uk": {
    "window": "Часовий проміжок",
    "metric": "Показати",
    "metric_daily": "Щоденне читання",
    "metric_avg3": "Середнє за 3 дні",
    "metric_avg7": "Середнє за 7 днів",
    "chart_label_avg": "Середня кількість віршів за день",
    "avg_verses_per_day": "{count} віршів/день (середнє)",
    "last_n_days": "Останні {count} днів",
    "chart_label": "Віршів прочитано за день",
    "verses_read": "{count} вірш прочитано | {count} віршів прочитано"
  }
}
</i18n>
