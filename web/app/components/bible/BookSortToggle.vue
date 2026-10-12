<template>
  <button
    type="button"
    class="book-sort-toggle"
    :disabled="!hydrated"
    :aria-label="`${t('order')}: ${current.label}`"
    :data-sort-order="modelValue"
    data-testid="book-sort-toggle"
    @click="modelValue = next"
  >
    <sort-icon class="book-sort-toggle--icon" />
    <span class="book-sort-toggle--label">{{ current.label }}</span>
    <span class="book-sort-toggle--label-short">{{ current.shortLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import type { BookSortOrder } from '@mybiblelog/shared';
import SortIcon from '~/components/svg/SortIcon.vue';

const modelValue = defineModel<BookSortOrder>({ required: true });

const { t } = useI18n();
const hydrated = useHydrated();

const current = computed(() =>
  modelValue.value === 'alphabetical'
    ? { label: t('alphabetical'), shortLabel: t('alphabetical_short') }
    : { label: t('traditional'), shortLabel: '123' },
);

const next = computed<BookSortOrder>(() => (modelValue.value === 'alphabetical' ? 'numerical' : 'alphabetical'));
</script>

<style scoped>
/* Matches the TestamentToggle track so the two read as one toolbar. */
.book-sort-toggle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--mbl-space-xs);
  height: 2.5rem;
  padding: 0 var(--mbl-space-md);
  border: 1px solid var(--mbl-border-strong);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-bg-muted);
  color: var(--mbl-text-subtle);
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s;
}

.book-sort-toggle:hover {
  color: var(--mbl-text);
}

.book-sort-toggle:focus-visible {
  outline: 2px solid var(--mbl-link-bright);
  outline-offset: 2px;
}

.book-sort-toggle--icon {
  flex-shrink: 0;
}

/*
 * Same cutoff as TestamentToggle's short labels. The query resolves against
 * the nearest inline-size container (the Books toolbar); without one, the
 * full label always shows.
 */
.book-sort-toggle--label-short {
  display: none;
}

@container (max-width: 32rem) {
  .book-sort-toggle--label {
    display: none;
  }

  .book-sort-toggle--label-short {
    display: inline;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "order": "Book order",
    "traditional": "Traditional",
    "alphabetical": "Alphabetical",
    "alphabetical_short": "ABC"
  },
  "de": {
    "order": "Buchreihenfolge",
    "traditional": "Traditionell",
    "alphabetical": "Alphabetisch",
    "alphabetical_short": "ABC"
  },
  "es": {
    "order": "Orden de los libros",
    "traditional": "Tradicional",
    "alphabetical": "Alfabético",
    "alphabetical_short": "ABC"
  },
  "fr": {
    "order": "Ordre des livres",
    "traditional": "Traditionnel",
    "alphabetical": "Alphabétique",
    "alphabetical_short": "ABC"
  },
  "ko": {
    "order": "책 순서",
    "traditional": "성경 순서",
    "alphabetical": "가나다순",
    "alphabetical_short": "가나다"
  },
  "pt": {
    "order": "Ordem dos livros",
    "traditional": "Tradicional",
    "alphabetical": "Alfabética",
    "alphabetical_short": "ABC"
  },
  "uk": {
    "order": "Порядок книг",
    "traditional": "Традиційний",
    "alphabetical": "За алфавітом",
    "alphabetical_short": "АБВ"
  }
}
</i18n>
