<template>
  <div class="trend">
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
        <label class="mbl-label" for="trend-granularity">{{ t('granularity') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="trend-granularity" v-model="granularity">
            <option value="weekly">
              {{ t('weekly') }}
            </option>
            <option value="daily">
              {{ t('daily') }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <svg
      class="trend__svg"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="granularity === 'weekly' ? t('chart_label_weekly') : t('chart_label_daily')"
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
      <polyline class="trend__line" :points="linePoints" />

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
  computeWeeklyVerseSeries,
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

// Weekly summarizes reading trends without the chart dropping to zero on any
// single day without reading, so it's the default view; daily remains
// available for a closer look at a shorter window.
const granularity = ref<'daily' | 'weekly'>('weekly');

const { width, height, padLeft, padRight } = DEFAULT_CHART_DIMENSIONS;

type SeriesPoint = {
  date: string;
  count: number;
  /** The bucket's last day, present only for a weekly (multi-day) point. */
  endDate?: string;
};

// A normalized `{ date, count, endDate? }` series: `date` feeds the chart
// geometry directly, and `endDate` (weekly only) is used to label each
// point's tooltip with the full week range.
const series = computed<SeriesPoint[]>(() => {
  if (granularity.value === 'weekly') {
    const weeks = Math.max(1, Math.round(days.value / 7));
    return computeWeeklyVerseSeries(props.entries as InsightsLogEntry[], weeks).map(w => ({
      date: w.weekStart,
      count: w.count,
      endDate: w.weekEnd,
    }));
  }
  return computeDailyVerseSeries(props.entries as InsightsLogEntry[], days.value);
});

const geometry = computed(() => buildLineChartGeometry(series.value));

const showPoints = computed(() => series.value.length <= 60);

// Decorate the framework-agnostic geometry points with a localized tooltip.
// `geometry.points` preserves the order of `series`, so points can be zipped
// by index rather than re-matched by date.
const points = computed(() => geometry.value.points.map((p, i) => {
  const src = series.value[i];
  const dateLabel = src?.endDate
    ? `${dayjs(p.date).locale(locale.value).format('MMM D')} – ${dayjs(src.endDate).locale(locale.value).format('MMM D')}`
    : dayjs(p.date).locale(locale.value).format('LL');
  return {
    ...p,
    title: `${t('verses_read', { count: p.count })} — ${dateLabel}`,
  };
}));

const linePoints = computed(() => geometry.value.linePoints);

const areaPath = computed(() => geometry.value.areaPath);

const yTicks = computed(() => geometry.value.yTicks);

const firstLabel = computed(() => {
  const first = series.value[0];
  return first ? dayjs(first.date).locale(locale.value).format('MMM D') : '';
});

const lastLabel = computed(() => {
  const last = series.value[series.value.length - 1];
  if (!last) { return ''; }
  return dayjs(last.endDate ?? last.date).locale(locale.value).format('MMM D');
});
</script>

<style scoped>
.trend__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-xl);
}

.trend__control {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-2xs);
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
    "last_n_days": "Last {count} days",
    "granularity": "View",
    "daily": "Daily",
    "weekly": "Weekly",
    "chart_label_daily": "Verses read per day",
    "chart_label_weekly": "Verses read per week",
    "verses_read": "{count} verse read | {count} verses read"
  },
  "de": {
    "window": "Zeitfenster",
    "last_n_days": "Letzte {count} Tage",
    "granularity": "Ansicht",
    "daily": "Täglich",
    "weekly": "Wöchentlich",
    "chart_label_daily": "Verse pro Tag gelesen",
    "chart_label_weekly": "Verse pro Woche gelesen",
    "verses_read": "{count} Vers gelesen | {count} Verse gelesen"
  },
  "es": {
    "window": "Ventana de tiempo",
    "last_n_days": "Últimos {count} días",
    "granularity": "Vista",
    "daily": "Diario",
    "weekly": "Semanal",
    "chart_label_daily": "Versículos leídos por día",
    "chart_label_weekly": "Versículos leídos por semana",
    "verses_read": "{count} versículo leído | {count} versículos leídos"
  },
  "fr": {
    "window": "Fenêtre de temps",
    "last_n_days": "{count} derniers jours",
    "granularity": "Affichage",
    "daily": "Quotidien",
    "weekly": "Hebdomadaire",
    "chart_label_daily": "Versets lus par jour",
    "chart_label_weekly": "Versets lus par semaine",
    "verses_read": "{count} verset lu | {count} versets lus"
  },
  "ko": {
    "window": "기간",
    "last_n_days": "최근 {count}일",
    "granularity": "보기",
    "daily": "일별",
    "weekly": "주별",
    "chart_label_daily": "하루에 읽은 구절",
    "chart_label_weekly": "주간 읽은 구절",
    "verses_read": "{count}개 구절 읽음"
  },
  "pt": {
    "window": "Janela de tempo",
    "last_n_days": "Últimos {count} dias",
    "granularity": "Visualização",
    "daily": "Diário",
    "weekly": "Semanal",
    "chart_label_daily": "Versículos lidos por dia",
    "chart_label_weekly": "Versículos lidos por semana",
    "verses_read": "{count} versículo lido | {count} versículos lidos"
  },
  "uk": {
    "window": "Часовий проміжок",
    "last_n_days": "Останні {count} днів",
    "granularity": "Перегляд",
    "daily": "Щодня",
    "weekly": "Щотижня",
    "chart_label_daily": "Віршів прочитано за день",
    "chart_label_weekly": "Віршів прочитано за тиждень",
    "verses_read": "{count} вірш прочитано | {count} віршів прочитано"
  }
}
</i18n>
