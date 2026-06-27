<template>
  <div class="calendar-date-indicator">
    <div class="mbl-title mbl-title--4">
      {{ selectedMonth }}
      <InfoLink :to="localePath('/about/page-features--calendar')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import InfoLink from '~/components/ui/InfoLink.vue';

const props = defineProps<{ selectedDate: Dayjs }>();
const { locale } = useI18n();
const localePath = useLocalePath();

const selectedMonth = computed(() => {
  const jsDate = props.selectedDate.toDate();
  const month = jsDate.toLocaleString(locale.value, { month: 'long' });
  return `${month} ${jsDate.getFullYear()}`;
});
</script>

<style scoped>
.calendar-date-indicator .mbl-title { margin-bottom: 0; }
</style>
