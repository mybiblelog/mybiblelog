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
    <div class="bar-progress bar-progress--complete" data-testid="primary-bar-complete" :class="{ 'is-complete': primaryPercentage >= 100 }" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  primaryPercentage?: number;
  secondaryPercentage?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}>(), {
  primaryPercentage: 0,
  secondaryPercentage: 0,
  backgroundColor: 'var(--mbl-progress-track-bg)',
  foregroundColor: 'var(--mbl-link-bright)',
});

const backgroundStyle = computed(() => ({
  position: 'relative',
  height: '1rem',
  background: props.backgroundColor,
  borderRadius: '5px',
  overflow: 'hidden',
}));

const primaryBarStyle = computed(() => ({
  background: props.foregroundColor,
  width: `${props.primaryPercentage}%`,
}));

const secondaryBarStyle = computed(() => ({
  background: props.foregroundColor,
  opacity: '0.7',
  width: `${props.secondaryPercentage}%`,
}));
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
  0% { background-position: 0% 0%; }
  100% { background-position: -200% 0%; }
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
