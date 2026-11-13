import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

/** Formats `YYYY-MM-DD` dates in the active locale (default `ll`, e.g. "Nov 8, 2026"). */
export const useLocalizedDate = () => {
  const { locale } = useI18n();
  return (date: string, format = 'll'): string => dayjs(date).locale(locale.value).format(format);
};
