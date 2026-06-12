<template>
  <div class="calendar-month">
    <div class="calendar-month-header">
      <calendar-date-indicator
        :selected-date="selectedDate"
        class="calendar-month-header-selected-month"
      />
      <calendar-date-selector
        :current-date="today"
        :selected-date="selectedDate"
        @dateSelected="selectDate"
        @daySelected="selectDay"
      />
    </div>
    <calendar-weekdays />

    <ol class="days-grid">
      <calendar-month-day-item
        v-for="day in days"
        :key="selectedDate + ':' + day.date"
        :day="day"
        :is-today="day.date === today"
        :is-selected="day.date === selectedDay"
        :primary-percentage="day.uniqueVerseCountPercentage"
        :secondary-percentage="day.totalVerseCountPercentage"
        :is-before-tracker-start-date="day.isBeforeTrackerStartDate || false"
        :is-tracker-start-date="day.isTrackerStartDate || false"
        @daySelected="selectDay"
      />
    </ol>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import CalendarMonthDayItem from './CalendarMonthDayItem';
import CalendarDateIndicator from './CalendarDateIndicator';
import CalendarDateSelector from './CalendarDateSelector';
import CalendarWeekdays from './CalendarWeekdays';

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

export default {
  name: 'CalendarMonth',
  components: {
    CalendarMonthDayItem,
    CalendarDateIndicator,
    CalendarDateSelector,
    CalendarWeekdays,
  },
  props: {
    getDateVerseCounts: {
      type: Function,
      required: true,
    },
    dailyVerseCountGoal: {
      type: Number,
      required: true,
    },
    trackerStartDate: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      selectedDate: dayjs(),
      selectedDay: dayjs().format('YYYY-MM-DD'),
    };
  },
  computed: {
    days() {
      return [
        ...this.previousMonthDays,
        ...this.currentMonthDays,
        ...this.nextMonthDays,
      ];
    },
    today() {
      return dayjs().format('YYYY-MM-DD');
    },
    month() {
      return Number(this.selectedDate.format('M'));
    },
    year() {
      return Number(this.selectedDate.format('YYYY'));
    },
    numberOfDaysInMonth() {
      return dayjs(this.selectedDate).daysInMonth();
    },
    currentMonthDays() {
      const dailyVerseCountGoal = this.dailyVerseCountGoal;
      const trackerStartDate = this.trackerStartDate;
      return [...Array(this.numberOfDaysInMonth)].map((day, index) => {
        const date = dayjs(`${this.year}-${this.month}-${index + 1}`).format('YYYY-MM-DD');
        const { unique, total } = this.getDateVerseCounts(date);
        const uniqueVerseCountPercentage = unique / dailyVerseCountGoal * 100;
        const totalVerseCountPercentage = total / dailyVerseCountGoal * 100;
        return {
          date,
          isCurrentMonth: true,
          uniqueVerseCountPercentage,
          totalVerseCountPercentage,
          isBeforeTrackerStartDate: trackerStartDate ? date < trackerStartDate : false,
          isTrackerStartDate: trackerStartDate ? date === trackerStartDate : false,
        };
      });
    },
    previousMonthDays() {
      const firstDayOfTheMonthWeekday = this.getWeekday(
        this.currentMonthDays[0].date,
      );
      const previousMonth = dayjs(`${this.year}-${this.month}-01`).subtract(
        1,
        'month',
      );

      // Cover first day of the month being sunday (firstDayOfTheMonthWeekday === 0)
      const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday
        ? firstDayOfTheMonthWeekday - 1
        : 6;

      const previousMonthLastMondayDayOfMonth = dayjs(
        this.currentMonthDays[0].date,
      )
        .subtract(visibleNumberOfDaysFromPreviousMonth, 'day')
        .date();

      return [...Array(visibleNumberOfDaysFromPreviousMonth)].map(
        (day, index) => {
          return {
            date: dayjs(
              `${previousMonth.year()}-${previousMonth.month() +
                1}-${previousMonthLastMondayDayOfMonth + index}`,
            ).format('YYYY-MM-DD'),
            isCurrentMonth: false,
          };
        },
      );
    },
    nextMonthDays() {
      const lastDayOfTheMonthWeekday = this.getWeekday(
        `${this.year}-${this.month}-${this.currentMonthDays.length}`,
      );

      const nextMonth = dayjs(`${this.year}-${this.month}-01`).add(1, 'month');

      const visibleNumberOfDaysFromNextMonth = lastDayOfTheMonthWeekday
        ? 7 - lastDayOfTheMonthWeekday
        : lastDayOfTheMonthWeekday;

      return [...Array(visibleNumberOfDaysFromNextMonth)].map((day, index) => {
        return {
          date: dayjs(
            `${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`,
          ).format('YYYY-MM-DD'),
          isCurrentMonth: false,
        };
      });
    },
  },
  methods: {
    getWeekday(date) {
      return dayjs(date).weekday();
    },
    // Used to determine which month to render
    // Comes from CalendarDateSelector
    selectDate(newSelectedDate) {
      this.selectedDate = newSelectedDate;
      // When the month changes, select the first day of that month
      // This ensures the selected date is within the current month
      const firstMonthDay = dayjs(newSelectedDate).date(1).format('YYYY-MM-DD');
      this.selectDay(firstMonthDay);
    },
    // Used to determine which specific day is currently active
    // Comes from CalendarMonthDayItem
    selectDay(date) {
      this.selectedDay = date;
      this.$emit('daySelected', date);
    },
  },
};
</script>

<style scoped>
.calendar-month {
  position: relative;
  color: var(--mbl-text);
}
.calendar-month ol,
.calendar-month li {
  padding: 0;
  margin: 0;
  list-style: none;
}

.calendar-month-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-bottom: 10px;
}

@media screen and (max-width: 380px) {
  .calendar-month-header {
    flex-direction: column;
    text-align: center;
  }
}

.day-of-week {
  color: var(--mbl-text-body);
  font-size: 18px;
  padding-bottom: 5px;
  padding-top: 10px;
}

.day-of-week,
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-of-week > * {
  text-align: right;
  padding-right: 5px;
}

.days-grid {
  height: 100%;
  position: relative;
  background-color: var(--mbl-calendar-grid-inner);
  grid-column-gap: 1px;
  grid-row-gap: 1px;
  border: solid 1px var(--mbl-calendar-grid-outer);
}
</style>
