<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('trend') }}
    </h2>
    <p class="insights-intro">
      {{ t('description') }}
    </p>
    <p v-if="loading" class="insights-loading">
      {{ t('loading') }}
    </p>
    <daily-verses-chart v-else :entries="entries" />
  </div>
</template>

<script setup lang="ts">
import DailyVersesChart from '~/components/insights/DailyVersesChart.vue';
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
  margin-bottom: var(--mbl-space-xl);
  color: var(--mbl-text-body);
}

.insights-loading {
  color: var(--mbl-text-muted);
}
</style>

<i18n lang="json">
{
  "en": {
    "trend": "Trend",
    "description": "Verses read over your chosen time window, summarized by day or by week.",
    "loading": "Loading your reading history…"
  },
  "de": {
    "trend": "Verlauf",
    "description": "Gelesene Verse über den gewählten Zeitraum, zusammengefasst nach Tag oder Woche.",
    "loading": "Ihr Leseverlauf wird geladen…"
  },
  "es": {
    "trend": "Tendencia",
    "description": "Versículos leídos durante el período elegido, resumidos por día o por semana.",
    "loading": "Cargando tu historial de lectura…"
  },
  "fr": {
    "trend": "Tendance",
    "description": "Versets lus sur la période choisie, résumés par jour ou par semaine.",
    "loading": "Chargement de votre historique de lecture…"
  },
  "ko": {
    "trend": "추세",
    "description": "선택한 기간 동안 읽은 구절 수를 일별 또는 주별로 요약합니다.",
    "loading": "읽기 기록을 불러오는 중…"
  },
  "pt": {
    "trend": "Tendência",
    "description": "Versículos lidos no período escolhido, resumidos por dia ou por semana.",
    "loading": "Carregando seu histórico de leitura…"
  },
  "uk": {
    "trend": "Тренд",
    "description": "Віршів прочитано за вибраний період, підсумовано по днях або тижнях.",
    "loading": "Завантаження історії читання…"
  }
}
</i18n>
