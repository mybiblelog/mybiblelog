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

<script setup lang="ts">
import BookFrequencyChart from '~/components/insights/BookFrequencyChart.vue';
import { useLogEntriesStore } from '~/stores/log-entries';

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
    "frequency":"Frequency",
    "description":"How much you've read from each book within a timeframe.",
    "loading":"Loading your reading history…"
  },
  "de":{
    "frequency":"Häufigkeit",
    "description":"Wie viel Sie in einem Zeitraum aus jedem Buch gelesen haben.",
    "loading":"Ihr Leseverlauf wird geladen…"
  },
  "es":{
    "frequency":"Frecuencia",
    "description":"Cuánto has leído de cada libro dentro de un período.",
    "loading":"Cargando tu historial de lectura…"
  },
  "fr":{
    "frequency":"Fréquence",
    "description":"Combien vous avez lu de chaque livre sur une période donnée.",
    "loading":"Chargement de votre historique de lecture…"
  },
  "ko":{
    "frequency":"빈도",
    "description":"특정 기간 동안 각 책을 얼마나 읽었는지 보여줍니다.",
    "loading":"읽기 기록을 불러오는 중…"
  },
  "pt":{
    "frequency":"Frequência",
    "description":"Quanto você leu de cada livro dentro de um período.",
    "loading":"Carregando seu histórico de leitura…"
  },
  "uk":{
    "frequency":"Частота",
    "description":"Скільки ви прочитали з кожної книги за певний період.",
    "loading":"Завантаження історії читання…"
  }
}
</i18n>
