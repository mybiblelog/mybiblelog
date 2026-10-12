<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width.attr="width"
    :height.attr="height"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="stroke"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: string;
  height?: string;
  stroke?: string;
}>(), {
  width: '1rem',
  height: '1rem',
  stroke: 'currentColor',
});
</script>
