<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('books') }}
    </h2>
    <p class="insights-intro">
      {{ $t('description') }}
    </p>
    <p v-if="loading" class="insights-loading">
      {{ $t('loading') }}
    </p>
    <book-recency-list v-else :entries="entries" />
  </div>
</template>

<script>
import { useLogEntriesStore } from '~/stores/log-entries';
import BookRecencyList from '@/components/insights/BookRecencyList.vue';

export default {
  name: 'InsightsBooksPage',
  components: { BookRecencyList },
  middleware: ['auth'],
  data() {
    return {
      loading: false,
    };
  },
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  computed: {
    entries() {
      return useLogEntriesStore().logEntries;
    },
  },
  async mounted() {
    const store = useLogEntriesStore();
    if (store.logEntries.length === 0) {
      this.loading = true;
      try {
        await store.loadLogEntries();
      }
      finally {
        this.loading = false;
      }
    }
  },
};
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
  "en": { "books": "Books", "description": "How recently you last read from each book of the Bible.", "loading": "Loading your reading history…", "sort_by": "Sort by", "bible_order": "Bible order", "alphabetical": "Alphabetical", "most_recent": "Most recent", "least_recent": "Least recent", "last_read": "Last read", "never": "Never read" },
  "de": { "books": "Bücher", "description": "Wie kürzlich Sie zuletzt aus jedem Buch der Bibel gelesen haben.", "loading": "Ihr Leseverlauf wird geladen…", "sort_by": "Sortieren nach", "bible_order": "Bibelreihenfolge", "alphabetical": "Alphabetisch", "most_recent": "Zuletzt gelesen", "least_recent": "Am längsten her", "last_read": "Zuletzt gelesen", "never": "Nie gelesen" },
  "es": { "books": "Libros", "description": "Hace cuánto leíste por última vez cada libro de la Biblia.", "loading": "Cargando tu historial de lectura…", "sort_by": "Ordenar por", "bible_order": "Orden bíblico", "alphabetical": "Alfabético", "most_recent": "Más reciente", "least_recent": "Menos reciente", "last_read": "Última lectura", "never": "Nunca leído" },
  "fr": { "books": "Livres", "description": "À quand remonte votre dernière lecture de chaque livre de la Bible.", "loading": "Chargement de votre historique de lecture…", "sort_by": "Trier par", "bible_order": "Ordre biblique", "alphabetical": "Alphabétique", "most_recent": "Plus récent", "least_recent": "Moins récent", "last_read": "Dernière lecture", "never": "Jamais lu" },
  "ko": { "books": "책", "description": "성경 각 권을 마지막으로 읽은 지 얼마나 되었는지 보여줍니다.", "loading": "읽기 기록을 불러오는 중…", "sort_by": "정렬 기준", "bible_order": "성경 순서", "alphabetical": "알파벳순", "most_recent": "최근 읽음", "least_recent": "오래전 읽음", "last_read": "마지막으로 읽음", "never": "읽지 않음" },
  "pt": { "books": "Livros", "description": "Há quanto tempo você leu cada livro da Bíblia pela última vez.", "loading": "Carregando seu histórico de leitura…", "sort_by": "Ordenar por", "bible_order": "Ordem bíblica", "alphabetical": "Alfabético", "most_recent": "Mais recente", "least_recent": "Menos recente", "last_read": "Última leitura", "never": "Nunca lido" },
  "uk": { "books": "Книги", "description": "Як давно ви востаннє читали кожну книгу Біблії.", "loading": "Завантаження історії читання…", "sort_by": "Сортувати за", "bible_order": "Біблійний порядок", "alphabetical": "За алфавітом", "most_recent": "Найновіші", "least_recent": "Найдавніші", "last_read": "Востаннє читали", "never": "Не читали" }
}
</i18n>
