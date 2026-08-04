<template>
  <svg :width.attr="width" :height.attr="height" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14.2L8 11L16 11Z" :fill="fill" :stroke="fill" stroke-width="2" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string;
  height?: string;
  fill?: string;
}>(), {
  width: '1rem',
  height: '1rem',
  fill: 'var(--mbl-border-strong)',
});
</script>
