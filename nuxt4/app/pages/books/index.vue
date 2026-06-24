<template>
  <div class="content-column">
    <ClientOnly>
      <ReadingTrackerResetCard />
    </ClientOnly>
    <BibleReport :log-entries="logEntries" @view-book-report="viewBookReport" />
  </div>
</template>

<script setup lang="ts">
import BibleReport from '~/components/bible/BibleReport.vue';
import ReadingTrackerResetCard from '~/components/ui/ReadingTrackerResetCard.vue';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAppInitStore } from '~/stores/app-init';

definePageMeta({ middleware: ['auth'] });

const { t } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

useHead({ title: () => t('page_title') });

const logEntriesStore = useLogEntriesStore();
const logEntries = computed(() => logEntriesStore.currentLogEntries);

function viewBookReport(bookIndex: number) {
  router.push(localePath('/books/' + bookIndex));
}

onMounted(async () => {
  await useAppInitStore().loadUserData();
});
</script>

<i18n lang="json">
{
  "en": { "page_title": "Bible Books" },
  "de": { "page_title": "Bibelbücher" },
  "es": { "page_title": "Libros de la Biblia" },
  "fr": { "page_title": "Livres de la Bible" },
  "ko": { "page_title": "성경 일람" },
  "pt": { "page_title": "Livros da Bíblia" },
  "uk": { "page_title": "Книги Біблії" }
}
</i18n>
