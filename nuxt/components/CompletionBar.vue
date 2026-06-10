<template>
  <div class="completion-bar--container" data-testid="completion-bar" :data-percentage="percentage" :style="backgroundStyle">
    <div class="completion-bar--progress" :style="foregroundStyle" />
  </div>
</template>

<script>
export default {
  name: 'CompletionBar',
  props: {
    percentage: {
      type: Number,
      default: 0,
    },
    backgroundColor: {
      type: String,
      default: 'var(--mbl-progress-track-bg)',
    },
    foregroundColor: {
      type: String,
      default: 'var(--mbl-link-bright)',
    },
  },
  computed: {
    backgroundStyle() {
      return {
        height: '4px',
        background: this.backgroundColor,
        borderRadius: '5px',
        overflow: 'hidden',
      };
    },
    foregroundStyle() {
      return {
        height: '100%',
        background: this.foregroundColor,
        width: this.percentage + '%',
      };
    },
  },
};
</script>

<style>
.completion-bar--progress {
  transition: width 1s ease-out;
}
</style>
