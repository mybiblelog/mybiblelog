import { LocaleCode } from '@shared/dist/i18n';
import { getConfig } from '../../../config';

export const getLocaleBaseUrl = (locale: LocaleCode) => {
  const localePathSegment = locale === 'en' ? '' : '/' + locale;
  return getConfig().siteUrl + localePathSegment;
};
