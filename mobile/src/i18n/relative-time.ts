/**
 * dayjs-based relative-time strings ("2 hours ago", "in 3 days").
 *
 * The shared package's `displayTimeSince` / `displayDaysSince` use
 * `Intl.RelativeTimeFormat`, which some Hermes/Android builds don't implement,
 * so the app keeps these dayjs versions, which ship their own locale strings.
 * TECH-DEBT(mobile-relative-time-dayjs)
 */
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

// additional locales ('en' is already included)
import "dayjs/locale/es";
import "dayjs/locale/de";
import "dayjs/locale/fr";
import "dayjs/locale/ko";
import "dayjs/locale/pt";
import "dayjs/locale/uk";

dayjs.extend(duration);
dayjs.extend(relativeTime);

/** Time between now and an ISO date/time, e.g. "8 hours ago". */
export const displayTimeSince = (dateTimeString: string, locale = "en"): string => {
  const difference = dayjs(dateTimeString).diff(dayjs());
  return dayjs.duration(difference).locale(locale).humanize(true);
};

/** Days between now and a `YYYY-MM-DD` date, e.g. "2 days ago". */
export const displayDaysSince = (dateString: string, locale = "en"): string => {
  const difference = dayjs(dateString).diff(dayjs(), "day");
  return dayjs.duration(difference, "day").locale(locale).humanize(true);
};
