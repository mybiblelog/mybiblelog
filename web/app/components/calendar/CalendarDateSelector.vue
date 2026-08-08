<template>
  <div class="calendar-date-selector">
    <span class="prev" @click="selectPrevious"><triangle-left-icon class="icon" /></span>
    <span class="today" @click="selectCurrent">{{ t('today') }}</span>
    <span class="next" @click="selectNext"><triangle-right-icon class="icon" /></span>
  </div>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';
import TriangleLeftIcon from '~/components/svg/TriangleLeftIcon.vue';
import TriangleRightIcon from '~/components/svg/TriangleRightIcon.vue';

const props = defineProps<{ currentDate: string; selectedDate: Dayjs }>();
const emit = defineEmits<{ dateSelected: [date: Dayjs]; daySelected: [date: string | null] }>();
const { t } = useI18n();

function selectPrevious() {
  emit('dateSelected', dayjs(props.selectedDate).subtract(1, 'month'));
  emit('daySelected', null);
}
function selectCurrent() {
  emit('dateSelected', dayjs(props.currentDate));
  emit('daySelected', dayjs().format('YYYY-MM-DD'));
}
function selectNext() {
  emit('dateSelected', dayjs(props.selectedDate).add(1, 'month'));
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
