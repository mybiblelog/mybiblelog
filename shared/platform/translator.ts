/**
 * Framework-neutral translation port.
 *
 * Components currently reach for `this.$i18n` / `$t` directly, which ties logic
 * to Vue I18n. Logic that needs translation should instead accept a `Translator`
 * so the same code can be backed by Vue I18n today and react-i18next (or any
 * other library) after a migration.
 */

export interface Translator {
  locale: string;
  /** Translate a key with optional named interpolation params. */
  t: (key: string, params?: Record<string, unknown>) => string;
  /** Pluralized translation; `choice` selects the plural form. */
  tc?: (key: string, choice: number, params?: Record<string, unknown>) => string;
}

/** A no-op translator that echoes keys — handy as a default or in tests. */
export const identityTranslator: Translator = {
  locale: 'en',
  t: key => key,
  tc: key => key,
};
