<template>
  <svg :width="width" :height="height" viewBox="8 8 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 9L14 12L11 15" :stroke="fill" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string;
  height?: string;
  fill?: string;
}>(), {
  width: '10px',
  height: '20px',
  fill: 'var(--mbl-border-strong)',
});
</script>
