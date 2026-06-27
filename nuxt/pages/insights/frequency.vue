<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('frequency') }}
    </h2>
    <p class="insights-intro">
      {{ $t('description') }}
    </p>
    <p v-if="loading" class="insights-loading">
      {{ $t('loading') }}
    </p>
    <book-frequency-chart v-else :entries="entries" />
  </div>
</template>

<script>
import { useLogEntriesStore } from '~/stores/log-entries';
import BookFrequencyChart from '@/components/insights/BookFrequencyChart.vue';

export default {
  name: 'InsightsFrequencyPage',
  components: { BookFrequencyChart },
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
  "en": { "frequency": "Frequency", "description": "How much you've read from each book within a timeframe.", "loading": "Loading your reading history…", "timeframe": "Timeframe", "last_n_days": "Last {count} days", "metric": "Metric", "raw_counts": "Verse counts", "proportional": "Proportional", "sort_by": "Sort by", "bible_order": "Bible order", "alphabetical": "Alphabetical", "most_read": "Most read", "least_read": "Least read" },
  "de": { "frequency": "Häufigkeit", "description": "Wie viel Sie in einem Zeitraum aus jedem Buch gelesen haben.", "loading": "Ihr Leseverlauf wird geladen…", "timeframe": "Zeitraum", "last_n_days": "Letzte {count} Tage", "metric": "Messwert", "raw_counts": "Verszahlen", "proportional": "Anteilig", "sort_by": "Sortieren nach", "bible_order": "Bibelreihenfolge", "alphabetical": "Alphabetisch", "most_read": "Meist gelesen", "least_read": "Am wenigsten gelesen" },
  "es": { "frequency": "Frecuencia", "description": "Cuánto has leído de cada libro dentro de un período.", "loading": "Cargando tu historial de lectura…", "timeframe": "Período", "last_n_days": "Últimos {count} días", "metric": "Métrica", "raw_counts": "Recuento de versículos", "proportional": "Proporcional", "sort_by": "Ordenar por", "bible_order": "Orden bíblico", "alphabetical": "Alfabético", "most_read": "Más leídos", "least_read": "Menos leídos" },
  "fr": { "frequency": "Fréquence", "description": "Combien vous avez lu de chaque livre sur une période donnée.", "loading": "Chargement de votre historique de lecture…", "timeframe": "Période", "last_n_days": "{count} derniers jours", "metric": "Mesure", "raw_counts": "Nombre de versets", "proportional": "Proportionnel", "sort_by": "Trier par", "bible_order": "Ordre biblique", "alphabetical": "Alphabétique", "most_read": "Plus lus", "least_read": "Moins lus" },
  "ko": { "frequency": "빈도", "description": "특정 기간 동안 각 책을 얼마나 읽었는지 보여줍니다.", "loading": "읽기 기록을 불러오는 중…", "timeframe": "기간", "last_n_days": "최근 {count}일", "metric": "지표", "raw_counts": "구절 수", "proportional": "비율", "sort_by": "정렬 기준", "bible_order": "성경 순서", "alphabetical": "알파벳순", "most_read": "많이 읽음", "least_read": "적게 읽음" },
  "pt": { "frequency": "Frequência", "description": "Quanto você leu de cada livro dentro de um período.", "loading": "Carregando seu histórico de leitura…", "timeframe": "Período", "last_n_days": "Últimos {count} dias", "metric": "Métrica", "raw_counts": "Contagem de versículos", "proportional": "Proporcional", "sort_by": "Ordenar por", "bible_order": "Ordem bíblica", "alphabetical": "Alfabético", "most_read": "Mais lidos", "least_read": "Menos lidos" },
  "uk": { "frequency": "Частота", "description": "Скільки ви прочитали з кожної книги за певний період.", "loading": "Завантаження історії читання…", "timeframe": "Період", "last_n_days": "Останні {count} днів", "metric": "Показник", "raw_counts": "Кількість віршів", "proportional": "Пропорційно", "sort_by": "Сортувати за", "bible_order": "Біблійний порядок", "alphabetical": "За алфавітом", "most_read": "Найбільше читали", "least_read": "Найменше читали" }
}
</i18n>
