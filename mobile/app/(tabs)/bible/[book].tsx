import dayjs from "dayjs";
import { Stack, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bible, type ChapterProgress } from "@mybiblelog/shared";
import type { LogEntry } from "@/src/types/log-entry";
import {
  AnimatedList,
  Card,
  ChapterMenu,
  LogEntryEditorModal,
  Screen,
  SegmentBar,
  Spinner,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { logEntryActions } from "@/src/stores/logEntries";
import { useBookProgress } from "@/src/stores/bibleProgress";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useSettingsValue } from "@/src/stores/userSettings";
import { openPassageInBible } from "@/src/bible/openInBible";
import { useToast } from "@/src/toast/ToastProvider";

/** Memoized chapter tile. Its `chapter` snapshot is reference-stable from the
 * precomputed store, so it only re-renders when its data or layout changes. */
const ChapterTile = memo(function ChapterTile({
  chapter,
  bookName,
  width,
  marginRight,
  marginBottom,
  onPress,
}: {
  chapter: ChapterProgress;
  bookName: string;
  width: number;
  marginRight: number;
  marginBottom: number;
  onPress: (chapterIndex: number) => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surfaceAlt, width, marginRight, marginBottom },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t(chapter.complete ? "chapter_read_a11y" : "chapter_unread_a11y", {
        book: bookName,
        chapter: chapter.chapterIndex,
      })}
      onPress={() => onPress(chapter.chapterIndex)}
    >
      <Text variant="bodyStrong">{chapter.chapterIndex}</Text>

      <View style={styles.tileCenter}>
        <Ionicons
          name="star"
          size={22}
          color={chapter.complete ? colors.starGold : colors.border}
        />
      </View>

      <View style={styles.tileBar}>
        <SegmentBar segments={chapter.segments} />
      </View>
    </Pressable>
  );
});

export default function BibleBookScreen() {
  const t = useT();
  const { showToast } = useToast();
  const { locale } = useLocale();
  const { width: windowWidth } = useWindowDimensions();
  const settings = useSettingsValue();
  const params = useLocalSearchParams<{ book?: string }>();

  const bookIndex = useMemo(() => Number(params.book), [params.book]);
  const bookName = useMemo(() => {
    if (!Number.isFinite(bookIndex) || bookIndex < 1) return t("book");
    return Bible.getBookName(bookIndex, locale) || t("book");
  }, [bookIndex, locale, t]);

  const book = useBookProgress(bookIndex);
  // Stabilize the array reference so dependent memos/effects don't re-run every render.
  const chapters = useMemo(() => book?.chapters ?? [], [book]);

  const tileMetrics = useMemo(() => {
    const columns = 3;
    const horizontalPadding = 16;
    const gap = 10;
    const available = windowWidth - horizontalPadding * 2;
    const tileWidth = Math.floor((available - gap * (columns - 1)) / columns);
    return { columns, horizontalPadding, gap, tileWidth };
  }, [windowWidth]);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [editorChapterIndex, setEditorChapterIndex] = useState<number | null>(null);
  // Selection resolves against the current chapter list each render, so if a
  // background sync replaces the list the menu simply closes itself.
  const selectedChapter = useMemo(
    () =>
      selectedChapterIndex
        ? chapters.find((c) => c.chapterIndex === selectedChapterIndex)
        : undefined,
    [chapters, selectedChapterIndex]
  );
  const editorChapter = useMemo(
    () =>
      editorChapterIndex ? chapters.find((c) => c.chapterIndex === editorChapterIndex) : undefined,
    [chapters, editorChapterIndex]
  );

  const initialEntryForEditor = useMemo<LogEntry | undefined>(() => {
    if (!editorChapter) return undefined;
    return {
      date: today,
      startVerseId: editorChapter.startVerseId,
      endVerseId: editorChapter.endVerseId,
    };
  }, [editorChapter, today]);

  const handleTilePress = useCallback((chapterIndex: number) => {
    setSelectedChapterIndex(chapterIndex);
  }, []);

  if (!book || settings === null) {
    return (
      <Screen edges={[]}>
        <Spinner center />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: bookName }} />

      <Card style={styles.plaque}>
        <Text variant="label" style={styles.plaquePercent}>
          {book.percentage}%
        </Text>
        <SegmentBar segments={book.segments} thick />
      </Card>

      <AnimatedList
        data={chapters}
        keyExtractor={(item: ChapterProgress) => String(item.chapterIndex)}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item, index }) => (
          <ChapterTile
            chapter={item}
            bookName={bookName}
            width={tileMetrics.tileWidth}
            marginRight={
              index % tileMetrics.columns === tileMetrics.columns - 1 ? 0 : tileMetrics.gap
            }
            marginBottom={tileMetrics.gap}
            onPress={handleTilePress}
          />
        )}
      />

      <ChapterMenu
        visible={selectedChapter !== undefined}
        onClose={() => setSelectedChapterIndex(null)}
        onOpenInBible={() => {
          if (!selectedChapter) return;
          const { startVerseId } = selectedChapter;
          void (async () => {
            const ok = await openPassageInBible(startVerseId, {
              preferredBibleApp: settings.preferredBibleApp,
              preferredBibleVersion: settings.preferredBibleVersion,
            });
            if (!ok) {
              showToast({ type: "error", message: t("calendar_open_bible_failed") });
            }
          })();
        }}
        onLogReading={() => {
          if (!selectedChapter) return;
          // Important: preserve the chapter selection for the editor before closing the menu.
          setEditorChapterIndex(selectedChapter.chapterIndex);
        }}
      />

      <LogEntryEditorModal
        visible={editorChapterIndex !== null && !!initialEntryForEditor}
        onClose={() => setEditorChapterIndex(null)}
        title={`${bookName} ${editorChapterIndex ?? ""}`}
        submitLabel={t("save")}
        initialEntry={initialEntryForEditor}
        onSubmit={(entry) => {
          void logEntryActions.createEntry(entry);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  plaque: {
    marginHorizontal: spacing.screenH,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  plaquePercent: {
    textAlign: "right",
    marginBottom: spacing.md,
  },
  gridContent: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.listBottom,
  },
  pressed: { opacity: 0.7 },
  tile: {
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 92,
    justifyContent: "space-between",
  },
  tileCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tileBar: {
    marginTop: spacing.md,
  },
});
