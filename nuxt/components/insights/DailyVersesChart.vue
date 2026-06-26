<template>
  <div class="trend">
    <div class="trend__controls">
      <label class="mbl-label" for="trend-window">{{ $t('window') }}</label>
      <div class="mbl-select mbl-select--sm">
        <select id="trend-window" v-model.number="days">
          <option v-for="opt in windowOptions" :key="opt" :value="opt">
            {{ $t('last_n_days', { count: opt }) }}
          </option>
        </select>
      </div>
    </div>

    <svg
      class="trend__svg"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="$t('chart_label')"
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
import { computed, getCurrentInstance, ref } from 'vue';
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

const { proxy } = getCurrentInstance()!;
const locale = computed(() => proxy.$i18n.locale);

const windowOptions = [7, 14, 30, 60, 90, 180, 365];
const days = ref(30);

const { width, height, padLeft, padRight } = DEFAULT_CHART_DIMENSIONS;

const series = computed(() => computeDailyVerseSeries(props.entries as InsightsLogEntry[], days.value));

const geometry = computed(() => buildLineChartGeometry(series.value));

const showPoints = computed(() => series.value.length <= 60);

// Decorate the framework-agnostic geometry points with a localized tooltip.
const points = computed(() => geometry.value.points.map(p => ({
  ...p,
  title: `${proxy.$tc('verses_read', p.count, { count: p.count })} — ${dayjs(p.date).locale(locale.value).format('LL')}`,
})));

const linePoints = computed(() => geometry.value.linePoints);

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
  gap: 0.5rem;
  margin-bottom: 1.5rem;
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
  "en": { "window": "Time window", "last_n_days": "Last {count} days", "chart_label": "Verses read per day", "verses_read": "{count} verse read | {count} verses read" },
  "de": { "window": "Zeitfenster", "last_n_days": "Letzte {count} Tage", "chart_label": "Verse pro Tag gelesen", "verses_read": "{count} Vers gelesen | {count} Verse gelesen" },
  "es": { "window": "Ventana de tiempo", "last_n_days": "Últimos {count} días", "chart_label": "Versículos leídos por día", "verses_read": "{count} versículo leído | {count} versículos leídos" },
  "fr": { "window": "Fenêtre de temps", "last_n_days": "{count} derniers jours", "chart_label": "Versets lus par jour", "verses_read": "{count} verset lu | {count} versets lus" },
  "ko": { "window": "기간", "last_n_days": "최근 {count}일", "chart_label": "하루에 읽은 구절", "verses_read": "{count}개 구절 읽음" },
  "pt": { "window": "Janela de tempo", "last_n_days": "Últimos {count} dias", "chart_label": "Versículos lidos por dia", "verses_read": "{count} versículo lido | {count} versículos lidos" },
  "uk": { "window": "Часовий проміжок", "last_n_days": "Останні {count} днів", "chart_label": "Віршів прочитано за день", "verses_read": "{count} вірш прочитано | {count} віршів прочитано" }
}
</i18n>
