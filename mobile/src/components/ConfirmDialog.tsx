import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/src/theme/ThemeProvider";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const [isRendered, setIsRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      backdropOpacity.setValue(0);
      cardScale.setValue(0.96);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (isRendered) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.98,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [backdropOpacity, cardScale, isRendered, visible]);

  return (
    <Modal
      visible={isRendered}
      animationType="none"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity, backgroundColor: colors.backdrop },
          ]}
        >
          <Pressable style={styles.backdropPressTarget} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: cardScale }], backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!!message && (
            <Text style={[styles.message, { color: colors.mutedText }]}>
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={onCancel}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.destructiveButton, { backgroundColor: colors.destructive }]}
              onPress={onConfirm}
            >
              <Text
                style={[styles.destructiveButtonText, { color: colors.onDestructive }]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressTarget: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  destructiveButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  destructiveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
});

