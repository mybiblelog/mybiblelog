<template>
  <div
    class="goal-ring"
    :class="{ 'goal-ring--complete': complete }"
    :style="{ '--goal-ring-size': `${size}px` }"
    role="img"
    :aria-label="label"
  >
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle class="goal-ring__track" cx="18" cy="18" :r="radius" :stroke-width="stroke" />
      <circle
        class="goal-ring__fill"
        cx="18"
        cy="18"
        :r="radius"
        :stroke-width="stroke"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference * (1 - clamped / 100)"
      />
    </svg>
    <span class="goal-ring__label">
      <checkmark-icon v-if="complete" :width="`${size * 0.4}px`" :height="`${size * 0.4}px`" stroke="currentColor" />
      <template v-else>{{ label }}</template>
    </span>
  </div>
</template>

<script setup lang="ts">
import CheckmarkIcon from '~/components/svg/CheckmarkIcon.vue';

const props = withDefaults(defineProps<{
  /** 0–100. */
  percent: number;
  complete?: boolean;
  size?: number;
}>(), {
  complete: false,
  size: 56,
});

const { n } = useI18n();

const stroke = 3.5;
const radius = 18 - stroke / 2;
const circumference = 2 * Math.PI * radius;

const clamped = computed(() => Math.min(100, Math.max(0, props.percent)));
// Floored so the ring never claims 100% before the goal is actually complete.
const label = computed(() => n(Math.floor(clamped.value) / 100, 'percent'));
</script>

<style scoped>
.goal-ring {
  position: relative;
  flex: none;
  width: var(--goal-ring-size);
  height: var(--goal-ring-size);
  color: var(--mbl-link-bright);
}

.goal-ring--complete {
  color: var(--mbl-success);
}

/* Child selector: the checkmark icon in the label is an svg too and must not rotate. */
.goal-ring > svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.goal-ring circle {
  fill: none;
}

.goal-ring__track {
  stroke: var(--mbl-border);
}

.goal-ring__fill {
  stroke: currentcolor;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.8s ease-out;
}

.goal-ring__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mbl-text-strong);
  font-size: calc(var(--goal-ring-size) * 0.25);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.goal-ring--complete .goal-ring__label {
  color: var(--mbl-success);
}

@media (prefers-reduced-motion: reduce) {
  .goal-ring__fill {
    transition: none;
  }
}
</style>
