<template>
  <div class="frequency">
    <div class="frequency__controls">
      <div class="frequency__control">
        <label class="mbl-label" for="freq-timeframe">{{ t('timeframe') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="freq-timeframe" v-model.number="days">
            <option v-for="opt in timeframeOptions" :key="opt" :value="opt">
              {{ t('last_n_days', { count: opt }) }}
            </option>
          </select>
        </div>
      </div>

      <div class="frequency__control">
        <label class="mbl-label" for="freq-metric">{{ t('metric') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="freq-metric" v-model="metric">
            <option value="raw">
              {{ t('raw_counts') }}
            </option>
            <option value="proportional">
              {{ t('proportional') }}
            </option>
          </select>
        </div>
      </div>

      <div class="frequency__control">
        <label class="mbl-label" for="freq-sort">{{ t('sort_by') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="freq-sort" v-model="sort">
            <option value="bible">
              {{ t('bible_order') }}
            </option>
            <option value="alpha">
              {{ t('alphabetical') }}
            </option>
            <option value="most">
              {{ t('most_read') }}
            </option>
            <option value="least">
              {{ t('least_read') }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="frequency__bars">
      <div v-for="row in rows" :key="row.bookIndex" class="frequency__row">
        <div class="frequency__name" :title="row.bookName">
          {{ row.bookName }}
        </div>
        <div class="frequency__track">
          <div class="frequency__fill" :style="{ width: row.width + '%' }" />
        </div>
        <div class="frequency__value">
          {{ row.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible, computeBookFrequencies, type InsightsLogEntry } from '@mybiblelog/shared';

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const { locale, t } = useI18n();

const timeframeOptions = [30, 60, 90, 180, 365];
const days = ref(30);
const metric = ref<'raw' | 'proportional'>('raw');
const sort = ref<'bible' | 'alpha' | 'most' | 'least'>('bible');

const stripLeadingNumbers = (str: string) => str.replace(/^\d+\s*/, '').trim();

const rows = computed(() => {
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(days.value - 1, 'day').format('YYYY-MM-DD');
  const frequencies = computeBookFrequencies(props.entries as InsightsLogEntry[], startDate, endDate);

  const useProportion = metric.value === 'proportional';
  const enriched = frequencies.map(freq => ({
    bookIndex: freq.bookIndex,
    bookName: Bible.getBookName(freq.bookIndex, locale.value),
    value: useProportion ? freq.proportion : freq.verseCount,
    label: useProportion
      ? `${Math.round(freq.proportion * 100)}%`
      : String(freq.verseCount),
  }));

  const max = enriched.reduce((m, r) => Math.max(m, r.value), 0);

  const withWidth = enriched.map(r => ({
    ...r,
    width: max > 0 ? (r.value / max) * 100 : 0,
  }));

  switch (sort.value) {
  case 'alpha':
    return withWidth.sort((a, b) => stripLeadingNumbers(a.bookName).localeCompare(stripLeadingNumbers(b.bookName), locale.value));
  case 'most':
    return withWidth.sort((a, b) => b.value - a.value || a.bookIndex - b.bookIndex);
  case 'least':
    return withWidth.sort((a, b) => a.value - b.value || a.bookIndex - b.bookIndex);
  case 'bible':
  default:
    return withWidth.sort((a, b) => a.bookIndex - b.bookIndex);
  }
});
</script>

<style scoped>
.frequency__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.frequency__control {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.frequency__bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.frequency__row {
  display: grid;
  grid-template-columns: 8rem 1fr 3rem;
  align-items: center;
  gap: 0.5rem;
}

.frequency__name {
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--mbl-text-body);
}

.frequency__track {
  height: 0.9rem;
  background: var(--mbl-progress-track-bg);
  border-radius: 4px;
  overflow: hidden;
}

.frequency__fill {
  height: 100%;
  background: var(--mbl-success);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.frequency__value {
  font-size: 0.75rem;
  text-align: right;
  color: var(--mbl-text-muted);
  font-variant-numeric: tabular-nums;
}
</style>

<i18n lang="json">
{
  "en": { "timeframe": "Timeframe", "metric": "Metric", "sort_by": "Sort by", "last_n_days": "Last {count} days", "raw_counts": "Verse counts", "proportional": "Proportional", "bible_order": "Bible order", "alphabetical": "Alphabetical", "most_read": "Most read", "least_read": "Least read" },
  "de": { "timeframe": "Zeitraum", "metric": "Messwert", "sort_by": "Sortieren nach", "last_n_days": "Letzte {count} Tage", "raw_counts": "Verszahlen", "proportional": "Anteilig", "bible_order": "Bibelreihenfolge", "alphabetical": "Alphabetisch", "most_read": "Meist gelesen", "least_read": "Am wenigsten gelesen" },
  "es": { "timeframe": "Período", "metric": "Métrica", "sort_by": "Ordenar por", "last_n_days": "Últimos {count} días", "raw_counts": "Recuento de versículos", "proportional": "Proporcional", "bible_order": "Orden bíblico", "alphabetical": "Alfabético", "most_read": "Más leídos", "least_read": "Menos leídos" },
  "fr": { "timeframe": "Période", "metric": "Mesure", "sort_by": "Trier par", "last_n_days": "{count} derniers jours", "raw_counts": "Nombre de versets", "proportional": "Proportionnel", "bible_order": "Ordre biblique", "alphabetical": "Alphabétique", "most_read": "Plus lus", "least_read": "Moins lus" },
  "ko": { "timeframe": "기간", "metric": "지표", "sort_by": "정렬 기준", "last_n_days": "최근 {count}일", "raw_counts": "구절 수", "proportional": "비율", "bible_order": "성경 순서", "alphabetical": "알파벳순", "most_read": "많이 읽음", "least_read": "적게 읽음" },
  "pt": { "timeframe": "Período", "metric": "Métrica", "sort_by": "Ordenar por", "last_n_days": "Últimos {count} dias", "raw_counts": "Contagem de versículos", "proportional": "Proporcional", "bible_order": "Ordem bíblica", "alphabetical": "Alfabético", "most_read": "Mais lidos", "least_read": "Menos lidos" },
  "uk": { "timeframe": "Період", "metric": "Показник", "sort_by": "Сортувати за", "last_n_days": "Останні {count} днів", "raw_counts": "Кількість віршів", "proportional": "Пропорційно", "bible_order": "Біблійний порядок", "alphabetical": "За алфавітом", "most_read": "Найбільше читали", "least_read": "Найменше читали" }
}
</i18n>
