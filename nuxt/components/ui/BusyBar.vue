<template>
  <div class="busy-bar" :class="{ 'is-busy': busy }" />
</template>

<script>
export default {
  name: 'BusyBar',
  props: {
    busy: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style>
@keyframes busyAnimation {
  100% {
    background-position: 100% 100%;
  }
}

.busy-bar {
  position: fixed;
  z-index: var(--z-index-busy-bar);
  top: 52px;
  left: 0;
  width: 100vw;
  height: 5px;
  background: transparent;
  pointer-events: none;
  transform: translateY(-5px);
  transition: 0.2s;
}

.busy-bar.is-busy {
  background: var(--mbl-border-strong);
  background-image:
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 1rem,
      var(--mbl-busy-bar-stripe) 1rem,
      var(--mbl-busy-bar-stripe) 2rem
    );
  background-size: 200% 200%;
  animation: busyAnimation 10s linear infinite;
  transform: translateY(0);
}
</style>
