<template>
  <main>
    <section class="mbl-section">
      <div class="mbl-container">
        <h1 class="mbl-title">
          {{ t('title') }}
        </h1>
        <div class="mbl-content">
          <template v-if="loading">
            <p>{{ t('loading') }}</p>
          </template>
          <template v-else>
            <engagement-chart :rows="engagementData" />
            <div class="mbl-table-wrap">
              <table class="mbl-table mbl-table--narrow mbl-table--striped engagement-table">
                <thead>
                  <tr>
                    <th>{{ t('column_date') }}</th>
                    <th class="engagement-table__num">
                      {{ t('column_new') }}
                    </th>
                    <th class="engagement-table__num">
                      {{ t('column_web') }}
                    </th>
                    <th class="engagement-table__num">
                      {{ t('column_android') }}
                    </th>
                    <th class="engagement-table__num">
                      {{ t('column_ios') }}
                    </th>
                    <th class="engagement-table__num">
                      {{ t('column_logged') }}
                    </th>
                    <th class="engagement-table__num">
                      {{ t('column_notes') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in engagementData" :key="index">
                    <td>{{ formatShortDate(row.date) }}</td>
                    <td class="engagement-table__num">
                      {{ row.newUserAccounts }}
                    </td>
                    <td class="engagement-table__num">
                      {{ row.newUserAccountsByPlatform.web }}
                    </td>
                    <td class="engagement-table__num">
                      {{ row.newUserAccountsByPlatform.android }}
                    </td>
                    <td class="engagement-table__num">
                      {{ row.newUserAccountsByPlatform.ios }}
                    </td>
                    <td class="engagement-table__num">
                      {{ row.usersWithLogEntry }}
                    </td>
                    <td class="engagement-table__num">
                      {{ row.usersWithNote }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import EngagementChart from '~/components/admin/EngagementChart.vue';
import { useDialogStore } from '~/stores/dialog';

definePageMeta({ middleware: ['auth'], auth: 'admin' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

interface EngagementRow {
  date: string;
  newUserAccounts: number;
  newUserAccountsByPlatform: { web: number; android: number; ios: number };
  usersWithLogEntry: number;
  usersWithNote: number;
}

const { $http } = useNuxtApp();
const { t, locale } = useI18n();
const dialogStore = useDialogStore();

const loading = ref(true);
const engagementData = ref<EngagementRow[]>([]);

function formatShortDate(date: string) {
  return dayjs(date).locale(locale.value).format('MMM D');
}

onMounted(async () => {
  try {
    const { data } = await $http.get<EngagementRow[]>('/api/admin/reports/user-engagement/past-week');
    engagementData.value = data;
  }
  catch {
    await dialogStore.alert({ message: t('error_loading') });
  }
  loading.value = false;
});
</script>

<style scoped>
/*
 * mbl-table-wrap lets the table scroll horizontally instead of squeezing
 * columns unreadably narrow on small screens; --narrow keeps per-row padding
 * tight so as many dates as possible are visible without scrolling. The date
 * column stays pinned during that scroll so a row's date is never lost.
 */
.engagement-table {
  font-size: 0.9em;
}

.engagement-table td {
  white-space: nowrap;
}

.engagement-table th:first-child,
.engagement-table td:first-child {
  background: var(--mbl-bg);
  left: 0;
  position: sticky;
}

.engagement-table tbody tr:nth-child(even) td:first-child {
  background: var(--mbl-bg-subtle);
}

.engagement-table__num {
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "Past Week Engagement",
    "loading": "Loading...",
    "column_date": "Date",
    "column_new": "New Users",
    "column_web": "New Web",
    "column_android": "New Android",
    "column_ios": "New iOS",
    "column_logged": "Log Entry Users",
    "column_notes": "Notes Users",
    "error_loading": "Error loading engagement data."
  },
  "de": {
    "title": "Engagement der letzten Woche",
    "loading": "Lädt...",
    "column_date": "Datum",
    "column_new": "Neue Nutzer",
    "column_web": "Neue Web",
    "column_android": "Neue Android",
    "column_ios": "Neue iOS",
    "column_logged": "Nutzer mit Eintrag",
    "column_notes": "Nutzer mit Notiz",
    "error_loading": "Fehler beim Laden der Engagement-Daten."
  },
  "es": {
    "title": "Participación de la Última Semana",
    "loading": "Cargando...",
    "column_date": "Fecha",
    "column_new": "Usuarios Nuevos",
    "column_web": "Nuevos Web",
    "column_android": "Nuevos Android",
    "column_ios": "Nuevos iOS",
    "column_logged": "Usuarios con Registro",
    "column_notes": "Usuarios con Nota",
    "error_loading": "Error al cargar los datos de participación."
  },
  "fr": {
    "title": "Engagement de la Semaine Passée",
    "loading": "Chargement...",
    "column_date": "Date",
    "column_new": "Nouveaux Utilisateurs",
    "column_web": "Nouveaux Web",
    "column_android": "Nouveaux Android",
    "column_ios": "Nouveaux iOS",
    "column_logged": "Utilisateurs avec Entrée",
    "column_notes": "Utilisateurs avec Note",
    "error_loading": "Erreur lors du chargement des données d'engagement."
  },
  "ko": {
    "title": "지난 주 참여",
    "loading": "불러오는 중…",
    "column_date": "날짜",
    "column_new": "신규 사용자",
    "column_web": "신규 웹",
    "column_android": "신규 안드로이드",
    "column_ios": "신규 iOS",
    "column_logged": "기록 작성 사용자",
    "column_notes": "노트 작성 사용자",
    "error_loading": "참여 데이터를 불러오지 못했습니다."
  },
  "pt": {
    "title": "Engajamento da Última Semana",
    "loading": "Carregando...",
    "column_date": "Data",
    "column_new": "Novos Usuários",
    "column_web": "Novos Web",
    "column_android": "Novos Android",
    "column_ios": "Novos iOS",
    "column_logged": "Usuários com Registro",
    "column_notes": "Usuários com Nota",
    "error_loading": "Erro ao carregar os dados de engajamento."
  },
  "uk": {
    "title": "Залученість за минулий тиждень",
    "loading": "Завантаження...",
    "column_date": "Дата",
    "column_new": "Нові користувачі",
    "column_web": "Нові Web",
    "column_android": "Нові Android",
    "column_ios": "Нові iOS",
    "column_logged": "Користувачі із записом",
    "column_notes": "Користувачі з нотаткою",
    "error_loading": "Помилка завантаження даних про залученість."
  }
}
</i18n>
