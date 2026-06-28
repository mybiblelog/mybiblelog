import dayjs from "dayjs";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import type { LogEntry } from "@/src/types/log-entry";
import {
  AnimatedList,
  Card,
  ChapterMenu,
  LogEntryEditorModal,
  Screen,
  SegmentBar,
  type SegmentBarSegment,
  Spinner,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { useLogEntries } from "@/src/stores/logEntries";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { useUserSettings } from "@/src/stores/userSettings";
import { openPassageInBible } from "@/src/bible/openInBible";
import { useToast } from "@/src/toast/ToastProvider";

// Brand gold for a fully-read chapter star — a single decorative accent
// outside the theme palette.
const GOLD_STAR = "#ffd700";

export default function BibleBookScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { locale } = useLocale();
  const { width: windowWidth } = useWindowDimensions();
  const { state: logState, createEntry } = useLogEntries();
  const { state: settingsState } = useUserSettings();
  const params = useLocalSearchParams<{ book?: string }>();

  const bookIndex = useMemo(() => Number(params.book), [params.book]);
  const bookName = useMemo(() => {
    if (!Number.isFinite(bookIndex) || bookIndex < 1) return "Book";
    return Bible.getBookName(bookIndex, locale) || "Book";
  }, [bookIndex, locale]);

  const tileMetrics = useMemo(() => {
    const columns = 3;
    const horizontalPadding = 16;
    const gap = 10;
    const available = windowWidth - horizontalPadding * 2;
    const tileWidth = Math.floor((available - gap * (columns - 1)) / columns);
    return { columns, horizontalPadding, gap, tileWidth };
  }, [windowWidth]);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const lookBackDate =
    settingsState.status === "ready" ? settingsState.settings.lookBackDate : "0000-00-00";

  const currentLogEntries = useMemo(() => {
    if (logState.status !== "ready") return [];
    return logState.entries.filter((e) => e.date >= lookBackDate);
  }, [logState, lookBackDate]);

  const bookSegments = useMemo<SegmentBarSegment[]>(() => {
    if (!Number.isFinite(bookIndex) || bookIndex < 1) return [];
    const raw = Bible.generateBookSegments(bookIndex, currentLogEntries);
    return raw.map((s, idx) => ({
      id: `${bookIndex}-${idx}-${s.startVerseId}-${s.endVerseId}`,
      read: !!s.read,
      verseCount: s.verseCount,
    }));
  }, [bookIndex, currentLogEntries]);

  const bookPercent = useMemo(() => {
    if (!Number.isFinite(bookIndex) || bookIndex < 1) return 0;
    const total = Bible.getBookVerseCount(bookIndex);
    const read = Bible.countUniqueBookRangeVerses(bookIndex, currentLogEntries);
    return total ? Math.floor((read / total) * 100) : 0;
  }, [bookIndex, currentLogEntries]);

  type ChapterTile = {
    chapterIndex: number;
    complete: boolean;
    percentage: number;
    segments: SegmentBarSegment[];
    startVerseId: number;
    endVerseId: number;
  };

  const chapters = useMemo<ChapterTile[]>(() => {
    if (!Number.isFinite(bookIndex) || bookIndex < 1) return [];
    const chapterCount = Bible.getBookChapterCount(bookIndex);
    const out: ChapterTile[] = [];
    for (let c = 1; c <= chapterCount; c++) {
      const total = Bible.getChapterVerseCount(bookIndex, c);
      const read = Bible.countUniqueBookChapterRangeVerses(bookIndex, c, currentLogEntries);
      const percentage = total ? Math.floor((read / total) * 100) : 0;
      const complete = percentage === 100;

      const startVerseId = Bible.makeVerseId(bookIndex, c, 1);
      const endVerseId = Bible.makeVerseId(bookIndex, c, total || 1);

      const raw = Bible.generateBookChapterSegments(bookIndex, c, currentLogEntries);
      const segments: SegmentBarSegment[] = raw.map((s, idx) => ({
        id: `${bookIndex}-${c}-${idx}-${s.startVerseId}-${s.endVerseId}`,
        read: !!s.read,
        verseCount: s.verseCount,
      }));

      out.push({ chapterIndex: c, complete, percentage, segments, startVerseId, endVerseId });
    }
    return out;
  }, [bookIndex, currentLogEntries]);

  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [editorChapterIndex, setEditorChapterIndex] = useState<number | null>(null);
  const selectedChapter = useMemo(
    () => (selectedChapterIndex ? chapters.find((c) => c.chapterIndex === selectedChapterIndex) : undefined),
    [chapters, selectedChapterIndex]
  );
  const editorChapter = useMemo(
    () => (editorChapterIndex ? chapters.find((c) => c.chapterIndex === editorChapterIndex) : undefined),
    [chapters, editorChapterIndex]
  );

  // If the list changes (sync), ensure selection is still valid.
  useEffect(() => {
    if (selectedChapterIndex === null) return;
    if (!chapters.some((c) => c.chapterIndex === selectedChapterIndex)) {
      setSelectedChapterIndex(null);
    }
  }, [chapters, selectedChapterIndex]);

  const initialEntryForEditor = useMemo<LogEntry | undefined>(() => {
    if (!editorChapter) return undefined;
    return {
      date: today,
      startVerseId: editorChapter.startVerseId,
      endVerseId: editorChapter.endVerseId,
    };
  }, [editorChapter, today]);

  if (logState.status !== "ready" || settingsState.status !== "ready") {
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
          {bookPercent}%
        </Text>
        <SegmentBar segments={bookSegments} thick />
      </Card>

      <AnimatedList
        data={chapters}
        keyExtractor={(item) => String(item.chapterIndex)}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: colors.surfaceAlt,
                width: tileMetrics.tileWidth,
                marginRight: index % tileMetrics.columns === tileMetrics.columns - 1 ? 0 : tileMetrics.gap,
                marginBottom: tileMetrics.gap,
              },
              pressed && styles.pressed,
            ]}
            onPress={() => setSelectedChapterIndex(item.chapterIndex)}
          >
            <Text variant="bodyStrong">{item.chapterIndex}</Text>

            <View style={styles.tileCenter}>
              <Ionicons
                name="star"
                size={22}
                color={item.complete ? GOLD_STAR : colors.border}
              />
            </View>

            <View style={styles.tileBar}>
              <SegmentBar segments={item.segments} />
            </View>
          </Pressable>
        )}
      />

      <ChapterMenu
        visible={selectedChapterIndex !== null}
        onClose={() => setSelectedChapterIndex(null)}
        onOpenInBible={() => {
          if (!selectedChapter) return;
          void (async () => {
            const ok = await openPassageInBible(selectedChapter.startVerseId, {
              preferredBibleApp: settingsState.settings.preferredBibleApp,
              preferredBibleVersion: settingsState.settings.preferredBibleVersion,
            });
            if (!ok) {
              showToast({ type: "error", message: "Unable to open Bible app." });
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
        submitLabel="Save"
        initialEntry={initialEntryForEditor}
        onSubmit={(entry) => {
          void createEntry(entry);
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

