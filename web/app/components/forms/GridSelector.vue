<template>
  <div class="grid-selector mbl-tap-grid" :style="gridSelectorStyle">
    <div
      v-for="option in options"
      :key="option.value"
      class="grid-selector--option mbl-tap-grid--cell"
      @click="emit('selection', option.value)"
    >
      {{ option.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  options?: Array<{ label: string; value: number }>;
  columns?: number;
}>(), {
  options: () => [],
  columns: 2,
});

const emit = defineEmits<{ selection: [value: number] }>();

const gridSelectorStyle = computed(() => ({
  'grid-template-columns': `repeat(${props.columns}, 1fr)`,
  'grid-template-rows': `repeat(${Math.ceil(props.options.length / props.columns)}, 1fr)`,
}));
</script>

<style scoped>
.grid-selector {
  grid-auto-flow: column;
}

.grid-selector--option {
  justify-content: flex-start;
  padding: 1rem;
}

.grid-selector--option::before {
  content: '';
  position: absolute;
  inset: 2px;
  border: 2px solid var(--mbl-border-strong);
  border-radius: 5px;
  transition: 0.2s;
}

.grid-selector--option:hover {
  color: var(--mbl-text-stronger);
}

.grid-selector--option:hover::before {
  border-color: var(--mbl-link-bright);
}
</style>
