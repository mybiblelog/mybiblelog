<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('books') }}
    </h2>
    <p class="insights-intro">
      {{ t('description') }}
    </p>
    <p v-if="loading" class="insights-loading">
      {{ t('loading') }}
    </p>
    <book-recency-list v-else :entries="entries" />
  </div>
</template>

<script setup lang="ts">
import BookRecencyList from '~/components/insights/BookRecencyList.vue';
import { useLogEntriesStore } from '~/stores/log-entries';

const { t } = useI18n();
const store = useLogEntriesStore();
const entries = computed(() => store.logEntries);
const loading = ref(false);

onMounted(async () => {
  if (store.logEntries.length === 0) {
    loading.value = true;
    try {
      await store.loadLogEntries();
    }
    finally {
      loading.value = false;
    }
  }
});
</script>

<style scoped>
.insights-intro {
  margin-bottom: 1.5rem;
  color: var(--mbl-text-body);
}

.insights-loading {
  color: var(--mbl-text-muted);
}
</style>

<i18n lang="json">
{
  "en":{
    "books":"Books",
    "description":"How recently you last read from each book of the Bible.",
    "loading":"Loading your reading history…"
  },
  "de":{
    "books":"Bücher",
    "description":"Wie kürzlich Sie zuletzt aus jedem Buch der Bibel gelesen haben.",
    "loading":"Ihr Leseverlauf wird geladen…"
  },
  "es":{
    "books":"Libros",
    "description":"Hace cuánto leíste por última vez cada libro de la Biblia.",
    "loading":"Cargando tu historial de lectura…"
  },
  "fr":{
    "books":"Livres",
    "description":"À quand remonte votre dernière lecture de chaque livre de la Bible.",
    "loading":"Chargement de votre historique de lecture…"
  },
  "ko":{
    "books":"책",
    "description":"성경 각 권을 마지막으로 읽은 지 얼마나 되었는지 보여줍니다.",
    "loading":"읽기 기록을 불러오는 중…"
  },
  "pt":{
    "books":"Livros",
    "description":"Há quanto tempo você leu cada livro da Bíblia pela última vez.",
    "loading":"Carregando seu histórico de leitura…"
  },
  "uk":{
    "books":"Книги",
    "description":"Як давно ви востаннє читали кожну книгу Біблії.",
    "loading":"Завантаження історії читання…"
  }
}
</i18n>
