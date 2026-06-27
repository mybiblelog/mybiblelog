<template>
  <div class="recency">
    <div class="recency__controls">
      <label class="mbl-label" for="recency-sort">{{ $t('sort_by') }}</label>
      <div class="mbl-select mbl-select--sm">
        <select id="recency-sort" v-model="sortDir">
          <option value="bible">
            {{ $t('bible_order') }}
          </option>
          <option value="alpha">
            {{ $t('alphabetical') }}
          </option>
          <option value="recent">
            {{ $t('most_recent') }}
          </option>
          <option value="oldest">
            {{ $t('least_recent') }}
          </option>
        </select>
      </div>
    </div>

    <table class="mbl-table recency__table">
      <thead>
        <tr>
          <th>{{ $t('book') }}</th>
          <th>{{ $t('last_read') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.bookIndex">
          <td>{{ row.bookName }}</td>
          <td>
            <template v-if="row.lastReadDate">
              <span class="recency__relative">{{ row.relative }}</span>
              <span class="recency__absolute">{{ row.absolute }}</span>
            </template>
            <span v-else class="recency__never">{{ $t('never') }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { Bible, computeBookLastRead, type InsightsLogEntry } from '@mybiblelog/shared';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
});

const { locale } = useI18n();

const sortDir = ref<'bible' | 'alpha' | 'recent' | 'oldest'>('recent');

const stripLeadingNumbers = (str: string) => str.replace(/^\d+\s*/, '').trim();

const rows = computed(() => {
  const data = computeBookLastRead(props.entries as InsightsLogEntry[]).map(book => ({
    bookIndex: book.bookIndex,
    bookName: Bible.getBookName(book.bookIndex, locale.value),
    lastReadDate: book.lastReadDate,
    relative: book.lastReadDate ? dayjs(book.lastReadDate).locale(locale.value).fromNow() : '',
    absolute: book.lastReadDate ? dayjs(book.lastReadDate).locale(locale.value).format('LL') : '',
  }));

  return data.sort((a, b) => {
    if (sortDir.value === 'bible') { return a.bookIndex - b.bookIndex; }
    if (sortDir.value === 'alpha') { return stripLeadingNumbers(a.bookName).localeCompare(stripLeadingNumbers(b.bookName), locale.value); }
    // Books never read always sort last.
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
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.recency__table {
  width: 100%;
}

.recency__relative {
  display: block;
}

.recency__absolute {
  display: block;
  font-size: 0.75rem;
  color: var(--mbl-text-muted);
}

.recency__never {
  color: var(--mbl-text-subtle);
  font-style: italic;
}
</style>

<i18n lang="json">
{
  "en": { "sort_by": "Sort by", "bible_order": "Bible order", "alphabetical": "Alphabetical", "most_recent": "Most recent", "least_recent": "Least recent", "book": "Book", "last_read": "Last read", "never": "Never read" },
  "de": { "sort_by": "Sortieren nach", "bible_order": "Bibelreihenfolge", "alphabetical": "Alphabetisch", "most_recent": "Zuletzt gelesen", "least_recent": "Am längsten her", "book": "Buch", "last_read": "Zuletzt gelesen", "never": "Nie gelesen" },
  "es": { "sort_by": "Ordenar por", "bible_order": "Orden bíblico", "alphabetical": "Alfabético", "most_recent": "Más reciente", "least_recent": "Menos reciente", "book": "Libro", "last_read": "Última lectura", "never": "Nunca leído" },
  "fr": { "sort_by": "Trier par", "bible_order": "Ordre biblique", "alphabetical": "Alphabétique", "most_recent": "Plus récent", "least_recent": "Moins récent", "book": "Livre", "last_read": "Dernière lecture", "never": "Jamais lu" },
  "ko": { "sort_by": "정렬 기준", "bible_order": "성경 순서", "alphabetical": "알파벳순", "most_recent": "최근 읽음", "least_recent": "오래전 읽음", "book": "책", "last_read": "마지막으로 읽음", "never": "읽지 않음" },
  "pt": { "sort_by": "Ordenar por", "bible_order": "Ordem bíblica", "alphabetical": "Alfabético", "most_recent": "Mais recente", "least_recent": "Menos recente", "book": "Livro", "last_read": "Última leitura", "never": "Nunca lido" },
  "uk": { "sort_by": "Сортувати за", "bible_order": "Біблійний порядок", "alphabetical": "За алфавітом", "most_recent": "Найновіші", "least_recent": "Найдавніші", "book": "Книга", "last_read": "Востаннє читали", "never": "Не читали" }
}
</i18n>
