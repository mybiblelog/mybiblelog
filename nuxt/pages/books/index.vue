<template>
  <div class="content-column">
    <client-only>
      <reading-tracker-reset-card />
    </client-only>
    <bible-report :log-entries="logEntries" @view-book-report="viewBookReport($event)" />
  </div>
</template>

<script>
import BibleReport from '@/components/bible/BibleReport';
import ReadingTrackerResetCard from '@/components/ui/ReadingTrackerResetCard';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAppInitStore } from '~/stores/app-init';

export default {
  components: {
    BibleReport,
    ReadingTrackerResetCard,
  },
  middleware: ['auth'],
  async fetch() {
    await useAppInitStore().loadUserData();
  },
  head() {
    return {
      title: this.$t('page_title'),
    };
  },
  computed: {
    logEntriesStore() {
      return useLogEntriesStore();
    },
    logEntries() {
      return this.logEntriesStore.currentLogEntries;
    },
  },
  methods: {
    viewBookReport(bookIndex) {
      this.$router.push(this.localePath('/books/' + bookIndex));
    },
  },
};
</script>

<style>
</style>

<i18n lang="json">
{
  "en": {
    "page_title": "Bible Books"
  },
  "de": {
    "page_title": "Bibelbücher"
  },
  "es": {
    "page_title": "Libros de la Biblia"
  },
  "fr": {
    "page_title": "Livres de la Bible"
  },
  "ko": {
    "page_title": "성경 일람"
  },
  "pt": {
    "page_title": "Livros da Bíblia"
  },
  "uk": {
    "page_title": "Книги Біблії"
  }
}
</i18n>
