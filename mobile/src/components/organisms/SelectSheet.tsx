import { FlatList, StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { Icon } from "../atoms/Icon";
import { ListItem } from "../molecules/ListItem";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  visible: boolean;
  title: string;
  options: SelectOption<T>[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** Bottom-sheet single-select list with a checkmark on the active option. */
export function SelectSheet<T extends string | number>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: Props<T>) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} padded={false}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <FlatList
        data={options}
        keyExtractor={(item) => String(item.value)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const selected = selectedValue === item.value;
          return (
            <ListItem
              title={item.label}
              bordered={false}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              trailing={selected ? <Icon name="checkmark" size={20} color="primary" /> : undefined}
              style={selected ? { backgroundColor: colors.surfaceAlt } : undefined}
            />
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  list: { maxHeight: 420 },
  listContent: { paddingBottom: spacing.sm },
  separator: { height: StyleSheet.hairlineWidth },
});
