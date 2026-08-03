<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width.attr="width" :height.attr="height" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" :stroke="stroke" stroke-width="2.5" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ width?: string; height?: string; stroke?: string }>(), {
  width: '24px', height: '24px', stroke: 'currentColor',
});
</script>
