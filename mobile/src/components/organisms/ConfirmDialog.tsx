import { StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm action as destructive. Default true. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centered confirmation dialog built on BottomSheet. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} variant="center">
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {!!message && (
        <Text variant="body" color="mutedText" style={styles.message}>
          {message}
        </Text>
      )}
      <View style={styles.actions}>
        <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
        <Button
          label={confirmLabel}
          variant={destructive ? "destructive" : "primary"}
          onPress={onConfirm}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.xs },
  message: { marginBottom: spacing.lg },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
});
