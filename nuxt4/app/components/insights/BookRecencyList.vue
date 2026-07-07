<template>
  <div class="recency">
    <div class="recency__controls">
      <div class="recency__control">
        <label class="mbl-label" for="recency-timeframe">{{ t('timeframe') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="recency-timeframe" v-model="timeframe">
            <option v-for="opt in timeframeOptions" :key="opt" :value="opt">
              {{ t('last_n_days', { count: opt }) }}
            </option>
            <option value="all">
              {{ t('all_time') }}
            </option>
          </select>
        </div>
      </div>

      <div class="recency__control">
        <label class="mbl-label" for="recency-scope">{{ t('books') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="recency-scope" v-model="bookScope">
            <option value="all">
              {{ t('whole_bible') }}
            </option>
            <option value="old">
              {{ t('old_testament') }}
            </option>
            <option value="new">
              {{ t('new_testament') }}
            </option>
          </select>
        </div>
      </div>

      <div class="recency__control">
        <label class="mbl-label" for="recency-sort">{{ t('sort_by') }}</label>
        <div class="mbl-select mbl-select--sm">
          <select id="recency-sort" v-model="sortDir">
            <option value="bible">
              {{ t('bible_order') }}
            </option>
            <option value="alpha">
              {{ t('alphabetical') }}
            </option>
            <option value="recent">
              {{ t('most_recent') }}
            </option>
            <option value="oldest">
              {{ t('least_recent') }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="recency__legend">
      <span class="recency__legend-label">{{ t('less_recent') }}</span>
      <span
        v-for="level in [1, 2, 3, 4]"
        :key="level"
        class="recency__swatch"
        :class="`recency__swatch--level-${level}`"
      />
      <span class="recency__legend-label">{{ t('more_recent') }}</span>
      <span class="recency__swatch recency__swatch--level-0 recency__legend-gap" />
      <span class="recency__legend-label">{{ t('not_read') }}</span>
    </div>

    <ul class="recency__list">
      <li v-for="row in rows" :key="row.bookIndex" class="recency__row">
        <span
          class="recency__swatch"
          :class="`recency__swatch--level-${row.level}`"
          :title="row.level > 0 ? row.absolute : t('not_read_in_timeframe')"
        />
        <span class="recency__name">{{ row.bookName }}</span>
        <span v-if="row.level > 0" class="recency__date">{{ row.relative }}</span>
        <span v-else class="recency__date recency__date--never">{{ t('not_read_in_timeframe') }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { Bible, computeBookRecency, type InsightsLogEntry } from '@mybiblelog/shared';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const { locale, t } = useI18n();

const timeframeOptions = [30, 60, 90, 180, 365];
const timeframe = ref<number | 'all'>(365);
const bookScope = ref<'all' | 'old' | 'new'>('all');
const sortDir = ref<'bible' | 'alpha' | 'recent' | 'oldest'>('recent');

const newTestamentBooks = new Set(
  Bible.getBooks().filter(book => book.newTestament).map(book => book.bibleOrder),
);

const stripLeadingNumbers = (str: string) => str.replace(/^\d+\s*/, '').trim();

const rows = computed(() => {
  const entries = props.entries as InsightsLogEntry[];
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = timeframe.value === 'all'
    ? entries.reduce((min, e) => (e.date < min ? e.date : min), endDate)
    : dayjs().subtract((timeframe.value as number) - 1, 'day').format('YYYY-MM-DD');

  const data = computeBookRecency(entries, startDate, endDate)
    .filter((book) => {
      if (bookScope.value === 'old') { return !newTestamentBooks.has(book.bookIndex); }
      if (bookScope.value === 'new') { return newTestamentBooks.has(book.bookIndex); }
      return true;
    })
    .map(book => ({
      bookIndex: book.bookIndex,
      bookName: Bible.getBookName(book.bookIndex, locale.value),
      level: book.level,
      lastReadDate: book.lastReadDate,
      relative: book.lastReadDate ? dayjs(book.lastReadDate).locale(locale.value).fromNow() : '',
      absolute: book.lastReadDate ? dayjs(book.lastReadDate).locale(locale.value).format('LL') : '',
    }));

  return data.sort((a, b) => {
    if (sortDir.value === 'bible') { return a.bookIndex - b.bookIndex; }
    if (sortDir.value === 'alpha') { return stripLeadingNumbers(a.bookName).localeCompare(stripLeadingNumbers(b.bookName), locale.value); }
    // Books not read in the timeframe always sort last.
    if (!a.lastReadDate && !b.lastReadDate) { return a.bookIndex - b.bookIndex; }
    if (!a.lastReadDate) { return 1; }
    if (!b.lastReadDate) { return -1; }
    return sortDir.value === 'recent'
      ? b.lastReadDate.localeCompare(a.lastReadDate)
      : a.lastReadDate.localeCompare(b.lastReadDate);
  });
});
</script>

<style scoped>
.recency__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.recency__control {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recency__legend {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: var(--mbl-text-muted);
}

.recency__legend-label {
  white-space: nowrap;
}

.recency__legend-gap {
  margin-left: 0.5rem;
}

.recency__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.recency__row {
  display: grid;
  grid-template-columns: 0.85rem 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 2px 0;
  font-size: 0.8rem;
  line-height: 1.4;
  border-bottom: 1px solid var(--mbl-border-soft);
}

.recency__swatch {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 3px;
  border: 1px solid var(--mbl-recency-swatch-border);
  background: var(--mbl-recency-0);
  flex: none;
}

.recency__swatch--level-0 { background: var(--mbl-recency-0); }
.recency__swatch--level-1 { background: var(--mbl-recency-1); }
.recency__swatch--level-2 { background: var(--mbl-recency-2); }
.recency__swatch--level-3 { background: var(--mbl-recency-3); }
.recency__swatch--level-4 { background: var(--mbl-recency-4); }

.recency__name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--mbl-text-body);
}

.recency__date {
  text-align: right;
  color: var(--mbl-text-muted);
  white-space: nowrap;
}

.recency__date--never {
  color: var(--mbl-text-subtle);
  font-style: italic;
}
</style>

<i18n lang="json">
{
  "en": {
    "timeframe": "Timeframe",
    "last_n_days": "Last {count} days",
    "all_time": "All time",
    "books": "Books",
    "whole_bible": "Whole Bible",
    "old_testament": "Old Testament",
    "new_testament": "New Testament",
    "sort_by": "Sort by",
    "bible_order": "Bible order",
    "alphabetical": "Alphabetical",
    "most_recent": "Most recent",
    "least_recent": "Least recent",
    "less_recent": "Less recent",
    "more_recent": "More recent",
    "not_read": "Not read",
    "not_read_in_timeframe": "Not read in timeframe"
  },
  "de": {
    "timeframe": "Zeitraum",
    "last_n_days": "Letzte {count} Tage",
    "all_time": "Gesamter Zeitraum",
    "books": "Bücher",
    "whole_bible": "Ganze Bibel",
    "old_testament": "Altes Testament",
    "new_testament": "Neues Testament",
    "sort_by": "Sortieren nach",
    "bible_order": "Bibelreihenfolge",
    "alphabetical": "Alphabetisch",
    "most_recent": "Zuletzt gelesen",
    "least_recent": "Am längsten her",
    "less_recent": "Länger her",
    "more_recent": "Kürzlich",
    "not_read": "Nicht gelesen",
    "not_read_in_timeframe": "Im Zeitraum nicht gelesen"
  },
  "es": {
    "timeframe": "Período",
    "last_n_days": "Últimos {count} días",
    "all_time": "Todo el tiempo",
    "books": "Libros",
    "whole_bible": "Toda la Biblia",
    "old_testament": "Antiguo Testamento",
    "new_testament": "Nuevo Testamento",
    "sort_by": "Ordenar por",
    "bible_order": "Orden bíblico",
    "alphabetical": "Alfabético",
    "most_recent": "Más reciente",
    "least_recent": "Menos reciente",
    "less_recent": "Menos reciente",
    "more_recent": "Más reciente",
    "not_read": "Sin leer",
    "not_read_in_timeframe": "No leído en el período"
  },
  "fr": {
    "timeframe": "Période",
    "last_n_days": "{count} derniers jours",
    "all_time": "Depuis le début",
    "books": "Livres",
    "whole_bible": "Toute la Bible",
    "old_testament": "Ancien Testament",
    "new_testament": "Nouveau Testament",
    "sort_by": "Trier par",
    "bible_order": "Ordre biblique",
    "alphabetical": "Alphabétique",
    "most_recent": "Plus récent",
    "least_recent": "Moins récent",
    "less_recent": "Moins récent",
    "more_recent": "Plus récent",
    "not_read": "Non lu",
    "not_read_in_timeframe": "Non lu sur la période"
  },
  "ko": {
    "timeframe": "기간",
    "last_n_days": "최근 {count}일",
    "all_time": "전체 기간",
    "books": "책",
    "whole_bible": "성경 전체",
    "old_testament": "구약",
    "new_testament": "신약",
    "sort_by": "정렬 기준",
    "bible_order": "성경 순서",
    "alphabetical": "알파벳순",
    "most_recent": "최근 읽음",
    "least_recent": "오래전 읽음",
    "less_recent": "덜 최근",
    "more_recent": "더 최근",
    "not_read": "읽지 않음",
    "not_read_in_timeframe": "기간 내 읽지 않음"
  },
  "pt": {
    "timeframe": "Período",
    "last_n_days": "Últimos {count} dias",
    "all_time": "Todo o período",
    "books": "Livros",
    "whole_bible": "Bíblia inteira",
    "old_testament": "Antigo Testamento",
    "new_testament": "Novo Testamento",
    "sort_by": "Ordenar por",
    "bible_order": "Ordem bíblica",
    "alphabetical": "Alfabético",
    "most_recent": "Mais recente",
    "least_recent": "Menos recente",
    "less_recent": "Menos recente",
    "more_recent": "Mais recente",
    "not_read": "Não lido",
    "not_read_in_timeframe": "Não lido no período"
  },
  "uk": {
    "timeframe": "Період",
    "last_n_days": "Останні {count} днів",
    "all_time": "Весь час",
    "books": "Книги",
    "whole_bible": "Уся Біблія",
    "old_testament": "Старий Заповіт",
    "new_testament": "Новий Заповіт",
    "sort_by": "Сортувати за",
    "bible_order": "Біблійний порядок",
    "alphabetical": "За алфавітом",
    "most_recent": "Найновіші",
    "least_recent": "Найдавніші",
    "less_recent": "Давніше",
    "more_recent": "Нещодавно",
    "not_read": "Не читали",
    "not_read_in_timeframe": "Не читали за період"
  }
}
</i18n>
