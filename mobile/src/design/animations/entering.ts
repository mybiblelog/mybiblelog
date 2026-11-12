import { useReducedMotion } from "react-native-reanimated";

/**
 * Pass every Reanimated `entering` animation through this hook. It returns the
 * animation unchanged, or `undefined` when Reanimated runs in reduced-motion
 * mode (latched at bundle load from the system setting, e.g. Android's
 * "Remove animations" or zeroed animation scales).
 *
 * Reanimated hides a view at opacity 0 when it is inserted and relies on the
 * animation to show it. Under reduced motion on Android the animation finishes
 * before the inserted view mounts, so that last update is lost and the view
 * stays invisible while still taking up space (reanimated#11174). Reduced
 * motion would make the animation instant anyway, so skipping it is
 * indistinguishable for the user.
 * TECH-DEBT(reanimated-reduced-motion-entering): drop once Reanimated ships the fix.
 */
export function useEntering<T>(animation: T): T | undefined {
  return useReducedMotion() ? undefined : animation;
}
