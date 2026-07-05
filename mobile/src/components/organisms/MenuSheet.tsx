import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { spacing, useScalePress, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";

export type MenuAction = {
  label: string;
  onPress: () => void;
  /** Title color (e.g. `destructive` for a delete action). */
  color?: keyof ThemeColors;
};

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
      style={[styles.item, press.animatedStyle]}
    >
      <Text variant="bodyStrong" color={action.color ?? "text"}>
        {action.label}
      </Text>
    </AnimatedPressable>
  );
}

/** Bottom-sheet action menu: a list of tappable actions + optional cancel. */
export function MenuSheet({
  visible,
  onClose,
  actions,
  cancelLabel,
}: {
  visible: boolean;
  onClose: () => void;
  actions: MenuAction[];
  cancelLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} padded={false}>
      {actions.map((action, i) => (
        <Fragment key={action.label}>
          {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
          <MenuRow action={action} onClose={onClose} />
        </Fragment>
      ))}
      {cancelLabel ? (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow action={{ label: cancelLabel, onPress: () => {} }} onClose={onClose} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  item: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl },
  divider: { height: StyleSheet.hairlineWidth },
});
