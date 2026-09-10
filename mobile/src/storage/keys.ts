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
import type { OnboardingState } from "@/src/onboarding/onboardingStorage";
import type { ThemeMode } from "@/src/design/ThemeProvider";
import type { SupportedLocale } from "@/src/i18n/LocaleProvider";
import type { ForceUpgradeCache } from "@/src/upgrade/UpgradeGate";
import type { StoredLogEntry, PendingLogEntryMutation } from "@/src/storage/logEntries";
import type { StoredLocalNote, PendingNoteMutation } from "@/src/storage/passageNotes";
import type { AuthSession } from "@/src/auth/authStorage";
import { createTypedStorage, defineKey } from "./typedStorage";
import type { StorageHooks } from "./typedStorage";
import { reportStorageFailure, reportStorageOk } from "./health";
import { secureBackend } from "./secureBackend";

/**
 * Both backends report their outcomes to `storage/health.ts`. Wiring it here
 * rather than inside `typedStorage` keeps that module a pure (de)serialization
 * layer, and keeps `health.ts` free of any dependency on this registry.
 */
const healthHooks: StorageHooks = {
  onFailure: reportStorageFailure,
  onOk: reportStorageOk,
};

export const appStorage = createTypedStorage(
  AsyncStorage,
  {
    userSettings: defineKey<LocalUserSettings>("userSettings.v1"),
    /**
     * Set when settings are chosen locally before an account exists (the
     * onboarding wizard's "I'm New" path) and cleared once they've been pushed
     * to the server on the next successful sign-in. See `stores/userSettings.ts`.
     */
    settingsPendingServerPush: defineKey<boolean>("userSettings.pendingServerPush.v1"),
    onboarding: defineKey<OnboardingState>("onboarding.v1"),
    themeMode: defineKey<ThemeMode>("themeMode.v1"),
    locale: defineKey<SupportedLocale>("locale.v1"),
    forceUpgradeStatus: defineKey<ForceUpgradeCache>("forceUpgradeStatus.v1"),
    /**
     * Dev-only: whether `expo-dev-menu`'s floating dev tools button is shown.
     * Written only by development builds (see `src/dev/devToolsButton.ts`);
     * a production build never reads or writes it.
     */
    devToolsButtonVisible: defineKey<boolean>("devToolsButtonVisible.v1"),
    logEntries: defineKey<StoredLogEntry[]>("logEntries.v1"),
    logEntryMutations: defineKey<PendingLogEntryMutation[]>("logEntries.mutations.v1"),
    passageNotes: defineKey<StoredLocalNote[]>("passageNotes.local.v1"),
    passageNoteMutations: defineKey<PendingNoteMutation[]>("passageNotes.mutations.v1"),
  },
  healthHooks
);

export const secureStorage = createTypedStorage(
  secureBackend,
  {
    authSession: defineKey<AuthSession>("auth.session.v1"),
    lastLoggedInEmail: defineKey<string>("auth.lastLoggedInEmail.v1"),
  },
  healthHooks
);
