import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";
import { Bible, type BookProgress, type ChapterProgress } from "@mybiblelog/shared";
import {
  AnimatedList,
  Card,
  Icon,
  ProgressBar,
  Screen,
  ScreenHeader,
  Spinner,
  Text,
} from "@/src/components";
import { fadeIn, radius, spacing, useTheme } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useBibleProgress } from "@/src/stores/bibleProgress";
import { logEntryActions, useLogEntryList } from "@/src/stores/logEntries";
import { useToast } from "@/src/toast/ToastProvider";

/** Card inset, matched to the Bible Books tiles so a collapsed book reads as
 * lean as a book tile. Also the basis for the chapter grid's tile width. */
const BOOK_CARD_PADDING = spacing.sm;

const Separator = () => <View style={styles.separator} />;

/** Memoized single-chapter cell. Re-renders only when its busy state or data
 * changes — not when a sibling chapter's spinner toggles. */
const ChapterCell = memo(function ChapterCell({
  bookIndex,
  bookName,
  chapter,
  isBusy,
  tileWidth,
  onPress,
}: {
  bookIndex: number;
  bookName: string;
  chapter: ChapterProgress;
  isBusy: boolean;
  tileWidth: number;
  onPress: (bookIndex: number, chapterIndex: number) => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable
      testID={`checklist.chapter-${bookIndex}-${chapter.chapterIndex}`}
      onPress={() => onPress(bookIndex, chapter.chapterIndex)}
      accessibilityRole="button"
      accessibilityLabel={t(chapter.complete ? "chapter_read_a11y" : "chapter_unread_a11y", {
        book: bookName,
        chapter: chapter.chapterIndex,
      })}
      accessibilityState={{ checked: chapter.complete, busy: isBusy }}
      style={({ pressed }) => [
        styles.chapterCard,
        { width: tileWidth, backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="bodyStrong" style={styles.chapterNumber}>
        {chapter.chapterIndex}
      </Text>
      <View style={styles.chapterIndicator}>
        {isBusy ? (
          <Spinner size="small" color={chapter.complete ? "mutedText" : "success"} />
        ) : (
          <Icon
            name={chapter.complete ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={chapter.complete ? "success" : "border"}
          />
        )}
      </View>
    </Pressable>
  );
});

/** Memoized book card. Its `book` snapshot is reference-stable from the
 * precomputed store; collapsed cards skip the chapter grid entirely. */
const BookCard = memo(function BookCard({
  book,
  bookName,
  isExpanded,
  busyChapterIndex,
  tileWidth,
  onToggleBook,
  onToggleChapter,
}: {
  book: BookProgress;
  bookName: string;
  isExpanded: boolean;
  busyChapterIndex: number | null;
  tileWidth: number;
  onToggleBook: (bookIndex: number) => void;
  onToggleChapter: (bookIndex: number, chapterIndex: number) => void;
}) {
  return (
    <Card padding="none" style={styles.bookCard}>
      <Pressable
        testID={`checklist.book-${book.bookIndex}`}
        onPress={() => onToggleBook(book.bookIndex)}
        accessibilityRole="button"
        accessibilityLabel={bookName}
        accessibilityState={{ expanded: isExpanded }}
        style={({ pressed }) => [styles.bookHeader, pressed && styles.pressed]}
      >
        <View style={styles.bookHeaderLeft}>
          <Icon
            name={book.complete ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={book.complete ? "success" : "border"}
          />
          <Text variant="bodyStrong" style={styles.bookName}>
            {bookName}
          </Text>
        </View>

        <View style={styles.bookHeaderRight}>
          <Text variant="caption" color="mutedText">
            {book.chaptersRead} / {book.totalChapters}
          </Text>
          <View style={isExpanded ? styles.chevronUp : undefined}>
            <Icon name="chevron-down" size={18} color="mutedText" />
          </View>
        </View>
      </Pressable>

      {/* `progressTrack` (web `--mbl-progress-track-bg`), not a surface tone:
          in dark, `surfaceMuted` is the same #242424 as the card it sits on,
          so an empty bar was invisible. */}
      <ProgressBar
        progress={book.percentage / 100}
        height={8}
        color="success"
        trackColor="progressTrack"
        style={styles.progress}
      />

      {isExpanded && (
        <Animated.View entering={fadeIn()} style={styles.chaptersWrap}>
          {book.chapters.map((c) => (
            <ChapterCell
              key={c.chapterIndex}
              bookIndex={book.bookIndex}
              bookName={bookName}
              chapter={c}
              isBusy={busyChapterIndex === c.chapterIndex}
              tileWidth={tileWidth}
              onPress={onToggleChapter}
            />
          ))}
        </Animated.View>
      )}
    </Card>
  );
});

export default function Checklist() {
  const t = useT();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const logEntries = useLogEntryList();
  const progress = useBibleProgress();

  const [busyChapter, setBusyChapter] = useState<string | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const { width: windowWidth } = useWindowDimensions();

  // Tiles expand to fill the card edge-to-edge: derive the column count from a
  // ~54pt minimum tile, then split the available width (minus gaps) evenly.
  // `available` must be the card's *inner* width — overstating it picks a
  // column count whose row is wider than the card, so the last tile wraps and
  // leaves a tile-sized hole on the right.
  const tileWidth = useMemo(() => {
    const gap = spacing.sm; // matches chaptersWrap gap
    const available = windowWidth - spacing.pageGutter * 2 - BOOK_CARD_PADDING * 2;
    const columns = Math.max(1, Math.floor((available + gap) / (54 + gap)));
    return Math.floor((available - gap * (columns - 1)) / columns);
  }, [windowWidth]);

  // Tab screens stay mounted, so collapse everything on blur — re-entry always
  // starts with all accordions closed (and no visible collapse animation).
  useFocusEffect(
    useCallback(() => {
      return () => setExpandedBooks({});
    }, [])
  );

  const toggleBook = useCallback((bookIndex: number) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [String(bookIndex)]: !prev[String(bookIndex)],
    }));
  }, []);

  const toggleChapter = useCallback(
    async (bookIndex: number, chapterIndex: number) => {
      if (busyChapter) return;
      if (logEntries === null) return;

      const key = `${bookIndex}.${chapterIndex}`;
      setBusyChapter(key);

      const date = dayjs().format("YYYY-MM-DD");
      const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
      const endVerseId = Bible.makeVerseId(
        bookIndex,
        chapterIndex,
        Bible.getChapterVerseCount(bookIndex, chapterIndex)
      );

      const book = progress?.books.find((b) => b.bookIndex === bookIndex);
      const isComplete =
        book?.chapters.find((c) => c.chapterIndex === chapterIndex)?.complete === true;

      try {
        if (isComplete) {
          const matching = logEntries.find(
            (e) => e.date === date && e.startVerseId === startVerseId && e.endVerseId === endVerseId
          );

          if (matching?.clientId) {
            await logEntryActions.deleteEntry(matching.clientId);
          } else {
            // Completion is verse-coverage based, so a chapter can read as complete
            // without having an entry of its own to delete. Name the actual reason:
            // covered by a wider entry logged today, or covered only by earlier dates.
            const loggedToday =
              Bible.filterRangesByBookChapter(
                bookIndex,
                chapterIndex,
                logEntries.filter((e) => e.date === date)
              ).length > 0;
            showToast({
              type: "info",
              message: t(loggedToday ? "logged_in_longer_passage" : "logged_before_today"),
            });
          }
        } else {
          await logEntryActions.createEntry({ date, startVerseId, endVerseId });
          // A light tap marks the moment a chapter is completed.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      } catch {
        showToast({
          type: "error",
          message: t(isComplete ? "unable_to_mark_incomplete" : "unable_to_mark_complete"),
        });
      } finally {
        setBusyChapter(null);
      }
    },
    [busyChapter, logEntries, progress, showToast, t]
  );

  const busy = Boolean(busyChapter);

  return (
    <Screen padded>
      <ScreenHeader
        title={t("chapter_checklist")}
        style={styles.header}
        right={busy ? <Spinner /> : undefined}
      />

      {!progress ? (
        <Card>
          <Text variant="bodyStrong" color="mutedText">
            {t("loading")}
          </Text>
        </Card>
      ) : (
        <AnimatedList
          data={progress.books}
          // Rows expand/collapse in place; the item layout animation leaves
          // sibling books overlapping the expanded chapter grid, so opt out.
          animateItemLayout={false}
          keyExtractor={(b: BookProgress) => String(b.bookIndex)}
          // Fixed-size list (66 books): render it all up front instead of
          // FlatList's default incremental backfill, so the page doesn't
          // visibly grow after mount.
          initialNumToRender={progress.books.length}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isExpanded = expandedBooks[String(item.bookIndex)] === true;
            const busyChapterIndex =
              busyChapter && busyChapter.startsWith(`${item.bookIndex}.`)
                ? Number(busyChapter.split(".")[1])
                : null;
            return (
              <BookCard
                book={item}
                bookName={Bible.getBookName(item.bookIndex, locale)}
                isExpanded={isExpanded}
                busyChapterIndex={busyChapterIndex}
                tileWidth={tileWidth}
                onToggleBook={toggleBook}
                onToggleChapter={toggleChapter}
              />
            );
          }}
          ItemSeparatorComponent={Separator}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.sm },
  listContent: {
    paddingBottom: spacing.listBottom,
  },
  separator: { height: spacing.sm },
  pressed: { opacity: 0.7 },
  bookCard: {
    borderRadius: radius["2xl"],
    padding: BOOK_CARD_PADDING,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  bookHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bookName: {
    flexShrink: 1,
  },
  chevronUp: {
    transform: [{ rotate: "180deg" }],
  },
  progress: { marginTop: spacing.xs },
  chaptersWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chapterCard: {
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumber: {
    marginBottom: spacing["2xs"],
  },
  chapterIndicator: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
