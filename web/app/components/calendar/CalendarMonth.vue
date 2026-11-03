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
import { buildMonthGrid, parseISODate, todayISODate } from '@mybiblelog/shared';
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

const todayStr = todayISODate();
// Any day in the displayed month, as YYYY-MM-DD.
const selectedDate = ref(todayStr);
const selectedDay = ref(todayStr);

const selectedMonth = computed(() => parseISODate(selectedDate.value)!);
const month = computed(() => selectedMonth.value.month);
const year = computed(() => selectedMonth.value.year);

const days = computed(() => buildMonthGrid({
  year: year.value,
  month: month.value,
  dailyVerseCountGoal: props.dailyVerseCountGoal,
  trackerStartDate: props.trackerStartDate,
  getDateVerseCounts: props.getDateVerseCounts,
}));

function selectDate(newDate: string) {
  selectedDate.value = newDate;
  const firstMonthDay = `${newDate.slice(0, 7)}-01`;
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
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: var(--mbl-space-md);
}

@media screen and (max-width: 380px) {
  .calendar-month-header {
    flex-direction: column;
    text-align: center;
    align-items: stretch;
  }
}

.day-of-week {
  color: var(--mbl-text-body);
  font-size: 18px;
  padding-bottom: var(--mbl-space-2xs);
  padding-top: var(--mbl-space-xs);
}
.day-of-week, .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); }

.days-grid {
  height: 100%;
  position: relative;
  background-color: var(--mbl-calendar-grid-inner);
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- hairline grid rule, not spacing */
  gap: 1px;
  border: solid 1px var(--mbl-calendar-grid-outer);
  border-radius: var(--mbl-radius-sm);
  overflow: hidden;
}
</style>
