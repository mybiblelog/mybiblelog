import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Bible, type BookProgress, type TestamentFilter } from "@mybiblelog/shared";
import { filterAndSortBooks } from "@/src/bible/bookList";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  AnimatedList,
  Button,
  Card,
  Screen,
  ScreenHeader,
  SegmentBar,
  BookListToolbar,
  Spinner,
  Text,
} from "@/src/components";
import { durations, easings, radius, spacing, useTheme } from "@/src/design";
import { useBibleProgress } from "@/src/stores/bibleProgress";
import { bookListPrefsActions, useBookListPrefs } from "@/src/stores/bookListPrefs";
import {
  noteCountsActions,
  selectAnyBookHasNotes,
  useBookNoteCounts,
} from "@/src/stores/passageNoteCounts";

const Separator = () => <View style={styles.separator} />;

/** Names the scope the overall bar covers, which follows the testament filter. */
const OVERALL_LABEL_KEYS = {
  all: "insights_books_whole_bible",
  old: "insights_books_old_testament",
  new: "insights_books_new_testament",
} as const satisfies Record<TestamentFilter, string>;

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

  // Badge stays mounted so its layout space is always reserved; only its
  // opacity animates in once note-count data is ready, avoiding the reflow
  // that a mount/unmount pop-in across every row at once would cause.
  const opacity = useSharedValue(showBadge ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(showBadge ? 1 : 0, {
      duration: durations.base,
      easing: easings.decelerate,
    });
  }, [showBadge, opacity]);
  const badgeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
        <Animated.View
          style={[styles.noteBadge, { backgroundColor: colors.surface }, badgeStyle]}
          importantForAccessibility={showBadge ? "auto" : "no-hide-descendants"}
          accessibilityElementsHidden={!showBadge}
        >
          <Text variant="caption" color="mutedText">
            {notesCount === 1
              ? t("book_note_count_one")
              : t("book_note_count_other", { count: notesCount })}
          </Text>
        </Animated.View>
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
  const bookListPrefs = useBookListPrefs();
  const { testament, sortOrder } = bookListPrefs;
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
    const books = filterAndSortBooks(progress.books, bookListPrefs, locale);
    const totalVerses = books.reduce((sum, book) => sum + book.totalVerses, 0);
    const versesRead = books.reduce((sum, book) => sum + book.versesRead, 0);
    const percentage = totalVerses ? Math.floor((versesRead / totalVerses) * 100) : 0;
    // The overall bar always reads Genesis → Revelation, whatever the list order.
    const segments = [...books]
      .sort((a, b) => a.bookIndex - b.bookIndex)
      .flatMap((book) => book.segments);
    return { books, percentage, segments };
  }, [progress, bookListPrefs, locale]);

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
      <BookListToolbar
        testament={testament}
        sortOrder={sortOrder}
        onTestamentChange={bookListPrefsActions.setTestament}
        onSortOrderChange={bookListPrefsActions.setSortOrder}
        testIDPrefix="bible"
      />
      {filtered ? (
        <Card padding="list-item" testID="bible.overall-progress">
          <View style={styles.overallHeader}>
            <Text variant="label">{t(OVERALL_LABEL_KEYS[testament])}</Text>
            <Text variant="label">{filtered.percentage}%</Text>
          </View>
          <SegmentBar segments={filtered.segments} thick />
        </Card>
      ) : null}
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

      <AnimatedList
        key={`${testament}-${sortOrder}`}
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
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  overallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
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
