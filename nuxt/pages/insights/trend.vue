<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('trend') }}
    </h2>
    <p class="insights-intro">
      {{ $t('description') }}
    </p>
    <p v-if="loading" class="insights-loading">
      {{ $t('loading') }}
    </p>
    <daily-verses-chart v-else :entries="entries" />
  </div>
</template>

<script>
import { useLogEntriesStore } from '~/stores/log-entries';
import DailyVersesChart from '@/components/insights/DailyVersesChart.vue';

export default {
  name: 'InsightsTrendPage',
  components: { DailyVersesChart },
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
  "en": { "trend": "Trend", "description": "Verses read each day over your chosen time window.", "loading": "Loading your reading history…" },
  "de": { "trend": "Verlauf", "description": "Pro Tag gelesene Verse über den gewählten Zeitraum.", "loading": "Ihr Leseverlauf wird geladen…" },
  "es": { "trend": "Tendencia", "description": "Versículos leídos cada día durante el período elegido.", "loading": "Cargando tu historial de lectura…" },
  "fr": { "trend": "Tendance", "description": "Versets lus chaque jour sur la période choisie.", "loading": "Chargement de votre historique de lecture…" },
  "ko": { "trend": "추세", "description": "선택한 기간 동안 매일 읽은 구절 수입니다.", "loading": "읽기 기록을 불러오는 중…" },
  "pt": { "trend": "Tendência", "description": "Versículos lidos a cada dia no período escolhido.", "loading": "Carregando seu histórico de leitura…" },
  "uk": { "trend": "Тренд", "description": "Віршів прочитано щодня за вибраний період.", "loading": "Завантаження історії читання…" }
}
</i18n>
