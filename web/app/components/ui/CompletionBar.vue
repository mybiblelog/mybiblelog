<template>
  <div
    class="completion-bar--container"
    data-testid="completion-bar"
    :data-percentage="percentage"
    :style="{ height: '4px', background: backgroundColor, borderRadius: '5px', overflow: 'hidden' }"
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
.completion-bar--progress {
  transition: width 1s ease-out;
}
</style>
