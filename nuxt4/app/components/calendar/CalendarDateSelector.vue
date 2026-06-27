<template>
  <div class="calendar-date-selector">
    <span class="prev" @click="selectPrevious"><div class="icon" /></span>
    <span class="today" @click="selectCurrent">{{ t('today') }}</span>
    <span class="next" @click="selectNext"><div class="icon" /></span>
  </div>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';

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
  align-items: center;
  color: var(--mbl-text-body);
  margin: 0 -1rem;
}
.calendar-date-selector > * { cursor: pointer; user-select: none; }
.today { padding: 5px 0.5rem; }
.prev, .next { display: flex; justify-content: center; align-items: center; padding: 0 1rem; }
.prev .icon { width: 0; height: 0; border-left: 0; border-top: 0.5rem solid transparent; border-bottom: 0.5rem solid transparent; border-right: 1rem solid var(--mbl-border-strong); }
.next .icon { width: 0; height: 0; border-right: 0; border-top: 0.5rem solid transparent; border-bottom: 0.5rem solid transparent; border-left: 1rem solid var(--mbl-border-strong); }
</style>

<i18n lang="json">
{
  "en": { "today": "Today" },
  "de": { "today": "Heute" },
  "es": { "today": "Hoy" },
  "fr": { "today": "Aujourd'hui" },
  "ko": { "today": "오늘" },
  "pt": { "today": "Hoje" },
  "uk": { "today": "Сьогодні" }
}
</i18n>
