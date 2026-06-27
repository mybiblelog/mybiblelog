import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";

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

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function hideToast() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }

  function showToast(t: Omit<Toast, "id"> & { durationMs?: number }) {
    const id = makeId();
    const durationMs = t.durationMs ?? 1800;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ id, type: t.type, message: t.message });
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
    timeoutRef.current = setTimeout(() => hideToast(), durationMs);
  }

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.toastWrap,
              { opacity },
            ]}
            pointerEvents="box-none"
          >
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

