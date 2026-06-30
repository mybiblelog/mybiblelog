<template>
  <li
    class="calendar-day"
    data-testid="calendar-day"
    :data-date="day.date"
    :data-current-month="day.isCurrentMonth"
    :data-primary-percentage="primaryPercentage"
    :data-secondary-percentage="secondaryPercentage"
    :data-goal-met="primaryPercentage >= 100"
    :class="calendarDayClass"
    @click="onClick"
  >
    <div class="date">
      {{ label }}
    </div>
    <star-icon v-if="primaryPercentage >= 100" class="star" width="35%" height="35%" fill="var(--mbl-star-earned)" />
    <star-icon v-else-if="secondaryPercentage >= 100" class="star" width="35%" height="35%" fill="var(--mbl-star-unearned)" />
    <div v-if="day.isCurrentMonth" class="progress-bar">
      <div class="progress-bar-fill secondary" :style="{ width: secondaryPercentage + '%' }" />
      <div class="progress-bar-fill" :style="{ width: primaryPercentage + '%' }" />
    </div>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import StarIcon from '~/components/svg/StarIcon.vue';

const props = defineProps<{
  day: { date: string; isCurrentMonth: boolean; isBeforeTrackerStartDate?: boolean; isTrackerStartDate?: boolean };
  isToday?: boolean;
  isSelected?: boolean;
  primaryPercentage?: number;
  secondaryPercentage?: number;
}>();

const emit = defineEmits<{ daySelected: [date: string] }>();

const label = computed(() => dayjs(props.day.date).format('D'));
const calendarDayClass = computed(() => ({
  'calendar-day--not-current': !props.day.isCurrentMonth,
  'calendar-day--today': props.isToday,
  'calendar-day--selected': props.isSelected,
  'calendar-day--before-tracker-start': props.day.isBeforeTrackerStartDate,
  'calendar-day--tracker-start': props.day.isTrackerStartDate,
}));

function onClick() {
  if (props.day.isCurrentMonth) { emit('daySelected', props.day.date); }
}
</script>

<style scoped>
.calendar-day {
  position: relative;
  min-height: 70px;
  font-size: 16px;
  background-color: var(--mbl-bg);
  color: var(--mbl-text-body);
  padding: 5px;
  cursor: pointer;
  user-select: none;
  transition: 0.2s ease-out;
}
@media screen and (max-width: 768px) {
  .calendar-day { min-height: calc(100vw / 7); }
}
.calendar-day:hover { background-color: var(--mbl-bg-hover-light); }
.calendar-day .star { position: absolute; top: 10%; right: 10%; }
@media screen and (max-width: 768px) {
  .calendar-day .star { top: 5%; right: 5%; }
}
.calendar-day .date {
  position: absolute;
  left: 5%;
  top: 5%;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.2s;
}
@media screen and (max-width: 768px) {
  .calendar-day .date { top: 5%; left: 5%; width: 1.5rem; height: 1.5rem; }
}
.calendar-day--not-current { color: var(--mbl-text-muted); transition: 0s; }
.calendar-day--not-current, .calendar-day--not-current:hover { background-color: var(--mbl-bg-muted); }
.calendar-day--today .date { background-color: var(--mbl-calendar-today-date-bg); color: var(--mbl-calendar-today-date-color); }
.calendar-day--selected .date { color: var(--mbl-on-accent); background-color: var(--mbl-link-bright); }
.calendar-day .progress-bar {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  height: 5px;
  background: var(--mbl-progress-track-bg);
  border-radius: 3px;
  overflow: hidden;
}
.calendar-day .progress-bar .progress-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--mbl-link-bright);
}
.calendar-day .progress-bar .progress-bar-fill.secondary { background: var(--mbl-link-alt); }
.calendar-day--before-tracker-start .progress-bar .progress-bar-fill,
.calendar-day--before-tracker-start .progress-bar .progress-bar-fill.secondary { background: var(--mbl-progress-fill-inactive); }
.calendar-day--tracker-start::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 1em solid var(--mbl-info);
  border-left: 1em solid transparent;
}
</style>
