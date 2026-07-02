<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width.attr="width" :height.attr="height" viewBox="0 0 24 24" fill="none">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" :fill="fill" />
    <path d="M7 7h2v2H7zm4 0h6v2h-6zm-4 4h6v2H7zm8 0h2v2h-2z" :fill="fill" opacity="0.6" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ width?: string; height?: string; fill?: string }>(), {
  width: '24px', height: '24px', fill: 'currentColor',
});
</script>
