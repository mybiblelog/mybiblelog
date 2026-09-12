import { StyleSheet, View } from "react-native";
import { spacing, useScalePress } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";

export type MenuAction = {
  label: string;
  onPress: () => void;
  /** Title color (e.g. `destructive` for a delete action). */
  color?: keyof ThemeColors;
  /** Leading icon. Rows without one still align their label to rows that have it. */
  icon?: IconName;
};

// Fixed so a row with no icon still lines its label up under rows that have one.
const ICON_SLOT_WIDTH = 24;

function MenuRow({ action, onClose }: { action: MenuAction; onClose: () => void }) {
  const press = useScalePress({ scaleTo: 0.98, opacityTo: 0.9 });
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={() => {
        onClose();
        action.onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.rowContainer, press.animatedStyle]}
    >
      <View style={styles.rowIconSlot}>
        {action.icon ? (
          <Icon name={action.icon} size={20} color={action.color ?? "mutedText"} />
        ) : null}
      </View>
      <Text variant="bodyStrong" color={action.color ?? "text"}>
        {action.label}
      </Text>
    </AnimatedPressable>
  );
}

/** Bottom-sheet action menu: an optional title, a list of tappable actions, + optional cancel. */
export function MenuSheet({
  visible,
  onClose,
  title,
  actions,
  cancelLabel,
}: {
  visible: boolean;
  onClose: () => void;
  /** Shown above the actions, same size as an option's label but bold. No icon. */
  title?: string;
  actions: MenuAction[];
  cancelLabel?: string;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} padded={false}>
      {title ? (
        <Text variant="bodyStrong" style={styles.sheetTitle}>
          {title}
        </Text>
      ) : null}
      {actions.map((action) => (
        <MenuRow key={action.label} action={action} onClose={onClose} />
      ))}
      {cancelLabel ? (
        <MenuRow action={{ label: cancelLabel, onPress: () => {} }} onClose={onClose} />
      ) : null}
    </BottomSheet>
  );
}

// Horizontal inset shared by the title and every row, so their edges line up
// and the options read as inset from the sheet's edges rather than flush
// against them.
const ROW_HORIZONTAL_PADDING = spacing["2xl"];

const styles = StyleSheet.create({
  // --- Whole-sheet chrome (sits above the row list) ---
  sheetTitle: {
    paddingHorizontal: ROW_HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  // --- Per-row layout (one action or the cancel row) ---
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: ROW_HORIZONTAL_PADDING,
    paddingVertical: spacing.sm,
  },
  rowIconSlot: { width: ICON_SLOT_WIDTH, alignItems: "center" },
});
