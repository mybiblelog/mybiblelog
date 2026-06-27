<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('activity') }}
    </h2>
    <p class="insights-intro">
      {{ $t('description') }}
    </p>
    <p v-if="loading" class="insights-loading">
      {{ $t('loading') }}
    </p>
    <ContributionHeatmap v-else :entries="entries" />
  </div>
</template>

<script setup lang="ts">
import ContributionHeatmap from '~/components/insights/ContributionHeatmap.vue';
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
    "activity":"Activity",
    "description":"Each square is a day over the past year. Greener squares mean more verses read.",
    "loading":"Loading your reading history…"
  },
  "de":{
    "activity":"Aktivität",
    "description":"Jedes Quadrat ist ein Tag im vergangenen Jahr. Grünere Quadrate bedeuten mehr gelesene Verse.",
    "loading":"Ihr Leseverlauf wird geladen…"
  },
  "es":{
    "activity":"Actividad",
    "description":"Cada cuadro es un día del último año. Los cuadros más verdes indican más versículos leídos.",
    "loading":"Cargando tu historial de lectura…"
  },
  "fr":{
    "activity":"Activité",
    "description":"Chaque carré représente un jour de l'année écoulée. Les carrés plus verts signifient plus de versets lus.",
    "loading":"Chargement de votre historique de lecture…"
  },
  "ko":{
    "activity":"활동",
    "description":"각 칸은 지난 1년간의 하루입니다. 더 진한 초록색은 더 많은 구절을 읽었음을 의미합니다.",
    "loading":"읽기 기록을 불러오는 중…"
  },
  "pt":{
    "activity":"Atividade",
    "description":"Cada quadrado é um dia no último ano. Quadrados mais verdes significam mais versículos lidos.",
    "loading":"Carregando seu histórico de leitura…"
  },
  "uk":{
    "activity":"Активність",
    "description":"Кожен квадрат — це день за минулий рік. Зеленіші квадрати означають більше прочитаних віршів.",
    "loading":"Завантаження історії читання…"
  }
}
</i18n>
