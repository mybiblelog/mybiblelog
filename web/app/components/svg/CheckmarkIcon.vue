<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width.attr="width" :height.attr="height" viewBox="0 0 24 24" fill="none">
    <path
      class="checkmark-icon__path"
      :class="{ 'checkmark-icon__path--draw': draw }"
      d="M5 12.3L9.6 17L19 7.2"
      :stroke="stroke"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      pathLength="1"
    />
  </svg>
</template>

<script setup lang="ts">
// Stroked rather than filled: the round caps/joins on a 4.5-unit stroke (~19% of
// the 24-unit viewBox) are what give the mark its rounded, chunky read, and a
// stroke is also what makes the draw-on animation below possible.
// `pathLength="1"` normalises the geometry so the dash math stays `1 -> 0` even
// if the coordinates are retuned.
withDefaults(defineProps<{ width?: string; height?: string; stroke?: string; draw?: boolean }>(), {
  width: '24px',
  height: '24px',
  stroke: 'var(--mbl-success-bright)',
  draw: false,
});
</script>

<style scoped>
/* The base state is fully drawn; only the modifier introduces the dash offset.
   Because `forwards` leaves the animation resting on the same values, dropping
   the class after the animation causes no visual change.
   400ms here is what CHECKMARK_DRAW_MS in pages/checklist.vue mirrors when it
   delays the particle burst. */
.checkmark-icon__path--draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;

  /* `linear` is deliberate: this is a pen travelling at a constant speed, and
     any ease-out front-loads the stroke so hard that it reads as a pop-in
     rather than as drawing. */
  animation: checkmark-draw 400ms linear forwards;
}

/* The elbow sits at 6.577 of the path's 20.156 units, i.e. 32.6% along, so
   offset 0.674 is exactly the end of the short arm. Holding there for a beat
   separates the two strokes — down-left first, then the long sweep up-right. */
@keyframes checkmark-draw {
  0% { stroke-dashoffset: 1; }
  36% { stroke-dashoffset: 0.674; }
  44% { stroke-dashoffset: 0.674; }
  100% { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .checkmark-icon__path--draw {
    animation: none;
    stroke-dasharray: none;
    stroke-dashoffset: 0;
  }
}
</style>
