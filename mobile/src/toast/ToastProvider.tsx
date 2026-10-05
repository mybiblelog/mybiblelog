import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import {
  type ThemeColors,
  durations,
  radius,
  spacing,
  typography,
  useTheme,
  zIndex,
} from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  /**
   * Larger text/padding/margins and a close button, for messages worth
   * reading in full rather than glancing at — see `showToast`'s `prominent`
   * option below.
   */
  prominent: boolean;
};

type ShowToastOptions = Omit<Toast, "id" | "prominent"> & {
  /**
   * Auto-dismiss delay. `null` disables auto-dismiss entirely — the toast
   * then stays until the user taps it, drags it away, or presses its close
   * button. Defaults to `DEFAULT_TOAST_DURATION_MS`.
   */
  durationMs?: number | null;
  /**
   * Opt into the larger, sticky-by-default presentation for messages that
   * need to actually be read (e.g. an explanation, not just an
   * acknowledgement). See the comment on `Toast.prominent`.
   */
  prominent?: boolean;
};

type ToastContextValue = {
  showToast: (toast: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId() {
  return `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_TOAST_DURATION_MS = 1800;

/** How far above its resting place the toast starts, so it slides in downward. */
const ENTER_OFFSET = 12;

/** Horizontal drag past which a release swipes the toast away. */
const SWIPE_DISMISS_DISTANCE = 80;
/** Or a fast enough flick, regardless of distance travelled. */
const SWIPE_DISMISS_VELOCITY = 800;
/** How far offscreen the toast flies once a swipe commits to dismissing it. */
const SWIPE_EXIT_DISTANCE = 400;

/**
 * Solid intent fills, mirroring web's `--mbl-notification-*` tokens: a toast
 * floats over arbitrary content, so it carries its own color rather than
 * borrowing a page surface (an `info` toast on `surface` was all but invisible
 * against the dark-mode canvas).
 */
function intentColors(type: ToastType, colors: ThemeColors) {
  switch (type) {
    case "success":
      return { background: colors.success, foreground: colors.onSuccess };
    case "error":
      return { background: colors.destructive, foreground: colors.onDestructive };
    case "info":
      return { background: colors.info, foreground: colors.onInfo };
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors, shadows } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-ENTER_OFFSET);
  const translateX = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => setToast(null), []);

  // Shared-value writes below happen in event-time callbacks, not during
  // render — a known false positive of the compiler's immutability rule with
  // Reanimated.
  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(-ENTER_OFFSET, { duration: durations.fast });
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(0, { duration: durations.fast }, (finished) => {
      if (finished) scheduleOnRN(clearToast);
    });
  }, [clearToast, opacity, translateY]);

  // Swipe left/right dismisses immediately (no fade), flinging the toast the
  // rest of the way offscreen in the direction it was already moving. Any
  // pending auto-hide timer is harmless left running: it targets state that's
  // already cleared by the time it would fire, so there's nothing left to
  // animate (avoids touching the ref from a function scheduled off a worklet).
  const dismissBySwipe = useCallback(
    (direction: 1 | -1) => {
      // eslint-disable-next-line react-hooks/immutability
      translateX.value = withTiming(direction * SWIPE_EXIT_DISTANCE, { duration: durations.fast });
      // eslint-disable-next-line react-hooks/immutability
      opacity.value = withTiming(0, { duration: durations.fast }, (finished) => {
        if (finished) scheduleOnRN(clearToast);
      });
    },
    [clearToast, opacity, translateX]
  );

  const showToast = useCallback(
    (t: ShowToastOptions) => {
      const durationMs = t.durationMs === undefined ? DEFAULT_TOAST_DURATION_MS : t.durationMs;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setToast({ id: makeId(), type: t.type, message: t.message, prominent: t.prominent ?? false });
      // eslint-disable-next-line react-hooks/immutability
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: durations.fast });
      // eslint-disable-next-line react-hooks/immutability
      translateY.value = -ENTER_OFFSET;
      translateY.value = withTiming(0, { duration: durations.fast });
      // eslint-disable-next-line react-hooks/immutability
      translateX.value = 0;
      if (durationMs !== null) {
        timeoutRef.current = setTimeout(hideToast, durationMs);
      }
    },
    [hideToast, opacity, translateX, translateY]
  );

  // Never leave a hide timer running past unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      // eslint-disable-next-line react-hooks/immutability
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const pastDistance = Math.abs(e.translationX) > SWIPE_DISMISS_DISTANCE;
      const pastVelocity = Math.abs(e.velocityX) > SWIPE_DISMISS_VELOCITY;
      if (pastDistance || pastVelocity) {
        scheduleOnRN(dismissBySwipe, e.translationX >= 0 ? 1 : -1);
      } else {
        // eslint-disable-next-line react-hooks/immutability
        translateX.value = withTiming(0, { duration: durations.fast });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
  }));

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  const intent = toast ? intentColors(toast.type, colors) : null;
  const prominent = toast?.prominent ?? false;
  // A prominent toast (long, worth-reading content) gets more breathing room
  // from the screen edges on top of its larger internal padding. Non-prominent
  // toasts keep their original, tighter gutters unchanged.
  const topGutter = prominent ? spacing.lg : spacing.xs;
  const sideGutter = prominent ? spacing.lg : spacing.md;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && intent && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            testID="toast.wrap"
            style={[
              styles.toastWrap,
              { top: insets.top + topGutter, left: sideGutter, right: sideGutter },
              animatedStyle,
            ]}
            pointerEvents="box-none"
          >
            <GestureDetector gesture={pan}>
              <Pressable
                onPress={hideToast}
                testID="toast.container"
                // Radius stays inline next to the changing background: on Android a
                // style update that only swaps backgroundColor drops a radius that
                // lives in a registered StyleSheet.
                style={[
                  styles.toast,
                  prominent && styles.toastProminent,
                  shadows.popover,
                  { backgroundColor: intent.background, borderRadius: radius["2xl"] },
                ]}
              >
                <Text
                  testID="toast.message"
                  style={[
                    styles.toastText,
                    prominent && styles.toastTextProminent,
                    { color: intent.foreground },
                  ]}
                >
                  {toast.message}
                </Text>
                {prominent && (
                  <Pressable
                    onPress={hideToast}
                    testID="toast.close"
                    accessibilityRole="button"
                    accessibilityLabel={t("dismiss")}
                    hitSlop={8}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={22} color={intent.foreground} />
                  </Pressable>
                )}
              </Pressable>
            </GestureDetector>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  // Top-anchored, like web's toaster: the bottom of the screen is where the
  // keyboard and the tab bar live, and a toast raised there was routinely
  // covered while typing.
  toastWrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    alignItems: "center",
    zIndex: zIndex.toast,
  },
  toast: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: "60%",
    maxWidth: "100%",
  },
  // Prominent toasts carry longer, worth-reading copy plus a close button, so
  // they get roomier padding and a row layout (text + close button) instead
  // of the compact centered layout used for brief acknowledgements.
  toastProminent: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  toastTextProminent: {
    flex: 1,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    textAlign: "left",
  },
  closeButton: {
    marginLeft: spacing.sm,
  },
});
