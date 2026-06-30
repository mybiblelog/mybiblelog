<template>
  <main>
    <section class="mbl-section">
      <div class="mbl-container">
        <h1 class="mbl-title">
          Past Week Engagement
        </h1>
        <div class="mbl-content">
          <template v-if="loading">
            <p>Loading...</p>
          </template>
          <template v-else>
            <div class="mbl-table-wrap">
              <table class="mbl-table mbl-table--narrow mbl-table--striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>New Users</th>
                    <th>Log Entry Users</th>
                    <th>Note Users</th>
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
const { locale } = useI18n();
const dialogStore = useDialogStore();

const loading = ref(true);
const engagementData = ref<EngagementRow[]>([]);

function formatDate(date: string) {
  return displayDate(date, locale.value);
}

onMounted(async () => {
  try {
    const { data } = await $http.get('/api/admin/reports/user-engagement/past-week');
    engagementData.value = data;
  }
  catch {
    await dialogStore.alert({ message: 'Error loading engagement data.' });
  }
  loading.value = false;
});
</script>
