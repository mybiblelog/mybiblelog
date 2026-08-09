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
            <div class="mbl-table-wrap">
              <table class="mbl-table mbl-table--narrow mbl-table--striped">
                <thead>
                  <tr>
                    <th>{{ t('column_date') }}</th>
                    <th>{{ t('column_new_users') }}</th>
                    <th>{{ t('column_log_entry_users') }}</th>
                    <th>{{ t('column_note_users') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in engagementData" :key="index">
                    <td>{{ formatDate(row.date) }}</td>
                    <td>{{ row.newUserAccounts }}</td>
                    <td>{{ row.usersWithLogEntry }}</td>
                    <td>{{ row.usersWithNote }}</td>
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
import { displayDate } from '@mybiblelog/shared';
import { useDialogStore } from '~/stores/dialog';

definePageMeta({ middleware: ['auth'], auth: 'admin' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

interface EngagementRow {
  date: string;
  newUserAccounts: number;
  usersWithLogEntry: number;
  usersWithNote: number;
}

const { $http } = useNuxtApp();
const { t, locale } = useI18n();
const dialogStore = useDialogStore();

const loading = ref(true);
const engagementData = ref<EngagementRow[]>([]);

function formatDate(date: string) {
  return displayDate(date, locale.value);
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

<i18n lang="json">
{
  "en": {
    "title": "Past Week Engagement",
    "loading": "Loading...",
    "column_date": "Date",
    "column_new_users": "New Users",
    "column_log_entry_users": "Log Entry Users",
    "column_note_users": "Note Users",
    "error_loading": "Error loading engagement data."
  },
  "de": {
    "title": "Engagement der letzten Woche",
    "loading": "Lädt...",
    "column_date": "Datum",
    "column_new_users": "Neue Benutzer",
    "column_log_entry_users": "Benutzer mit Eintrag",
    "column_note_users": "Benutzer mit Notiz",
    "error_loading": "Fehler beim Laden der Engagement-Daten."
  },
  "es": {
    "title": "Participación de la Última Semana",
    "loading": "Cargando...",
    "column_date": "Fecha",
    "column_new_users": "Usuarios Nuevos",
    "column_log_entry_users": "Usuarios con Registro",
    "column_note_users": "Usuarios con Nota",
    "error_loading": "Error al cargar los datos de participación."
  },
  "fr": {
    "title": "Engagement de la Semaine Passée",
    "loading": "Chargement...",
    "column_date": "Date",
    "column_new_users": "Nouveaux Utilisateurs",
    "column_log_entry_users": "Utilisateurs avec Entrée",
    "column_note_users": "Utilisateurs avec Note",
    "error_loading": "Erreur lors du chargement des données d'engagement."
  },
  "ko": {
    "title": "지난 주 참여",
    "loading": "불러오는 중…",
    "column_date": "날짜",
    "column_new_users": "신규 사용자",
    "column_log_entry_users": "기록 작성 사용자",
    "column_note_users": "노트 작성 사용자",
    "error_loading": "참여 데이터를 불러오지 못했습니다."
  },
  "pt": {
    "title": "Engajamento da Última Semana",
    "loading": "Carregando...",
    "column_date": "Data",
    "column_new_users": "Novos Usuários",
    "column_log_entry_users": "Usuários com Registro",
    "column_note_users": "Usuários com Nota",
    "error_loading": "Erro ao carregar os dados de engajamento."
  },
  "uk": {
    "title": "Залученість за минулий тиждень",
    "loading": "Завантаження...",
    "column_date": "Дата",
    "column_new_users": "Нові користувачі",
    "column_log_entry_users": "Користувачі із записом",
    "column_note_users": "Користувачі з нотаткою",
    "error_loading": "Помилка завантаження даних про залученість."
  }
}
</i18n>
