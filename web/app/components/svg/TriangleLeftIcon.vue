<template>
  <svg :width.attr="width" :height.attr="height" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 12L18.5 5.5L18.5 18.5Z" :fill="fill" :stroke="fill" stroke-width="3" stroke-linejoin="round" />
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
