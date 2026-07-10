import type { ApiErrorDetail } from '~/helpers/api-error';

export type TranslateApiError = string | ApiErrorDetail;
export type Terr = (error: TranslateApiError, componentProperties?: Record<string, unknown>) => string;

export default defineNuxtPlugin((nuxtApp) => {
  type I18nLike = { t: (key: string, params?: Record<string, unknown>) => string };

  const $terr: Terr = (error, componentProperties = {}) => {
    if (typeof error === 'string') { return error; }
    const { field, code, properties: errorProperties } = error;
    const i18n = nuxtApp.$i18n as I18nLike;
    return i18n.t(`api_error.${code}`, { field, ...(errorProperties ?? {}), ...componentProperties });
  };

  return { provide: { terr: $terr } };
});
