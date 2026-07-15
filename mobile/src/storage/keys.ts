/**
 * The single registry of every persistent key the app uses, with its value
 * type. Add or change a persisted key here and nowhere else.
 *
 * `appStorage` covers non-sensitive data (AsyncStorage); `secureStorage` covers
 * secrets (OS keychain via `secureBackend`). Types are imported type-only, so
 * the owner modules can depend on this registry without an import cycle.
 *
 * Out of scope by design (see `docs/offline-storage.md`): the `storage.schemaVersion`
 * marker (read by the migration runner before anything hydrates), the frozen
 * migrations (raw literal keys), and the dynamic `cache.*` TTL cache
 * (`dateVerseCountsCache.ts`).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocalUserSettings } from "@/src/settings/userSettingsStorage";
import type { ThemeMode } from "@/src/design/ThemeProvider";
import type { SupportedLocale } from "@/src/i18n/LocaleProvider";
import type { ForceUpgradeCache } from "@/src/upgrade/UpgradeGate";
import type { StoredLogEntry, PendingLogEntryMutation } from "@/src/storage/logEntries";
import type { StoredLocalNote, PendingNoteMutation } from "@/src/storage/passageNotes";
import type { AuthSession } from "@/src/auth/authStorage";
import { createTypedStorage, defineKey } from "./typedStorage";
import { secureBackend } from "./secureBackend";

export const appStorage = createTypedStorage(AsyncStorage, {
  userSettings: defineKey<LocalUserSettings>("userSettings.v1"),
  themeMode: defineKey<ThemeMode>("themeMode.v1"),
  locale: defineKey<SupportedLocale>("locale.v1"),
  forceUpgradeStatus: defineKey<ForceUpgradeCache>("forceUpgradeStatus.v1"),
  logEntries: defineKey<StoredLogEntry[]>("logEntries.v1"),
  logEntryMutations: defineKey<PendingLogEntryMutation[]>("logEntries.mutations.v1"),
  passageNotes: defineKey<StoredLocalNote[]>("passageNotes.local.v1"),
  passageNoteMutations: defineKey<PendingNoteMutation[]>("passageNotes.mutations.v1"),
});

export const secureStorage = createTypedStorage(secureBackend, {
  authSession: defineKey<AuthSession>("auth.session.v1"),
  lastLoggedInEmail: defineKey<string>("auth.lastLoggedInEmail.v1"),
});
