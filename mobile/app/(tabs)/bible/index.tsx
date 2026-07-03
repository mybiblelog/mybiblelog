import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bible, type BookProgress } from "@mybiblelog/shared";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  AnimatedList,
  Card,
  Screen,
  SegmentBar,
  SegmentedControl,
  Spinner,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { useBibleProgress } from "@/src/stores/bibleProgress";

type TestamentFilter = "all" | "old" | "new";

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
  const t = useT();
  const { locale } = useLocale();
  const progress = useBibleProgress();
  const [testament, setTestament] = useState<TestamentFilter>("all");

  const handlePress = useCallback((bookIndex: number) => {
    router.push(`/bible/${bookIndex}`);
  }, []);

  const newTestamentBooks = useMemo(
    () =>
      new Set(
        Bible.getBooks()
          .filter((book) => book.newTestament)
          .map((book) => book.bibleOrder)
      ),
    []
  );

  const filtered = useMemo(() => {
    if (!progress) return null;
    const books = progress.books.filter((book) => {
      if (testament === "old") return !newTestamentBooks.has(book.bookIndex);
      if (testament === "new") return newTestamentBooks.has(book.bookIndex);
      return true;
    });
    const totalVerses = books.reduce((sum, book) => sum + book.totalVerses, 0);
    const versesRead = books.reduce((sum, book) => sum + book.versesRead, 0);
    const percentage = totalVerses ? Math.floor((versesRead / totalVerses) * 100) : 0;
    const segments = books.flatMap((book) => book.segments);
    return { books, percentage, segments };
  }, [progress, testament, newTestamentBooks]);

  const header = (
    <View style={styles.header}>
      <Text variant="title">{t("bible_books_title")}</Text>
      <SegmentedControl
        options={[
          { value: "all", label: t("whole_bible") },
          { value: "old", label: t("old_testament_short") },
          { value: "new", label: t("new_testament_short") },
        ]}
        value={testament}
        onChange={setTestament}
      />
    </View>
  );

  if (!progress || !filtered) {
    return (
      <Screen>
        {header}
        <Spinner center />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      <Card style={styles.plaque}>
        <Text variant="label" style={styles.plaquePercent}>
          {filtered.percentage}%
        </Text>
        <SegmentBar segments={filtered.segments} thick />
      </Card>

      <AnimatedList
        data={filtered.books}
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
  header: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.screenTop,
    gap: spacing.md,
  },
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
