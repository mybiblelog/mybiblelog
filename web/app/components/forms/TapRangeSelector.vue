<template>
  <div class="tap-range-selector mbl-tap-grid" :style="rangeSelectorStyle">
    <div
      v-for="(option, index) in options"
      :key="index"
      class="tap-range-selector--option mbl-tap-grid--cell"
      :class="tapRangeSelectorOptionClass(option)"
      @click="handleClick(option)"
    >
      {{ option }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  min?: number;
  max: number;
  multi?: boolean;
  columns?: number;
}>(), {
  min: 0,
  multi: true,
  columns: 6,
});

const emit = defineEmits<{ selection: [value: { from: number; to: number }] }>();

const startValue = ref<number | null>(null);
const endValue = ref<number | null>(null);
const waitingForEnd = ref(false);

const options = computed(() => {
  const opts: number[] = [];
  for (let i = props.min; i <= props.max; i++) { opts.push(i); }
  return opts;
});

const rangeSelectorStyle = computed(() => ({
  'grid-template-columns': `repeat(${props.columns}, 1fr)`,
}));

function tapRangeSelectorOptionClass(option: number) {
  if (!props.multi || startValue.value === null) {
    return { selected: option === startValue.value };
  }
  const from = Math.min(startValue.value, endValue.value ?? startValue.value);
  const to = Math.max(startValue.value, endValue.value ?? startValue.value);
  return {
    first: option === from,
    last: option === to,
    selected: option >= from && option <= to,
    waiting: waitingForEnd.value && option === startValue.value,
  };
}

function handleClick(value: number) {
  if (!props.multi) {
    startValue.value = value;
    endValue.value = value;
    waitingForEnd.value = false;
    emit('selection', { from: value, to: value });
    return;
  }

  if (startValue.value === null) {
    startValue.value = value;
    endValue.value = null;
    waitingForEnd.value = true;
  }
  else if (waitingForEnd.value) {
    const sv = startValue.value;
    endValue.value = value;
    waitingForEnd.value = false;
    emit('selection', { from: Math.min(sv, value), to: Math.max(sv, value) });
  }
  else {
    startValue.value = value;
    endValue.value = null;
    waitingForEnd.value = true;
  }
}
</script>

<style scoped>
.tap-range-selector--option {
  justify-content: center;
  padding: 1rem 0;
  border: 2px solid transparent;
  border-radius: 5px;
}

.tap-range-selector--option:hover:not(.selected) {
  color: var(--mbl-on-accent);
  background: var(--mbl-bg-disabled);
}

.tap-range-selector--option.selected {
  color: var(--mbl-link-bright);
  border-color: var(--mbl-link-bright);
}

.tap-range-selector--option.waiting {
  animation: pulse-border 1.5s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--mbl-link-bright); }
  50% { border-color: var(--primary-color); }
}
</style>
