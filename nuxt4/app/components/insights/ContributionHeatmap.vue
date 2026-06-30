<template>
  <div class="heatmap">
    <div class="heatmap__scroll">
      <div class="heatmap__inner">
        <!-- Month labels -->
        <div class="heatmap__months">
          <div class="heatmap__weekday-spacer" />
          <div
            v-for="(label, weekIndex) in monthLabels"
            :key="`m-${weekIndex}`"
            class="heatmap__month"
          >
            {{ label }}
          </div>
        </div>

        <div class="heatmap__body">
          <!-- Weekday labels -->
          <div class="heatmap__weekdays">
            <div
              v-for="(label, dayIndex) in weekdayLabels"
              :key="`wd-${dayIndex}`"
              class="heatmap__weekday"
            >
              {{ label }}
            </div>
          </div>

          <!-- Week columns -->
          <div class="heatmap__grid">
            <div
              v-for="(week, weekIndex) in calendar.weeks"
              :key="`w-${weekIndex}`"
              class="heatmap__week"
            >
              <div
                v-for="cell in week"
                :key="cell.date"
                class="heatmap__cell"
                :class="[`heatmap__cell--level-${cell.level}`, { 'heatmap__cell--future': cell.future }]"
                :aria-label="cellTitle(cell) || undefined"
                @mouseenter="showTooltip($event, cell)"
                @mouseleave="hideTooltip"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="tooltip"
        class="heatmap__tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        {{ tooltip.text }}
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap__legend">
      <span>{{ t('less') }}</span>
      <div v-for="level in [0, 1, 2, 3, 4]" :key="`l-${level}`" class="heatmap__cell" :class="`heatmap__cell--level-${level}`" />
      <span>{{ t('more') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { buildContributionCalendar, type HeatmapCell, type InsightsLogEntry } from '@mybiblelog/shared';

dayjs.extend(localizedFormat);

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const { locale, t } = useI18n();

const calendar = computed(() => buildContributionCalendar(props.entries as InsightsLogEntry[]));

// One label per week column: the month name when that column begins a new month.
const monthLabels = computed(() => {
  let lastMonth = -1;
  return calendar.value.weeks.map((week) => {
    const firstCell = week[0];
    const d = dayjs(firstCell.date).locale(locale.value);
    const month = d.month();
    if (month !== lastMonth) {
      lastMonth = month;
      return d.format('MMM');
    }
    return '';
  });
});

// Sunday → Saturday; only show Mon / Wed / Fri to reduce clutter (GitHub-style).
const weekdayLabels = computed(() => {
  const base = dayjs('2026-06-14'); // a Sunday
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    if (offset === 1 || offset === 3 || offset === 5) {
      return base.add(offset, 'day').locale(locale.value).format('ddd');
    }
    return '';
  });
});

function cellTitle(cell: HeatmapCell): string {
  if (cell.future) {
    return '';
  }
  const date = dayjs(cell.date).locale(locale.value).format('LL');
  const verses = t('verses_read', { count: cell.count });
  return `${verses} — ${date}`;
}

const tooltip = ref<{ x: number; y: number; text: string } | null>(null);

function showTooltip(event: MouseEvent, cell: HeatmapCell): void {
  if (cell.future) {
    tooltip.value = null;
    return;
  }
  const target = event.currentTarget as HTMLElement;
  const container = target.closest('.heatmap') as HTMLElement | null;
  if (!container) {
    return;
  }
  const cellRect = target.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  tooltip.value = {
    x: cellRect.left - containerRect.left + cellRect.width / 2,
    y: cellRect.top - containerRect.top,
    text: cellTitle(cell),
  };
}

function hideTooltip(): void {
  tooltip.value = null;
}
</script>

<style scoped>
.heatmap {
  --heat-cell-size: 12px;
  --heat-cell-gap: 3px;
  position: relative;
}

.heatmap__tooltip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 6px));
  z-index: 10;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  background: var(--mbl-bg-elevated);
  border: 1px solid var(--mbl-border);
  box-shadow: var(--mbl-card-shadow);
  color: var(--mbl-text-body);
  font-size: 0.72rem;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.heatmap__scroll {
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.heatmap__inner {
  display: inline-block;
  min-width: min-content;
}

.heatmap__months {
  display: flex;
  margin-bottom: 4px;
}

.heatmap__weekday-spacer {
  width: 28px;
  flex: none;
}

.heatmap__month {
  width: calc(var(--heat-cell-size) + var(--heat-cell-gap));
  flex: none;
  font-size: 0.7rem;
  color: var(--mbl-text-muted);
  white-space: nowrap;
}

.heatmap__body {
  display: flex;
}

.heatmap__weekdays {
  display: flex;
  flex-direction: column;
  gap: var(--heat-cell-gap);
  width: 28px;
  flex: none;
  margin-right: 4px;
}

.heatmap__weekday {
  height: var(--heat-cell-size);
  font-size: 0.65rem;
  line-height: var(--heat-cell-size);
  color: var(--mbl-text-muted);
}

.heatmap__grid {
  display: flex;
  gap: var(--heat-cell-gap);
}

.heatmap__week {
  display: flex;
  flex-direction: column;
  gap: var(--heat-cell-gap);
}

.heatmap__cell {
  width: var(--heat-cell-size);
  height: var(--heat-cell-size);
  border-radius: 2px;
  background: var(--mbl-heat-0);
  border: 1px solid var(--mbl-heat-empty-border);
}

.heatmap__cell--level-1 { background: var(--mbl-heat-1); border-color: transparent; }
.heatmap__cell--level-2 { background: var(--mbl-heat-2); border-color: transparent; }
.heatmap__cell--level-3 { background: var(--mbl-heat-3); border-color: transparent; }
.heatmap__cell--level-4 { background: var(--mbl-heat-4); border-color: transparent; }

.heatmap__cell--future {
  visibility: hidden;
}

.heatmap__legend {
  display: flex;
  align-items: center;
  gap: var(--heat-cell-gap);
  margin-top: 0.75rem;
  font-size: 0.7rem;
  color: var(--mbl-text-muted);
}

.heatmap__legend span {
  margin: 0 0.25rem;
}
</style>

<i18n lang="json">
{
  "en": { "less": "Less", "more": "More", "verses_read": "{count} verse read | {count} verses read" },
  "de": { "less": "Weniger", "more": "Mehr", "verses_read": "{count} Vers gelesen | {count} Verse gelesen" },
  "es": { "less": "Menos", "more": "Más", "verses_read": "{count} versículo leído | {count} versículos leídos" },
  "fr": { "less": "Moins", "more": "Plus", "verses_read": "{count} verset lu | {count} versets lus" },
  "ko": { "less": "적음", "more": "많음", "verses_read": "{count}개 구절 읽음" },
  "pt": { "less": "Menos", "more": "Mais", "verses_read": "{count} versículo lido | {count} versículos lidos" },
  "uk": { "less": "Менше", "more": "Більше", "verses_read": "{count} вірш прочитано | {count} віршів прочитано" }
}
</i18n>
