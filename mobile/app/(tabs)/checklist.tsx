import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Bible, type BookProgress, type ChapterProgress } from "@mybiblelog/shared";
import { AnimatedList, Card, Icon, ProgressBar, Screen, Spinner, Text } from "@/src/components";
import { fadeIn, radius, spacing, useTheme } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useBibleProgress } from "@/src/stores/bibleProgress";
import { logEntryActions, useLogEntryList } from "@/src/stores/logEntries";
import { useToast } from "@/src/toast/ToastProvider";

const Separator = () => <View style={styles.separator} />;

/** Memoized single-chapter cell. Re-renders only when its busy state or data
 * changes — not when a sibling chapter's spinner toggles. */
const ChapterCell = memo(function ChapterCell({
  bookIndex,
  bookName,
  chapter,
  isBusy,
  onPress,
}: {
  bookIndex: number;
  bookName: string;
  chapter: ChapterProgress;
  isBusy: boolean;
  onPress: (bookIndex: number, chapterIndex: number) => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable
      onPress={() => onPress(bookIndex, chapter.chapterIndex)}
      accessibilityRole="button"
      accessibilityLabel={t(chapter.complete ? "chapter_read_a11y" : "chapter_unread_a11y", {
        book: bookName,
        chapter: chapter.chapterIndex,
      })}
      accessibilityState={{ checked: chapter.complete, busy: isBusy }}
      style={({ pressed }) => [
        styles.chapterCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
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
  onToggleBook,
  onToggleChapter,
}: {
  book: BookProgress;
  bookName: string;
  isExpanded: boolean;
  busyChapterIndex: number | null;
  onToggleBook: (bookIndex: number) => void;
  onToggleChapter: (bookIndex: number, chapterIndex: number) => void;
}) {
  return (
    <Card padded style={styles.bookCard}>
      <Pressable
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

      <ProgressBar
        progress={book.percentage / 100}
        height={8}
        color="success"
        trackColor="surfaceAlt"
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
            showToast({ type: "info", message: t("logged_before_today") });
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
      <View style={styles.header}>
        <Text variant="title">{t("chapter_checklist")}</Text>
        {busy && <Spinner />}
      </View>

      {!progress ? (
        <Card>
          <Text variant="bodyStrong" color="mutedText">
            {t("loading")}
          </Text>
        </Card>
      ) : (
        <AnimatedList
          data={progress.books}
          keyExtractor={(b: BookProgress) => String(b.bookIndex)}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.listBottom,
  },
  separator: { height: spacing.lg },
  pressed: { opacity: 0.7 },
  bookCard: {
    borderRadius: radius.lg,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  bookHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  bookHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bookName: {
    flexShrink: 1,
  },
  chevronUp: {
    transform: [{ rotate: "180deg" }],
  },
  progress: { marginTop: spacing.sm },
  chaptersWrap: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  chapterCard: {
    width: 54,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumber: {
    marginBottom: spacing.xs,
  },
  chapterIndicator: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
