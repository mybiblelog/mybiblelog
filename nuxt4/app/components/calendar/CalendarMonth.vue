<template>
  <div class="calendar-month">
    <div class="calendar-month-header">
      <CalendarDateIndicator :selected-date="selectedDate" class="calendar-month-header-selected-month" />
      <CalendarDateSelector
        :current-date="todayStr"
        :selected-date="selectedDate"
        @date-selected="selectDate"
        @day-selected="selectDay"
      />
    </div>
    <CalendarWeekdays />
    <ol class="days-grid">
      <CalendarMonthDayItem
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
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import CalendarMonthDayItem from '~/components/calendar/CalendarMonthDayItem.vue';
import CalendarDateIndicator from '~/components/calendar/CalendarDateIndicator.vue';
import CalendarDateSelector from '~/components/calendar/CalendarDateSelector.vue';
import CalendarWeekdays from '~/components/calendar/CalendarWeekdays.vue';
import type { DateVerseCounts } from '~/stores/date-verse-counts';

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

const props = defineProps<{
  getDateVerseCounts: (date: string) => DateVerseCounts;
  dailyVerseCountGoal: number;
  trackerStartDate?: string;
}>();

const emit = defineEmits<{ daySelected: [date: string | null] }>();

const todayStr = dayjs().format('YYYY-MM-DD');
const selectedDate = ref(dayjs());
const selectedDay = ref(todayStr);

const month = computed(() => Number(selectedDate.value.format('M')));
const year = computed(() => Number(selectedDate.value.format('YYYY')));
const numberOfDaysInMonth = computed(() => dayjs(selectedDate.value).daysInMonth());

const currentMonthDays = computed(() => {
  const goal = props.dailyVerseCountGoal;
  const trackerStart = props.trackerStartDate;
  return [...Array(numberOfDaysInMonth.value)].map((_, index) => {
    const date = dayjs(`${year.value}-${month.value}-${index + 1}`).format('YYYY-MM-DD');
    const { unique, total } = props.getDateVerseCounts(date);
    return {
      date,
      isCurrentMonth: true,
      uniqueVerseCountPercentage: goal > 0 ? unique / goal * 100 : 0,
      totalVerseCountPercentage: goal > 0 ? total / goal * 100 : 0,
      isBeforeTrackerStartDate: trackerStart ? date < trackerStart : false,
      isTrackerStartDate: trackerStart ? date === trackerStart : false,
    };
  });
});

const previousMonthDays = computed(() => {
  const firstDayWeekday = getWeekday(currentMonthDays.value[0].date);
  const previousMonth = dayjs(`${year.value}-${month.value}-01`).subtract(1, 'month');
  const visibleCount = firstDayWeekday ? firstDayWeekday - 1 : 6;
  const startDay = dayjs(currentMonthDays.value[0].date).subtract(visibleCount, 'day').date();
  return [...Array(visibleCount)].map((_, index) => ({
    date: dayjs(`${previousMonth.year()}-${previousMonth.month() + 1}-${startDay + index}`).format('YYYY-MM-DD'),
    isCurrentMonth: false,
  }));
});

const nextMonthDays = computed(() => {
  const lastDayWeekday = getWeekday(`${year.value}-${month.value}-${currentMonthDays.value.length}`);
  const nextMonth = dayjs(`${year.value}-${month.value}-01`).add(1, 'month');
  const visibleCount = lastDayWeekday ? 7 - lastDayWeekday : lastDayWeekday;
  return [...Array(visibleCount)].map((_, index) => ({
    date: dayjs(`${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`).format('YYYY-MM-DD'),
    isCurrentMonth: false,
  }));
});

const days = computed(() => [
  ...previousMonthDays.value,
  ...currentMonthDays.value,
  ...nextMonthDays.value,
]);

function getWeekday(date: string) {
  return (dayjs(date) as ReturnType<typeof dayjs> & { weekday: () => number }).weekday();
}

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
