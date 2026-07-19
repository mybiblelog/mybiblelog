import { Easing } from "react-native-reanimated";

/**
 * Motion tokens. Every animation in the app pulls its duration and easing
 * from here so timing feels consistent. No inline millisecond literals in
 * components — reference `durations.*` instead.
 */
export const durations = {
  instant: 0,
  /** Press feedback, small state flips. */
  fast: 120,
  /** Default for most transitions (sheets, fades, layout). */
  base: 200,
  /** Larger movements / emphasis. */
  slow: 320,
} as const;

/**
 * Easing curves. `standard` for most moves, `decelerate` for entering
 * elements, `accelerate` for exiting ones.
 */
export const easings = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
  /** Constant-rate motion for continuous loops (e.g. a spinner's rotation). */
  linear: Easing.linear,
} as const;

/**
 * Spring preset for press / pop interactions (used by useScalePress).
 */
export const springs = {
  press: { damping: 18, stiffness: 320, mass: 0.6 },
} as const;
