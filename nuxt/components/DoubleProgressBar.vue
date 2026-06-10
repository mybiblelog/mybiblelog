<template>
  <div
    class="bar-container"
    data-testid="double-progress-bar"
    :data-primary-percentage="primaryPercentage"
    :data-secondary-percentage="secondaryPercentage"
    :style="backgroundStyle"
  >
    <div class="bar-progress" data-testid="secondary-bar" :style="secondaryBarStyle" />
    <div class="bar-progress" data-testid="primary-bar" :style="primaryBarStyle" />
    <div class="bar-progress bar-progress--complete" data-testid="primary-bar-complete" :class="{'is-complete': primaryPercentage >= 100 }" />
  </div>
</template>

<script>
export default {
  name: 'DoubleProgressBar',
  props: {
    primaryPercentage: {
      type: Number,
      default: 0,
    },
    secondaryPercentage: {
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
        position: 'relative',
        height: '1rem',
        background: this.backgroundColor,
        borderRadius: '5px',
        overflow: 'hidden',
      };
    },
    primaryBarStyle() {
      return {
        background: this.foregroundColor,
        width: this.primaryPercentage + '%',
      };
    },
    secondaryBarStyle() {
      return {
        background: this.foregroundColor,
        opacity: '0.7',
        width: this.secondaryPercentage + '%',
      };
    },
  },
};
</script>

<style>

.bar-progress {
  transition: width 1s ease-out;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
}

@keyframes moveGradient {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: -200% 0%;
  }
}

.bar-progress--complete {
  transition: opacity 0.5s ease;
  opacity: 0;
  width: 100%;
  background: linear-gradient(90deg, red 0%, yellow 15%, yellow 20%, lime 30%, cyan 40%, cyan 50%, blue 65%, magenta 80%, red 100%);
  background-size: 200%;
  animation: moveGradient 2s linear infinite;
}

.bar-progress--complete.is-complete {
  opacity: 0.3;
}
</style>
