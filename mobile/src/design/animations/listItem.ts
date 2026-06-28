import {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { durations, easings } from "../tokens/motion";

/**
 * List item enter/exit + layout animations. Use on rows inside an animated
 * list so insertions, removals, and reorders glide instead of snapping:
 *
 *   <Animated.View entering={listItemEnter()} exiting={listItemExit()}
 *                  layout={listLayout()} />
 */
export const listItemEnter = (duration: number = durations.base) =>
  FadeInDown.duration(duration).easing(easings.decelerate);

export const listItemExit = (duration: number = durations.fast) =>
  FadeOutUp.duration(duration).easing(easings.accelerate);

/** Smooth repositioning when neighbors are added/removed. */
export const listLayout = (duration: number = durations.base) =>
  LinearTransition.duration(duration).easing(easings.standard);
