import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { durations, springs } from '../tokens/motion';

type Options = {
  /** Scale applied while pressed. Default 0.96. */
  scaleTo?: number;
  /** Opacity applied while pressed. Default 0.9. */
  opacityTo?: number;
  /** When true, no animation is applied (e.g. disabled controls). */
  disabled?: boolean;
};

/**
 * Press-feedback primitive. Spread the returned handlers onto a Pressable and
 * the style onto an Animated.View wrapper:
 *
 *   const press = useScalePress();
 *   <AnimatedPressable onPressIn={press.onPressIn} onPressOut={press.onPressOut}
 *                      style={press.animatedStyle} />
 *
 * Scale uses a spring for a natural pop; opacity uses a short timing so the
 * dim tracks the finger immediately.
 */
export function useScalePress({
  scaleTo = 0.96,
  opacityTo = 0.9,
  disabled = false,
}: Options = {}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Shared-value writes inside press handlers run at event time, not during
  // render — a known false positive of the compiler's immutability rule with
  // Reanimated.
  const onPressIn = useCallback(() => {
    if (disabled) return;
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(scaleTo, springs.press);
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(opacityTo, { duration: durations.fast });
  }, [disabled, opacity, opacityTo, scale, scaleTo]);

  const onPressOut = useCallback(() => {
    if (disabled) return;
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, springs.press);
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(1, { duration: durations.fast });
  }, [disabled, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle, onPressIn, onPressOut };
}
