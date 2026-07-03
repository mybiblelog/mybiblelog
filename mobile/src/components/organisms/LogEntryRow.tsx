import { memo, useMemo } from "react";
import { Bible } from "@mybiblelog/shared";
import type { LogEntry } from "@/src/types/log-entry";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { IconButton } from "../atoms/IconButton";
import { ListItem } from "../molecules/ListItem";

/** Memoized list row for a log entry — the most-repeated row in the app. */
export const LogEntryRow = memo(function LogEntryRow({
  entry,
  onPressMenu,
  meta,
}: {
  entry: LogEntry;
  onPressMenu: () => void;
  meta?: string;
}) {
  const { locale } = useLocale();
  const range = useMemo(
    () => Bible.displayVerseRange(entry.startVerseId, entry.endVerseId, locale),
    [entry.endVerseId, entry.startVerseId, locale]
  );
  const displayDate = useMemo(() => formatLongDate(entry.date, locale), [entry.date, locale]);

  return (
    <ListItem
      title={range}
      subtitle={displayDate}
      meta={meta}
      trailing={
        <IconButton
          name="ellipsis-vertical"
          size={18}
          accessibilityLabel={range}
          onPress={onPressMenu}
        />
      }
    />
  );
});
