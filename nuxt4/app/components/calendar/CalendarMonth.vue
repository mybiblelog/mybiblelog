<template>
  <div class="calendar-month">
    <div class="calendar-month-header">
      <calendar-date-indicator :selected-date="selectedDate" class="calendar-month-header-selected-month" />
      <calendar-date-selector
        :current-date="todayStr"
        :selected-date="selectedDate"
        @date-selected="selectDate"
        @day-selected="selectDay"
      />
    </div>
    <calendar-weekdays />
    <ol class="days-grid">
      <calendar-month-day-item
        v-for="day in days"
        :key="selectedDate + ':' + day.date"
        :day="day"
        :is-today="day.date === todayStr"
        :is-selected="day.date === selectedDay"
        :primary-percentage="day.uniqueVerseCountPercentage"
        :secondary-percentage="day.totalVerseCountPercentage"
        @day-selected="selectDay"
      />
    </ol>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { buildMonthGrid } from '@mybiblelog/shared';
import CalendarMonthDayItem from '~/components/calendar/CalendarMonthDayItem.vue';
import CalendarDateIndicator from '~/components/calendar/CalendarDateIndicator.vue';
import CalendarDateSelector from '~/components/calendar/CalendarDateSelector.vue';
import CalendarWeekdays from '~/components/calendar/CalendarWeekdays.vue';
import type { DateVerseCounts } from '~/stores/date-verse-counts';

const props = defineProps<{
  getDateVerseCounts:(date: string) => DateVerseCounts;
  dailyVerseCountGoal: number;
  trackerStartDate?: string;
}>();

const emit = defineEmits<{ daySelected: [date: string | null] }>();

const todayStr = dayjs().format('YYYY-MM-DD');
const selectedDate = ref(dayjs());
const selectedDay = ref(todayStr);

const month = computed(() => Number(selectedDate.value.format('M')));
const year = computed(() => Number(selectedDate.value.format('YYYY')));

const days = computed(() => buildMonthGrid({
  year: year.value,
  month: month.value,
  dailyVerseCountGoal: props.dailyVerseCountGoal,
  trackerStartDate: props.trackerStartDate,
  getDateVerseCounts: props.getDateVerseCounts,
}));

function selectDate(newDate: ReturnType<typeof dayjs>) {
  selectedDate.value = newDate;
  const firstMonthDay = dayjs(newDate).date(1).format('YYYY-MM-DD');
  selectDay(firstMonthDay);
}

function selectDay(date: string | null) {
  selectedDay.value = date ?? '';
  emit('daySelected', date);
}
</script>

<style scoped>
.calendar-month { position: relative; color: var(--mbl-text); }
.calendar-month ol, .calendar-month li { padding: 0; margin: 0; list-style: none; }
.calendar-month-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-bottom: 10px;
}
@media screen and (max-width: 380px) {
  .calendar-month-header { flex-direction: column; text-align: center; }
}
.day-of-week {
  color: var(--mbl-text-body);
  font-size: 18px;
  padding-bottom: 5px;
  padding-top: 10px;
}
.day-of-week, .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.day-of-week > * { text-align: right; padding-right: 5px; }
.days-grid {
  height: 100%;
  position: relative;
  background-color: var(--mbl-calendar-grid-inner);
  grid-column-gap: 1px;
  grid-row-gap: 1px;
  border: solid 1px var(--mbl-calendar-grid-outer);
}
</style>
