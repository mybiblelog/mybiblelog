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
  confirmTestID?: string;
  cancelTestID?: string;
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
  confirmTestID,
  cancelTestID,
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
        <Button
          label={cancelLabel}
          testID={cancelTestID}
          variant="secondary"
          onPress={onCancel}
        />
        <Button
          label={confirmLabel}
          testID={confirmTestID}
          variant={destructive ? "destructive" : "primary"}
          onPress={onConfirm}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing["2xs"] },
  message: { marginBottom: spacing.sm },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});
