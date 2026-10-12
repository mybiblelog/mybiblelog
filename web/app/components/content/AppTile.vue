<template>
  <img
    class="app-tile"
    src="/images/logo.svg"
    alt=""
    width="100"
    height="100"
    :style="{ '--app-tile-size': `${size}px` }"
  >
</template>

<script setup lang="ts">
// Decorative: the logo on a white launcher-style tile (mirrors the mobile app's
// icon.png) so the app reads as its own product. Always sits next to text naming the app.
withDefaults(defineProps<{
  size?: number;
}>(), {
  size: 72,
});
</script>

<style scoped>
.app-tile {
  display: block;
  flex: none;
  box-sizing: border-box;
  width: var(--app-tile-size);
  height: var(--app-tile-size);

  /* Matches the mark's inset in the mobile launcher icon. */
  padding: calc(var(--app-tile-size) * 0.15);

  /* Launcher icons stay white in both themes, so use the palette primitive, not --mbl-bg. */
  background: var(--neutral-0);

  /* Android launcher icons are squircle-ish; ~22% radius approximates it. */
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- radius must scale with the size prop */
  border-radius: 22%;
  box-shadow: var(--mbl-shadow-card);
}
</style>
