import { StyleSheet, View } from "react-native";
import type { BookSortOrder, TestamentFilter } from "@mybiblelog/shared";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { Button } from "../atoms/Button";
import { SegmentedControl } from "./SegmentedControl";

type Props = {
  testament: TestamentFilter;
  sortOrder: BookSortOrder;
  onTestamentChange: (testament: TestamentFilter) => void;
  onSortOrderChange: (sortOrder: BookSortOrder) => void;
  /** Screen scope for test IDs, e.g. `bible` → `bible.sort-toggle`. */
  testIDPrefix: string;
};

/**
 * One-row book-list controls shared by the Bible Books and Chapter Checklist
 * screens: a testament filter taking the free width, and a compact toggle that
 * flips between canonical and alphabetical order. The toggle shows the
 * *current* order ("123"/"ABC", as on narrow web screens); its accessible name
 * spells it out.
 */
export function BookListToolbar({
  testament,
  sortOrder,
  onTestamentChange,
  onSortOrderChange,
  testIDPrefix,
}: Props) {
  const t = useT();
  const alphabetical = sortOrder === "alphabetical";

  return (
    <View style={styles.row}>
      <View style={styles.filter}>
        <SegmentedControl
          options={[
            { value: "all", label: t("whole_bible"), testID: `${testIDPrefix}.testament-all` },
            {
              value: "old",
              label: t("old_testament_short"),
              testID: `${testIDPrefix}.testament-old`,
            },
            {
              value: "new",
              label: t("new_testament_short"),
              testID: `${testIDPrefix}.testament-new`,
            },
          ]}
          value={testament}
          onChange={onTestamentChange}
        />
      </View>
      <Button
        label={alphabetical ? t("book_order_alphabetical_short") : "123"}
        accessibilityLabel={`${t("book_order")}: ${t(
          alphabetical ? "book_order_alphabetical" : "book_order_traditional"
        )}`}
        variant="secondary"
        size="sm"
        leftIcon="swap-vertical"
        testID={`${testIDPrefix}.sort-toggle`}
        onPress={() => onSortOrderChange(alphabetical ? "numerical" : "alphabetical")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  filter: { flex: 1 },
});
