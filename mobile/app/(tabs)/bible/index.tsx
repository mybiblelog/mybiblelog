import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bible, type BookProgress } from "@mybiblelog/shared";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  AnimatedList,
  Button,
  Card,
  Screen,
  SegmentBar,
  SegmentedControl,
  Spinner,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { openNotesForRange } from "@/src/notes/openNotesForRange";
import { useBibleProgress } from "@/src/stores/bibleProgress";
import {
  noteCountsActions,
  selectAnyBookHasNotes,
  useBookNoteCounts,
} from "@/src/stores/passageNoteCounts";

type TestamentFilter = "all" | "old" | "new";

const Separator = () => <View style={styles.separator} />;

/** Memoized book row. Its `book` snapshot is reference-stable from the
 * precomputed store, so it only re-renders when its data or the theme changes. */
const BookRow = memo(function BookRow({
  book,
  bookName,
  notesCount,
  showBadge,
  onPress,
  onPressNotes,
}: {
  book: BookProgress;
  bookName: string;
  notesCount: number;
  showBadge: boolean;
  onPress: (bookIndex: number) => void;
  onPressNotes: (bookIndex: number) => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable
      testID={`bible.book-${book.bookIndex}`}
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
        {showBadge ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${bookName}: ${
              notesCount === 1
                ? t("book_note_count_one")
                : t("book_note_count_other", { count: notesCount })
            }`}
            hitSlop={8}
            onPress={() => onPressNotes(book.bookIndex)}
            style={({ pressed }) => [
              styles.noteBadge,
              { backgroundColor: colors.surface },
              pressed && styles.pressed,
            ]}
          >
            <Text variant="caption" color="mutedText">
              {notesCount === 1
                ? t("book_note_count_one")
                : t("book_note_count_other", { count: notesCount })}
            </Text>
          </Pressable>
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

  const handlePressNotes = useCallback((bookIndex: number) => {
    openNotesForRange(
      Bible.getFirstBookVerseId(bookIndex),
      Bible.getLastBookVerseId(bookIndex),
      "exclusive"
    );
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
      <View style={styles.headerRow}>
        <Text variant="title" style={styles.headerTitle}>
          {t("bible_books_title")}
        </Text>
        <Button
          label={t("progress_title")}
          testID="bible.progress-link"
          variant="ghost"
          size="sm"
          leftIcon="stats-chart-outline"
          onPress={() => router.push("/bible/progress")}
        />
      </View>
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
            onPressNotes={handlePressNotes}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerTitle: { flex: 1 },
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
  noteBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  percent: {
    width: 48,
    textAlign: "right",
  },
});
