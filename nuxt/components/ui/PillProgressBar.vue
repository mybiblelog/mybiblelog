<template>
  <div class="pill-progress-bar">
    <div
      v-for="(pill, index) in totalSteps"
      :key="index"
      class="pill"
      :class="{ 'is-filled': index < currentStep }"
    />
  </div>
</template>

<script>
export default {
  name: 'PillProgressBar',
  props: {
    currentStep: {
      type: Number,
      required: true,
    },
    totalSteps: {
      type: Number,
      required: true,
    },
  },
};
</script>

<style scoped>
.pill-progress-bar {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.pill {
  flex: 1;
  height: 0.5rem;
  border-radius: 0.25rem;
  background-color: var(--mbl-progress-track-bg);
  transition: background-color 0.3s ease;
}

.pill.is-filled {
  background-color: var(--primary-color);
}
</style>
