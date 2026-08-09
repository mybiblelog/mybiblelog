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
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ThemeColors, durations, radius, spacing, useTheme, zIndex } from "@/src/design";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id"> & { durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId() {
  return `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_TOAST_DURATION_MS = 1800;

/** How far above its resting place the toast starts, so it slides in downward. */
const ENTER_OFFSET = 12;

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
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-ENTER_OFFSET);
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
      if (finished) runOnJS(clearToast)();
    });
  }, [clearToast, opacity, translateY]);

  const showToast = useCallback(
    (t: Omit<Toast, "id"> & { durationMs?: number }) => {
      const durationMs = t.durationMs ?? DEFAULT_TOAST_DURATION_MS;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ id: makeId(), type: t.type, message: t.message });
      // eslint-disable-next-line react-hooks/immutability
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: durations.fast });
      // eslint-disable-next-line react-hooks/immutability
      translateY.value = -ENTER_OFFSET;
      translateY.value = withTiming(0, { duration: durations.fast });
      timeoutRef.current = setTimeout(hideToast, durationMs);
    },
    [hideToast, opacity, translateY]
  );

  // Never leave a hide timer running past unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  const intent = toast ? intentColors(toast.type, colors) : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && intent && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            testID="toast.wrap"
            style={[styles.toastWrap, { top: insets.top + spacing.xs }, animatedStyle]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={hideToast}
              testID="toast.container"
              // Radius stays inline next to the changing background: on Android a
              // style update that only swaps backgroundColor drops a radius that
              // lives in a registered StyleSheet.
              style={[
                styles.toast,
                shadows.popover,
                { backgroundColor: intent.background, borderRadius: radius["2xl"] },
              ]}
            >
              <Text testID="toast.message" style={[styles.toastText, { color: intent.foreground }]}>
                {toast.message}
              </Text>
            </Pressable>
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
  toastText: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
});
