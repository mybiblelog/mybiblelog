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
import { durations, useTheme } from "@/src/design";

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

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => setToast(null), []);

  // Shared-value writes below happen in event-time callbacks, not during
  // render — a known false positive of the compiler's immutability rule with
  // Reanimated.
  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withTiming(0, { duration: durations.fast }, (finished) => {
      if (finished) runOnJS(clearToast)();
    });
  }, [clearToast, opacity]);

  const showToast = useCallback(
    (t: Omit<Toast, "id"> & { durationMs?: number }) => {
      const durationMs = t.durationMs ?? DEFAULT_TOAST_DURATION_MS;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ id: makeId(), type: t.type, message: t.message });
      // eslint-disable-next-line react-hooks/immutability
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: durations.fast });
      timeoutRef.current = setTimeout(hideToast, durationMs);
    },
    [hideToast, opacity]
  );

  // Never leave a hide timer running past unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.toastWrap, animatedStyle]} pointerEvents="box-none">
            <Pressable
              onPress={hideToast}
              style={[
                styles.toast,
                toast.type === "info"
                  ? {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                    }
                  : {
                      backgroundColor:
                        toast.type === "success" ? colors.primary : colors.destructive,
                    },
              ]}
            >
              <Text
                style={[
                  styles.toastText,
                  {
                    color:
                      toast.type === "error"
                        ? colors.onDestructive
                        : toast.type === "info"
                          ? colors.text
                          : colors.onPrimary,
                  },
                ]}
              >
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
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    alignItems: "center",
  },
  toast: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: "60%",
    maxWidth: "100%",
  },
  toastText: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
});
