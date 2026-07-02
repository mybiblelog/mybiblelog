import { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { durations, easings } from '../tokens/motion';

/**
 * Sheet / modal motion: slide up from the bottom on enter, back down on exit.
 *
 *   <Animated.View entering={slideUp()} exiting={slideDown()} />
 */
export const slideUp = (duration: number = durations.base) =>
  SlideInDown.duration(duration).easing(easings.decelerate);

export const slideDown = (duration: number = durations.base) =>
  SlideOutDown.duration(duration).easing(easings.accelerate);
