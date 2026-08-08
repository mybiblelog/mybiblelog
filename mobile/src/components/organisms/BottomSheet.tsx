import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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
  /**
   * Dock to the bottom (`sheet`), float centered (`center`, for dialogs), or
   * fill the screen below the status bar (`full`, for editors that need room
   * to type). `full` keeps the sheet's rounded top edge but has no grabber and
   * never swipes away.
   */
  variant?: "sheet" | "center" | "full";
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
  const { colors, shadows } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const keyboard = useSharedValue(0);

  const finishClose = useCallback(() => setMounted(false), []);

  const isCenter = variant === "center";
  const isSheet = variant === "sheet";
  // A centered dialog floats with a gutter all round; edge-anchored variants
  // bleed to the screen edges.
  const centerGutter = isCenter ? spacing.md : 0;

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

  // A Modal is its own native window, so Android's manifest `adjustResize`
  // never reaches it and iOS has nothing to avoid against — the sheet has to
  // measure the keyboard itself. Only listen while mounted: screens keep many
  // `visible={false}` sheets in the tree and they shouldn't all subscribe.
  useEffect(() => {
    if (!mounted) return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [mounted]);

  useEffect(() => {
    keyboard.value = withTiming(keyboardHeight, {
      duration: durations.base,
      easing: easings.standard,
    });
  }, [keyboardHeight, keyboard]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  // The keyboard inset goes on the root, not the surface: the root is the
  // flex container that docks the sheet, so padding it lifts the whole sheet
  // clear of the keyboard. Padding the surface instead would push its pinned
  // header (and Save button) off the top of the screen.
  //
  // The surface keeps its full `insets.bottom` padding on top of this. Android
  // reports `endCoordinates.height` without the navigation-bar inset under
  // edge-to-edge, so lifting by that height alone leaves the footer clipped by
  // exactly the nav bar; the surface's own bottom padding absorbs the
  // difference and keeps content clear on both platforms.
  const rootStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.value + centerGutter,
  }));

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

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Outside the padded layer below, so the backdrop still covers the
            status-bar strip and the area behind the keyboard. */}
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t("dismiss")}
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: colors.backdrop }, backdropStyle]}
        />
        {/* box-none: this layer spans the screen to position the sheet, so it
            has to let taps in the uncovered area reach the backdrop behind it. */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.layout,
            isCenter ? styles.layoutCenter : styles.layoutAnchored,
            { paddingTop: insets.top + centerGutter },
            rootStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            {/* Elevation sits on the wrapper, not the surface: the surface clips
                its children, and Android drops a shadow under overflow:hidden.
                An anchored sheet is a panel; a centered dialog is a modal. */}
            <Animated.View
              style={[
                styles.wrap,
                variant === "full" ? styles.wrapFull : null,
                isCenter ? shadows.modal : shadows.panel,
                surfaceStyle,
              ]}
            >
              <View
                style={[
                  isCenter ? styles.centerSurface : styles.sheetSurface,
                  variant === "full" ? styles.surfaceFull : null,
                  { backgroundColor: colors.surface },
                  padded &&
                    (isCenter
                      ? styles.centerPadding
                      : { padding: spacing.md, paddingBottom: spacing.md + insets.bottom }),
                  !isCenter && !padded ? { paddingBottom: insets.bottom } : null,
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  layout: { flex: 1 },
  layoutAnchored: { justifyContent: "flex-end" },
  layoutCenter: { justifyContent: "center", paddingHorizontal: spacing.md },
  // RN defaults flexShrink to 0 (unlike web), so without this a tall sheet
  // overflows its container instead of fitting the space the root leaves it.
  wrap: { width: "100%", flexShrink: 1 },
  wrapFull: { flex: 1 },
  sheetSurface: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: "hidden",
    flexShrink: 1,
  },
  surfaceFull: { flex: 1 },
  centerSurface: { borderRadius: radius.card, overflow: "hidden", flexShrink: 1 },
  centerPadding: { padding: spacing.md },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
});
