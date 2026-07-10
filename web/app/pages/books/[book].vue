<template>
  <div class="content-column">
    <book-report
      :log-entries="logEntries"
      :book-index="bookIndex"
      @exit-book-report="handleExitBookReport"
      @view-book-notes="handleViewBookNotes"
      @view-book-log="handleViewBookLog"
    />
  </div>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import { encodeLogEntriesQueryToRoute } from '~/helpers/log-entries-route-query';
import BookReport from '~/components/bible/BookReport.vue';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAppInitStore } from '~/stores/app-init';

definePageMeta({ middleware: ['auth'] });

const { locale } = useI18n();
const localePath = useLocalePath();
const router = useRouter();
const route = useRoute();

const bookIndex = computed(() => Number(route.params.book));

useHead({ title: () => Bible.getBookName(bookIndex.value, locale.value) });

const logEntriesStore = useLogEntriesStore();
const logEntries = computed(() => logEntriesStore.currentLogEntries);

function handleExitBookReport() {
  router.push(localePath('/books'));
}

function handleViewBookNotes() {
  const query = encodePassageNotesQueryToRoute({
    filterPassageStartVerseId: Bible.getFirstBookVerseId(bookIndex.value),
    filterPassageEndVerseId: Bible.getLastBookVerseId(bookIndex.value),
    filterPassageMatching: 'exclusive',
    offset: 0,
  });
  router.push({ path: localePath('/notes'), query });
}

function handleViewBookLog() {
  const query = encodeLogEntriesQueryToRoute({
    filterPassageStartVerseId: Bible.getFirstBookVerseId(bookIndex.value),
    filterPassageEndVerseId: Bible.getLastBookVerseId(bookIndex.value),
    offset: 0,
  });
  router.push({ path: localePath('/log'), query });
}

onMounted(async () => {
  await useAppInitStore().loadUserData();
});
</script>
