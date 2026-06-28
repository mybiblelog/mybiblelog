import * as Sentry from "@sentry/react-native";

/**
 * Crash reporting via Sentry.
 *
 * Reporting is **opt-in by configuration**: it only activates when
 * `EXPO_PUBLIC_SENTRY_DSN` is set at build time (e.g. via EAS secrets). With no
 * DSN the app runs exactly as before — `init` is a no-op and `Sentry.wrap`
 * returns the component unchanged — so local/dev builds don't report anything
 * unless explicitly configured.
 *
 * Native symbolication / source maps are handled by the `@sentry/react-native/expo`
 * config plugin registered in `app.json`.
 */

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

export function initCrashReporting(): void {
  if (!dsn) return;
  try {
    Sentry.init({
      dsn,
      // Don't attach PII (IP address, etc.) by default.
      sendDefaultPii: false,
      // Performance tracing is off by default to limit data volume; raise this
      // (0.0–1.0) if/when transaction monitoring is wanted.
      tracesSampleRate: 0,
      environment: process.env.EXPO_PUBLIC_ENV?.trim() || undefined,
    });
  } catch {
    // Crash reporting setup must never crash the app.
  }
}

export { Sentry };
