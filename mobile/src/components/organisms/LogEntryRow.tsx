import { useMemo } from "react";
import { Bible } from "@mybiblelog/shared";
import type { LogEntry } from "@/src/types/log-entry";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { IconButton } from "../atoms/IconButton";
import { ListItem } from "../molecules/ListItem";

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
  const range = useMemo(
    () => Bible.displayVerseRange(entry.startVerseId, entry.endVerseId, locale),
    [entry.endVerseId, entry.startVerseId, locale]
  );
  const displayDate = useMemo(
    () => formatDisplayDate(entry.date, locale),
    [entry.date, locale]
  );

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
}
