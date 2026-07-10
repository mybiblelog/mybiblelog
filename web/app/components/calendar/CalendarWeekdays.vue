<template>
  <ol class="day-of-week">
    <li v-for="weekday in weekdays" :key="weekday">
      {{ weekday }}
    </li>
  </ol>
</template>

<script setup lang="ts">
const { locale } = useI18n();
const weekdays = computed(() => {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short' };
  return [
    new Date(2000, 1, 7).toLocaleDateString(locale.value, opts),
    new Date(2000, 1, 1).toLocaleDateString(locale.value, opts),
    new Date(2000, 1, 2).toLocaleDateString(locale.value, opts),
    new Date(2000, 1, 3).toLocaleDateString(locale.value, opts),
    new Date(2000, 1, 4).toLocaleDateString(locale.value, opts),
    new Date(2000, 1, 5).toLocaleDateString(locale.value, opts),
    new Date(2000, 1, 6).toLocaleDateString(locale.value, opts),
  ];
});
</script>

<style scoped>
.day-of-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0;
  margin: 0;
  list-style: none;
}
.day-of-week > * { text-align: center; }
</style>
