<template>
  <div class="heatmap">
    <!-- Wide screens show the full year; narrow screens show the same year split into
         two stacked half-year grids (see strips) so the layout fits without scrolling. -->
    <div
      v-for="strip in strips"
      :key="strip.name"
      class="heatmap__strip"
      :class="`heatmap__strip--${strip.variant}`"
    >
      <div class="heatmap__scroll">
        <div class="heatmap__inner" :style="{ '--heat-cols': strip.weeks.length }">
          <!-- Month labels -->
          <div class="heatmap__months">
            <div class="heatmap__weekday-spacer" />
            <div
              v-for="(label, weekIndex) in strip.monthLabels"
              :key="`m-${weekIndex}`"
              class="heatmap__month"
            >
              <span class="heatmap__month-name">{{ label.month }}</span>
              <span class="heatmap__month-year">{{ label.year }}</span>
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
                v-for="(week, weekIndex) in strip.weeks"
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
      </div>
    </div>

    <div
      v-if="tooltip"
      class="heatmap__tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      {{ tooltip.text }}
    </div>

    <!-- Legend -->
    <div class="heatmap__legend">
      <span>{{ $t('less') }}</span>
      <div v-for="level in [0, 1, 2, 3, 4]" :key="`l-${level}`" class="heatmap__cell" :class="`heatmap__cell--level-${level}`" />
      <span>{{ $t('more') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { buildContributionCalendar, type HeatmapCell, type HeatmapWeek, type InsightsLogEntry } from '@mybiblelog/shared';

dayjs.extend(localizedFormat);

// How much of the year each narrow-screen grid shows (the full year won't fit a
// phone at a legible cell size, so we split it into two of these).
const NARROW_MONTHS = 6;

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const { proxy } = getCurrentInstance()!;
const locale = computed(() => proxy.$i18n.locale);

const calendar = computed(() => buildContributionCalendar(props.entries as InsightsLogEntry[]));

// One label per week column: the month name (plus its year on a second line) when
// that column begins a new month. Showing the year keeps the two stacked strips
// readable so they can't be misread — e.g. Dec 2025 above Jan 2026.
type MonthLabel = { month: string; year: string };
function buildMonthLabels(weeks: HeatmapWeek[]): MonthLabel[] {
  let lastMonth = -1;
  return weeks.map((week) => {
    const d = dayjs(week[0].date).locale(locale.value);
    const month = d.month();
    if (month !== lastMonth) {
      lastMonth = month;
      return { month: d.format('MMM'), year: d.format('YYYY') };
    }
    return { month: '', year: '' };
  });
}

// The strips rendered into the DOM; CSS shows the right ones per breakpoint.
// Wide screens get the whole year as one strip; narrow screens get the same year
// split into two stacked NARROW_MONTHS-month grids (most recent on top) so the
// cells stay legible without horizontal scrolling.
const strips = computed(() => {
  const weeks = calendar.value.weeks;
  const cutoff = dayjs().subtract(NARROW_MONTHS, 'month').format('YYYY-MM-DD');
  const idx = weeks.findIndex(week => week[week.length - 1].date >= cutoff);
  const splitAt = idx <= 0 ? 0 : idx;
  const recent = splitAt > 0 ? weeks.slice(splitAt) : weeks;
  const previous = weeks.slice(0, splitAt);

  return [
    { name: 'wide', variant: 'wide', weeks, monthLabels: buildMonthLabels(weeks) },
    { name: 'narrow-recent', variant: 'narrow', weeks: recent, monthLabels: buildMonthLabels(recent) },
    { name: 'narrow-previous', variant: 'narrow', weeks: previous, monthLabels: buildMonthLabels(previous) },
  ].filter(strip => strip.weeks.length > 0);
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
  const verses = proxy.$tc('verses_read', cell.count, { count: cell.count });
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

/*
 * The strip is fluid: columns and cells shrink to fit the container width so the
 * whole range is always visible with no horizontal scroll. Width stays fixed on
 * the cells so rows keep lining up with the Mon/Wed/Fri weekday labels (cells go
 * slightly rectangular when squeezed, which reads fine at this scale). The inner
 * is capped at the natural 12px-cell size so it never grows past the original
 * design on very wide screens.
 */
.heatmap__scroll {
  padding-bottom: 0.25rem;
}

.heatmap__inner {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: calc(32px + var(--heat-cols, 53) * (var(--heat-cell-size) + var(--heat-cell-gap)));
}

.heatmap__months {
  display: flex;
  margin-bottom: 4px;
}

.heatmap__weekday-spacer {
  width: 32px;
  flex: none;
}

.heatmap__month {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  font-size: 0.7rem;
  line-height: 1.15;
  color: var(--mbl-text-muted);
  white-space: nowrap;
}

.heatmap__month-year {
  font-size: 0.6rem;
  opacity: 0.75;
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
  flex: 1 1 0;
  min-width: 0;
  gap: var(--heat-cell-gap);
}

.heatmap__week {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  gap: var(--heat-cell-gap);
}

.heatmap__cell {
  box-sizing: border-box;
  width: 100%;
  height: var(--heat-cell-size);
  border-radius: 2px;
  background: var(--mbl-heat-0);
  border: 1px solid var(--mbl-heat-empty-border);
}

/*
 * Full-year strip on wide screens; two stacked half-year strips on narrow screens.
 * The second narrow strip (the previous 6 months) gets a gap above it.
 */
.heatmap__strip--wide {
  display: none;
}

.heatmap__strip--narrow + .heatmap__strip--narrow {
  margin-top: 1.25rem;
}

@media (min-width: 640px) {
  .heatmap__strip--wide {
    display: block;
  }

  .heatmap__strip--narrow {
    display: none;
  }
}

.heatmap__cell--level-1 { background: var(--mbl-heat-1); border-color: transparent; }
.heatmap__cell--level-2 { background: var(--mbl-heat-2); border-color: transparent; }
.heatmap__cell--level-3 { background: var(--mbl-heat-3); border-color: transparent; }
.heatmap__cell--level-4 { background: var(--mbl-heat-4); border-color: transparent; }

.heatmap__cell--future {
  visibility: hidden;
}

/* The legend cells are fixed-size swatches, not fluid grid columns. */
.heatmap__legend {
  display: flex;
  align-items: center;
  gap: var(--heat-cell-gap);
  margin-top: 0.75rem;
  font-size: 0.7rem;
  color: var(--mbl-text-muted);
}

.heatmap__legend .heatmap__cell {
  width: var(--heat-cell-size);
  flex: none;
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
