<template>
  <div class="engagement-charts">
    <div v-for="group in groups" :key="group.key" class="engagement-chart">
      <h2 class="engagement-chart__title">
        {{ t(group.titleKey) }}
      </h2>
      <svg
        class="engagement-chart__svg"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        :aria-label="t(group.titleKey)"
      >
        <!-- horizontal gridlines -->
        <line
          v-for="tick in group.yTicks"
          :key="`g-${tick.value}`"
          class="engagement-chart__gridline"
          :x1="padLeft"
          :y1="tick.y"
          :x2="width - padRight"
          :y2="tick.y"
        />
        <!-- y-axis labels -->
        <text
          v-for="tick in group.yTicks"
          :key="`t-${tick.value}`"
          class="engagement-chart__axis-text"
          :x="padLeft - 6"
          :y="tick.y + 3"
          text-anchor="end"
        >
          {{ tick.value }}
        </text>

        <!-- one line per metric, fixed color per metric -->
        <template v-for="line in group.lines" :key="line.key">
          <polyline
            class="engagement-chart__line"
            :style="{ stroke: line.color }"
            :points="line.linePoints"
          />
          <circle
            v-for="pt in line.points"
            :key="`${line.key}-${pt.date}`"
            class="engagement-chart__point"
            :style="{ fill: line.color }"
            :cx="pt.x"
            :cy="pt.y"
            r="2.5"
          >
            <title>{{ line.label }}: {{ pt.count }} — {{ formatDate(pt.date) }}</title>
          </circle>
        </template>

        <!-- x-axis date labels (all 7, since the window is fixed to a week) -->
        <text
          v-for="pt in group.xAxisPoints"
          :key="`x-${pt.date}`"
          class="engagement-chart__axis-text"
          :x="pt.x"
          :y="height - 4"
          text-anchor="middle"
        >
          {{ formatShortDate(pt.date) }}
        </text>
      </svg>

      <div class="engagement-chart__legend">
        <span v-for="line in group.lines" :key="line.key" class="engagement-chart__legend-item">
          <span class="engagement-chart__legend-swatch" :style="{ backgroundColor: line.color }" />
          {{ line.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { DEFAULT_CHART_DIMENSIONS, buildMultiLineChartGeometry, displayDate } from '@mybiblelog/shared';

dayjs.extend(localizedFormat);

interface EngagementRow {
  date: string;
  newUserAccounts: number;
  newUserAccountsByPlatform: { web: number; android: number; ios: number };
  usersWithLogEntry: number;
  usersWithNote: number;
}

const props = defineProps<{ rows: EngagementRow[] }>();

const { t, locale } = useI18n();

const { width, height, padLeft, padRight } = DEFAULT_CHART_DIMENSIONS;

// Fixed key → label → color-slot order. Never reassign a slot to a
// different metric — the color is the metric's identity across the chart
// and legend.
const seriesDefs = [
  { key: 'total', labelKey: 'series_new_users_total', color: 'var(--mbl-chart-series-1)' },
  { key: 'web', labelKey: 'series_new_users_web', color: 'var(--mbl-chart-series-2)' },
  { key: 'android', labelKey: 'series_new_users_android', color: 'var(--mbl-chart-series-3)' },
  { key: 'ios', labelKey: 'series_new_users_ios', color: 'var(--mbl-chart-series-4)' },
  { key: 'logEntry', labelKey: 'series_log_entry_users', color: 'var(--mbl-chart-series-5)' },
  { key: 'note', labelKey: 'series_note_users', color: 'var(--mbl-chart-series-6)' },
] as const;

type SeriesKey = (typeof seriesDefs)[number]['key'];

function seriesValue(row: EngagementRow, key: SeriesKey) {
  switch (key) {
  case 'total': return row.newUserAccounts;
  case 'web': return row.newUserAccountsByPlatform.web;
  case 'android': return row.newUserAccountsByPlatform.android;
  case 'ios': return row.newUserAccountsByPlatform.ios;
  case 'logEntry': return row.usersWithLogEntry;
  case 'note': return row.usersWithNote;
  }
}

// Two charts, each with its own y-scale, rather than one chart with two
// y-axes: web/android/ios sit on a much smaller scale than the other
// metrics, and a shared or dual axis would either flatten them to
// invisibility or invent a false visual correlation between two unrelated
// scales. Grouped by scale, not by semantic category.
const groupDefs = [
  { key: 'totals', titleKey: 'group_totals_title', seriesKeys: ['total', 'logEntry', 'note'] as SeriesKey[] },
  { key: 'platforms', titleKey: 'group_platforms_title', seriesKeys: ['web', 'android', 'ios'] as SeriesKey[] },
];

function formatDate(date: string) {
  return displayDate(date, locale.value);
}

function formatShortDate(date: string) {
  return dayjs(date).locale(locale.value).format('MMM D');
}

const groups = computed(() => groupDefs.map((groupDef) => {
  const defs = seriesDefs.filter(def => groupDef.seriesKeys.includes(def.key));
  const geometry = buildMultiLineChartGeometry(
    defs.map(def => ({
      key: def.key,
      points: props.rows.map(row => ({ date: row.date, count: seriesValue(row, def.key) })),
    })),
  );
  return {
    key: groupDef.key,
    titleKey: groupDef.titleKey,
    yTicks: geometry.yTicks,
    xAxisPoints: geometry.series[0]?.points ?? [],
    lines: defs.map((def, i) => ({
      key: def.key,
      color: def.color,
      label: t(def.labelKey),
      points: geometry.series[i]!.points,
      linePoints: geometry.series[i]!.linePoints,
    })),
  };
}));
</script>

<style scoped>
.engagement-charts {
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-xl);
  margin-bottom: var(--mbl-space-xl);
}

@mixin mbl-wide {
  .engagement-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

.engagement-chart__title {
  color: var(--mbl-text-muted);
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: var(--mbl-space-sm);
  text-transform: uppercase;
}

.engagement-chart__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.engagement-chart__gridline {
  stroke: var(--mbl-border-soft);
  stroke-width: 1;
}

.engagement-chart__axis-text {
  fill: var(--mbl-text-muted);
  font-size: 11px;
}

.engagement-chart__line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.engagement-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-sm) var(--mbl-space-lg);
  margin-top: var(--mbl-space-md);
}

