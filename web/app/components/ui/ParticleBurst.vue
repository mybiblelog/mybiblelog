<template>
  <div class="particle-burst" aria-hidden="true">
    <span
      v-for="(particle, index) in particles"
      :key="index"
      class="particle-burst__particle"
      :style="particle.style"
    >
      <slot>
        <span class="particle-burst__dot" />
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
// A one-shot radial burst. Mounting *is* the trigger: particles are generated
// once during setup and every stage of the animation is driven by CSS delays,
// so the component owns no timers and cannot leak one. The parent controls the
// burst's lifetime with `v-if` (or by living inside something that unmounts).
//
// The parent must establish a positioning context — the burst fills its offset
// parent and fires from the centre of it.
//
// `mobile/src/components/organisms/AchievementModal.tsx` hand-mirrors this math
// with Reanimated; keep the two in step if the formulas change.

type Particle = { style: Record<string, string> };

const props = withDefaults(defineProps<{
  count?: number;
  /** Travel distance in px, sampled per particle. */
  minDistance?: number;
  maxDistance?: number;
  /** Size in px of the built-in dot, sampled per particle. Ignored when the default slot is filled. */
  minSize?: number;
  maxSize?: number;
  /** How long after mount the burst fires — used to chain it behind another animation. */
  delayMs?: number;
  durationMs?: number;
  /** Tumble particles as they fly. Invisible on a circle; worth it for a shaped glyph. */
  spin?: boolean;
  /** Scale particles have shrunk to by the time they land. Near 1 keeps them legible at small sizes. */
  endScale?: number;
  color?: string;
  /** Alternating fill for the built-in dot, giving the burst some depth. Defaults to `color`. */
  altColor?: string;
}>(), {
  count: 7,
  minDistance: 60,
  maxDistance: 80,
  minSize: 8,
  maxSize: 8,
  delayMs: 0,
  durationMs: 1000,
  spin: false,
  endScale: 0.3,
  color: 'var(--mbl-success-bright)',
  altColor: '',
});

// Spread across the extra window the per-particle stagger opens up; the burst
// is finished by `delayMs + JITTER_MS + durationMs`.
const JITTER_MS = 100;

const particles: Particle[] = Array.from({ length: props.count }, (_, index) => {
  // Even spokes, then knocked off true so the ring doesn't read as mechanical.
  const angle = (Math.PI * 2 * index) / props.count + (Math.random() - 0.5) * 0.6;
  const distance = props.minDistance + Math.random() * (props.maxDistance - props.minDistance);
  const size = props.minSize + Math.random() * (props.maxSize - props.minSize);
  const rotation = props.spin ? (Math.random() - 0.5) * 720 : 0;
  return {
    style: {
      '--particle-x': `${Math.cos(angle) * distance}px`,
      '--particle-y': `${Math.sin(angle) * distance}px`,
      '--particle-size': `${size}px`,
      '--particle-rotation': `${rotation}deg`,
      '--particle-color': index % 2 === 1 && props.altColor ? props.altColor : props.color,
      '--particle-delay': `${props.delayMs + Math.random() * JITTER_MS}ms`,
      '--particle-duration': `${props.durationMs}ms`,
      '--particle-end-scale': `${props.endScale}`,
    },
  };
});
</script>

<style scoped>
/* `pointer-events: none` is load-bearing, not cosmetic: the burst overlays
   whatever the user just clicked, and without it a particle becomes the hit
   target for the next click (Playwright's actionability check included). */
.particle-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Travel and opacity are separate animations so the particle can hold full
   opacity for most of its flight and fade only at the end — fading across the
   whole flight is what makes small particles read as dust. */
.particle-burst__particle {
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: 0;
  animation:
    particle-fly var(--particle-duration) var(--particle-delay) ease-out forwards,
    particle-fade var(--particle-duration) var(--particle-delay) linear forwards;
}

.particle-burst__dot {
  display: block;
  width: var(--particle-size);
  height: var(--particle-size);
  border-radius: var(--mbl-radius-circle);
  background: var(--particle-color);
}

/* Every step lists the same transform functions so the browser interpolates
   them component-wise — collapsing to matrix interpolation would normalise the
   >360deg spins away. */
@keyframes particle-fly {
  0% {
    transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.4);
  }

  12% {
    transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(1);
  }

  100% {
    transform: translate(-50%, -50%)
              translate(var(--particle-x), var(--particle-y))
              rotate(var(--particle-rotation))
              scale(var(--particle-end-scale));
  }
}

/* Particles sit at opacity 0 until their delay elapses, which is what lets the
   burst be chained purely from CSS. */
@keyframes particle-fade {
  0%, 6% { opacity: 0; }
  12%, 65% { opacity: 1; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .particle-burst { display: none; }
}
</style>
