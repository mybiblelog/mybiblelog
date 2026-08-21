import { StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import type { IconName } from "../atoms/Icon";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

type Props = {
  icon: IconName;
  text: string;
  testID?: string;
};

/**
 * A muted icon + caption row, for explaining why a nearby control is absent or
 * disabled. Deliberately quieter than `InlineAlert` (which is a Card with a
 * title and a CTA): this is a footnote, not an announcement.
 */
export function InlineHint({ icon, text, testID }: Props) {
  return (
    <View style={styles.hint} testID={testID}>
      <Icon name={icon} size={16} color="mutedText" />
      <Text variant="caption" color="mutedText" style={styles.hintText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  hintText: { flex: 1 },
});
