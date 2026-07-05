import { FadeIn, FadeOut } from "react-native-reanimated";
import { durations, easings } from "../tokens/motion";

/**
 * Token-timed fade entering/exiting animations. Pass to a Reanimated view's
 * `entering` / `exiting` props:
 *
 *   <Animated.View entering={fadeIn()} exiting={fadeOut()} />
 */
export const fadeIn = (duration: number = durations.base) =>
  FadeIn.duration(duration).easing(easings.decelerate);

export const fadeOut = (duration: number = durations.fast) =>
  FadeOut.duration(duration).easing(easings.accelerate);
