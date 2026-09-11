import { SectionList, StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { Icon } from "../atoms/Icon";
import { ListItem } from "../molecules/ListItem";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

/** A labeled group of options, rendered under a sticky section header. */
export type SelectSection<T extends string | number> = {
  label: string;
  options: SelectOption<T>[];
};

type BaseProps<T extends string | number> = {
  visible: boolean;
  title: string;
  selectedValue: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
};

type Props<T extends string | number> = BaseProps<T> &
  (
    | { options: SelectOption<T>[]; sections?: never }
    | { sections: SelectSection<T>[]; options?: never }
  );

/**
 * Bottom-sheet single-select list with a checkmark on the active option. Pass
 * either a flat `options` list, or `sections` to group options under sticky
 * labeled headers (e.g. Bible translations grouped by language).
 */
export function SelectSheet<T extends string | number>({
  visible,
  title,
  options,
  sections,
  selectedValue,
  onSelect,
  onClose,
}: Props<T>) {
  const { colors } = useTheme();
  const data = sections ?? [{ label: "", options: options ?? [] }];
  return (
    <BottomSheet visible={visible} onClose={onClose} padded={false}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <SectionList
        sections={data.map((section) => ({ ...section, data: section.options }))}
        keyExtractor={(item) => String(item.value)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) =>
          section.label ? (
            <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
              <Text variant="label" color="mutedText">
                {section.label}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = selectedValue === item.value;
          return (
            <ListItem
              title={item.label}
              variant="plain"
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              trailing={selected ? <Icon name="checkmark" size={20} color="primary" /> : undefined}
              style={selected ? { backgroundColor: colors.surfaceMuted } : undefined}
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
  title: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  list: { maxHeight: 420, flexShrink: 1 },
  listContent: { paddingBottom: spacing.xs },
  sectionHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  separator: { height: StyleSheet.hairlineWidth },
});
