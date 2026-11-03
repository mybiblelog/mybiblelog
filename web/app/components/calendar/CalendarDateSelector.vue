<template>
  <div class="calendar-date-selector">
    <span class="prev" data-testid="calendar-prev-month" @click="selectPrevious"><triangle-left-icon class="icon" /></span>
    <span class="today" data-testid="calendar-today" @click="selectCurrent">{{ t('today') }}</span>
    <span class="next" data-testid="calendar-next-month" @click="selectNext"><triangle-right-icon class="icon" /></span>
  </div>
</template>

<script setup lang="ts">
import { addMonths, todayISODate } from '@mybiblelog/shared';
import TriangleLeftIcon from '~/components/svg/TriangleLeftIcon.vue';
import TriangleRightIcon from '~/components/svg/TriangleRightIcon.vue';

// Dates are YYYY-MM-DD; `selectedDate` is any day in the displayed month.
const props = defineProps<{ currentDate: string; selectedDate: string }>();
const emit = defineEmits<{ dateSelected: [date: string]; daySelected: [date: string | null] }>();
const { t } = useI18n();

function selectPrevious() {
  emit('dateSelected', addMonths(props.selectedDate, -1));
  emit('daySelected', null);
}
function selectCurrent() {
  emit('dateSelected', props.currentDate);
  emit('daySelected', todayISODate());
}
function selectNext() {
  emit('dateSelected', addMonths(props.selectedDate, 1));
  emit('daySelected', null);
}
</script>

<style scoped>
.calendar-date-selector {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  color: var(--mbl-text-body);
  margin: 0 calc(-1 * var(--mbl-space-md));
}
.calendar-date-selector > * { cursor: pointer; user-select: none; }
.today { padding: var(--mbl-space-2xs) var(--mbl-space-xs); }
.prev, .next { display: flex; justify-content: center; align-items: center; padding: 0 var(--mbl-space-md); }
.prev .icon, .next .icon { display: block; }
</style>

<i18n lang="json">
{
  "en": {
    "today": "Today"
  },
  "de": {
    "today": "Heute"
  },
  "es": {
    "today": "Hoy"
  },
  "fr": {
    "today": "Aujourd'hui"
  },
  "ko": {
    "today": "오늘"
  },
  "pt": {
    "today": "Hoje"
  },
  "uk": {
    "today": "Сьогодні"
  }
}
</i18n>
