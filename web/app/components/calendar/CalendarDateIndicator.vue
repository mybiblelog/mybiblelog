<template>
  <div class="calendar-date-indicator">
    <div class="mbl-title">
      {{ selectedMonth }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCalendarDate } from '@mybiblelog/shared';

// Any day in the displayed month, as YYYY-MM-DD.
const props = defineProps<{ selectedDate: string }>();
const { locale } = useI18n();

const selectedMonth = computed(() => {
  const month = formatCalendarDate(props.selectedDate, locale.value, { month: 'long' });
  return `${month} ${props.selectedDate.slice(0, 4)}`;
});
</script>

<style scoped>
.calendar-date-indicator .mbl-title { margin-bottom: 0; }
</style>