.engagement-chart__legend-item {
  align-items: center;
  color: var(--mbl-text-muted);
  display: inline-flex;
  font-size: 0.85em;
  gap: var(--mbl-space-3xs);
}

.engagement-chart__legend-swatch {
  border-radius: 2px;
  display: inline-block;
  height: 10px;
  width: 10px;
}
</style>

<i18n lang="json">
{
  "en": {
    "group_totals_title": "New & engaged users",
    "group_platforms_title": "New users by platform",
    "series_new_users_total": "Total",
    "series_new_users_web": "Web",
    "series_new_users_android": "Android",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "Log Entry Users",
    "series_note_users": "Note Users"
  },
  "de": {
    "group_totals_title": "Neue & aktive Benutzer",
    "group_platforms_title": "Neue Benutzer nach Plattform",
    "series_new_users_total": "Gesamt",
    "series_new_users_web": "Web",
    "series_new_users_android": "Android",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "Benutzer mit Eintrag",
    "series_note_users": "Benutzer mit Notiz"
  },
  "es": {
    "group_totals_title": "Usuarios nuevos y activos",
    "group_platforms_title": "Usuarios nuevos por plataforma",
    "series_new_users_total": "Total",
    "series_new_users_web": "Web",
    "series_new_users_android": "Android",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "Usuarios con Registro",
    "series_note_users": "Usuarios con Nota"
  },
  "fr": {
    "group_totals_title": "Utilisateurs nouveaux et actifs",
    "group_platforms_title": "Nouveaux utilisateurs par plateforme",
    "series_new_users_total": "Total",
    "series_new_users_web": "Web",
    "series_new_users_android": "Android",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "Utilisateurs avec Entrée",
    "series_note_users": "Utilisateurs avec Note"
  },
  "ko": {
    "group_totals_title": "신규 및 활동 사용자",
    "group_platforms_title": "플랫폼별 신규 사용자",
    "series_new_users_total": "합계",
    "series_new_users_web": "웹",
    "series_new_users_android": "안드로이드",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "기록 작성 사용자",
    "series_note_users": "노트 작성 사용자"
  },
  "pt": {
    "group_totals_title": "Usuários novos e engajados",
    "group_platforms_title": "Novos usuários por plataforma",
    "series_new_users_total": "Total",
    "series_new_users_web": "Web",
    "series_new_users_android": "Android",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "Usuários com Registro",
    "series_note_users": "Usuários com Nota"
  },
  "uk": {
    "group_totals_title": "Нові та залучені користувачі",
    "group_platforms_title": "Нові користувачі за платформою",
    "series_new_users_total": "Всього",
    "series_new_users_web": "Веб",
    "series_new_users_android": "Android",
    "series_new_users_ios": "iOS",
    "series_log_entry_users": "Користувачі із записом",
    "series_note_users": "Користувачі з нотаткою"
  }
}
</i18n>
