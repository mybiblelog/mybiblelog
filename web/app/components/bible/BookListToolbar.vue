<template>
  <div class="book-list-toolbar">
    <testament-toggle v-model="testament" class="book-list-toolbar--filter" />
    <book-sort-toggle v-model="sortOrder" />
  </div>
</template>

<script setup lang="ts">
import type { BookSortOrder, TestamentFilter } from '@mybiblelog/shared';
import TestamentToggle from '~/components/bible/TestamentToggle.vue';
import BookSortToggle from '~/components/bible/BookSortToggle.vue';

const testament = defineModel<TestamentFilter>('testament', { required: true });
const sortOrder = defineModel<BookSortOrder>('sortOrder', { required: true });
</script>

<style scoped>
/* The container BookSortToggle's short-label query resolves against. */
.book-list-toolbar {
  container-type: inline-size;
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xs);
}

/*
 * TestamentToggle is an inline-size container, so it can't size to its
 * content; it takes the row's free space. Its track is pushed left to mirror
 * the page header above (title left, action right). The extra ancestor class
 * outranks TestamentToggle's own centered `justify-content`.
 */
.book-list-toolbar .book-list-toolbar--filter {
  flex: 1;
  min-width: 0;
  justify-content: flex-start;
}
</style>
