import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bible, type BookProgress, type TestamentFilter } from "@mybiblelog/shared";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  AnimatedList,
  Button,
  Card,
  Screen,
  ScreenHeader,
  SegmentBar,
  SegmentedControl,
  Spinner,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { useBibleProgress } from "@/src/stores/bibleProgress";
import {
  noteCountsActions,
  selectAnyBookHasNotes,
  useBookNoteCounts,
} from "@/src/stores/passageNoteCounts";

const Separator = () => <View style={styles.separator} />;

/** Memoized book row. Its `book` snapshot is reference-stable from the
 * precomputed store, so it only re-renders when its data or the theme changes. */
const BookRow = memo(function BookRow({
  book,
  bookName,
  notesCount,
  showBadge,
  onPress,
}: {
  book: BookProgress;
  bookName: string;
  notesCount: number;
  showBadge: boolean;
  onPress: (bookIndex: number) => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable
      testID={`bible.book-${book.bookIndex}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceMuted },
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
        {showBadge ? (
          <View style={[styles.noteBadge, { backgroundColor: colors.surface }]}>
            <Text variant="caption" color="mutedText">
              {notesCount === 1
                ? t("book_note_count_one")
                : t("book_note_count_other", { count: notesCount })}
            </Text>
          </View>
        ) : null}
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
  const noteCounts = useBookNoteCounts();
  const anyBooksHaveNotes = useMemo(() => selectAnyBookHasNotes(noteCounts), [noteCounts]);
  const navigatingRef = useRef(false);

  // Refresh counts on focus so notes added elsewhere (Notes tab, web) show up.
  // Also clears the navigation guard so a book can be opened again after returning.
  useFocusEffect(
    useCallback(() => {
      navigatingRef.current = false;
      void noteCountsActions.refresh();
    }, [])
  );

  const handlePress = useCallback((bookIndex: number) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push(`/bible/${bookIndex}`);
  }, []);

  const filtered = useMemo(() => {
    if (!progress) return null;
    const books = progress.books.filter((book) => {
      if (testament === "old") return !Bible.isNewTestament(book.bookIndex);
      if (testament === "new") return Bible.isNewTestament(book.bookIndex);
      return true;
    });
    const totalVerses = books.reduce((sum, book) => sum + book.totalVerses, 0);
    const versesRead = books.reduce((sum, book) => sum + book.versesRead, 0);
    const percentage = totalVerses ? Math.floor((versesRead / totalVerses) * 100) : 0;
    const segments = books.flatMap((book) => book.segments);
    return { books, percentage, segments };
  }, [progress, testament]);

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title={t("bible_books_title")}
        right={
          <Button
            label={t("progress_title")}
            testID="bible.progress-link"
            variant="secondary"
            leftIcon="stats-chart-outline"
            rightIcon="chevron-forward"
            onPress={() => router.push("/bible/progress")}
          />
        }
      />
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
        key={testament}
        data={filtered.books}
        keyExtractor={(item) => String(item.bookIndex)}
        // Fixed-size list (66 books): render it all up front instead of
        // FlatList's default incremental backfill, so the page doesn't
        // visibly grow after mount.
        initialNumToRender={filtered.books.length}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <BookRow
            book={item}
            bookName={Bible.getBookName(item.bookIndex, locale)}
            notesCount={noteCounts?.[item.bookIndex] ?? 0}
            showBadge={anyBooksHaveNotes}
            onPress={handlePress}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.pageGutter,
    paddingTop: spacing.pageTop,
    gap: spacing.sm,
  },
  plaque: {
    margin: spacing.pageGutter,
  },
  plaquePercent: {
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.pageGutter,
    paddingBottom: spacing.listBottom,
  },
  separator: { height: spacing.sm },
  pressed: { opacity: 0.7 },
  card: {
    borderRadius: radius.xl,
    padding: spacing.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  star: {
    width: 20,
  },
  bookName: {
    flex: 1,
  },
  noteBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing["2xs"],
  },
  percent: {
    width: 48,
    textAlign: "right",
  },
});
