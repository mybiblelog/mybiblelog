import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Modal, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { durations, easings, radius, spacing, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { AnimatedPressable } from "../atoms/AnimatedPressable";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Dock to the bottom (`sheet`) or float centered (`center`, for dialogs). */
  variant?: "sheet" | "center";
  /** Apply the standard surface padding. Disable for edge-to-edge row lists. */
  padded?: boolean;
  /** Allow swipe-down to dismiss (sheet variant only). Default true. */
  swipeToDismiss?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

// How far the surface starts offset on enter (small, fade carries the rest) and
// the drag distance past which a release dismisses the sheet.
const ENTER_OFFSET = 24;
const DISMISS_DISTANCE = 80;

/**
 * Shared overlay primitive for menus and dialogs. Handles backdrop fade,
 * slide/scale in-out via Reanimated, swipe-to-dismiss, and mount/unmount
 * timing so the exit animation always plays before the modal tears down.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  variant = "sheet",
  padded = true,
  swipeToDismiss = true,
  contentStyle,
}: Props) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  const finishClose = useCallback(() => setMounted(false), []);

  // Mount as soon as we're asked to show — adjusted during render (the
  // sanctioned "derive state from props" pattern) so the modal appears in the
  // same frame instead of one effect-tick later.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      dragY.value = 0;
      progress.value = withTiming(1, {
        duration: durations.base,
        easing: easings.decelerate,
      });
    } else {
      progress.value = withTiming(
        0,
        { duration: durations.fast, easing: easings.accelerate },
        (finished) => {
          if (finished) runOnJS(finishClose)();
        }
      );
    }
  }, [visible, mounted, progress, dragY, finishClose]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const surfaceStyle = useAnimatedStyle(() => {
    if (variant === "center") {
      return {
        opacity: progress.value,
        transform: [{ scale: 0.96 + progress.value * 0.04 }],
      };
    }
    const enter = (1 - progress.value) * ENTER_OFFSET;
    return {
      opacity: progress.value,
      transform: [{ translateY: enter + dragY.value }],
    };
  });

  const pan = Gesture.Pan()
    .enabled(swipeToDismiss && variant === "sheet")
    .onUpdate((e) => {
      // Shared-value writes inside gesture worklets run at event time, not
      // during render — a known false positive of the compiler's
      // immutability rule with Reanimated.
      // eslint-disable-next-line react-hooks/immutability
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        // eslint-disable-next-line react-hooks/immutability
        dragY.value = withTiming(0, { duration: durations.fast });
      }
    });

  if (!mounted) return null;

  const isSheet = variant === "sheet";

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, isSheet ? styles.rootSheet : styles.rootCenter]}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t("dismiss")}
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: colors.backdrop }, backdropStyle]}
        />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.wrap, surfaceStyle]}>
            <View
              style={[
                isSheet ? styles.sheetSurface : styles.centerSurface,
                { backgroundColor: colors.surface },
                padded &&
                  (isSheet
                    ? { padding: spacing.xl, paddingBottom: spacing.xl + insets.bottom }
                    : styles.centerPadding),
                isSheet && !padded ? { paddingBottom: insets.bottom } : null,
                contentStyle,
              ]}
            >
              {isSheet ? (
                <View style={[styles.grabber, { backgroundColor: colors.border }]} />
              ) : null}
              {children}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootSheet: { justifyContent: "flex-end" },
  rootCenter: { justifyContent: "center", padding: spacing.xxl },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  wrap: { width: "100%" },
  sheetSurface: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: "hidden",
  },
  centerSurface: { borderRadius: radius.xl, overflow: "hidden" },
  centerPadding: { padding: spacing.xl },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
});
