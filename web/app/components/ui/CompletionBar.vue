<template>
  <div
    class="completion-bar--container"
    data-testid="completion-bar"
    :data-percentage="percentage"
    :style="{ background: backgroundColor }"
  >
    <div
      class="completion-bar--progress"
      :style="{ height: '100%', background: foregroundColor, width: percentage + '%' }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  percentage?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}>(), {
  percentage: 0,
  backgroundColor: 'var(--mbl-progress-track-bg)',
  foregroundColor: 'var(--mbl-link-bright)',
});
</script>

<style>
.completion-bar--container {
  height: 4px;
  border-radius: var(--mbl-radius-sm);
  overflow: hidden;
}

.completion-bar--progress {
  transition: width 1s ease-out;
}
</style>
