import type { LogEntry } from "@/src/types/log-entry";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TOUCH_TARGET } from "@/src/theme/tokens";

function formatDisplayDate(date: string, locale: string): string {
  // Input is `YYYY-MM-DD`. Parse without timezone shifts.
  const parts = date.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return date;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function LogEntryRow({
  entry,
  onPressMenu,
  meta,
}: {
  entry: LogEntry;
  onPressMenu: () => void;
  meta?: string;
}) {
  const { locale } = useLocale();
  const { colors } = useTheme();
  const range = useMemo(
    () => Bible.displayVerseRange(entry.startVerseId, entry.endVerseId, locale),
    [entry.endVerseId, entry.startVerseId, locale]
  );
  const displayDate = useMemo(
    () => formatDisplayDate(entry.date, locale),
    [entry.date, locale]
  );
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.rowMain}>
        <Text style={[styles.rowRange, { color: colors.text }]}>{range}</Text>
        <Text style={[styles.rowDate, { color: colors.mutedText }]}>
          {displayDate}
        </Text>
        {!!meta && (
          <Text style={[styles.rowMeta, { color: colors.mutedText }]}>{meta}</Text>
        )}
      </View>

      <Pressable style={styles.menuButton} onPress={onPressMenu} hitSlop={10}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.mutedText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: {
    flex: 1,
    paddingRight: 8,
  },
  rowDate: {
    fontSize: 13,
    fontWeight: "700",
  },
  rowRange: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  menuButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

