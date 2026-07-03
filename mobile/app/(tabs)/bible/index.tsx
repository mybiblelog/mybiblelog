import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bible, type BookProgress } from "@mybiblelog/shared";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { AnimatedList, Card, Screen, SegmentBar, Spinner, Text } from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { useBibleProgress } from "@/src/stores/bibleProgress";

const Separator = () => <View style={styles.separator} />;

/** Memoized book row. Its `book` snapshot is reference-stable from the
 * precomputed store, so it only re-renders when its data or the theme changes. */
const BookRow = memo(function BookRow({
  book,
  bookName,
  onPress,
}: {
  book: BookProgress;
  bookName: string;
  onPress: (bookIndex: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceAlt },
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(book.bookIndex)}
    >
      <View style={styles.cardTopRow}>
        <Ionicons
          name="star"
          size={18}
          color={book.complete ? colors.starGold : colors.border}
          style={styles.star}
        />
        <Text variant="bodyStrong" style={styles.bookName} numberOfLines={1}>
          {bookName}
        </Text>
        <Text variant="caption" color="mutedText" style={styles.percent}>
          {book.percentage}%
        </Text>
      </View>
      <SegmentBar segments={book.segments} />
    </Pressable>
  );
});

export default function BibleIndex() {
  const { locale } = useLocale();
  const progress = useBibleProgress();

  const handlePress = useCallback((bookIndex: number) => {
    router.push(`/bible/${bookIndex}`);
  }, []);

  if (!progress) {
    return (
      <Screen edges={[]}>
        <Spinner center />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Card style={styles.plaque}>
        <Text variant="label" style={styles.plaquePercent}>
          {progress.percentage}%
        </Text>
        <SegmentBar segments={progress.segments} thick />
      </Card>

      <AnimatedList
        data={progress.books}
        keyExtractor={(item) => String(item.bookIndex)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <BookRow
            book={item}
            bookName={Bible.getBookName(item.bookIndex, locale)}
            onPress={handlePress}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  plaque: {
    margin: spacing.screenH,
  },
  plaquePercent: {
    textAlign: "right",
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.listBottom,
  },
  separator: { height: spacing.md },
  pressed: { opacity: 0.7 },
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  star: {
    width: 20,
  },
  bookName: {
    flex: 1,
  },
  percent: {
    width: 48,
    textAlign: "right",
  },
});
