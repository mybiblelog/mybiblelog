/**
 * Global test setup. Mocks the native modules the app touches so tests can run
 * headless under jest-expo. Keep these stubs minimal — individual tests can
 * override behavior with `jest.spyOn` / `mockImplementation` as needed.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

// React Native Gesture Handler — installs no-op gesture handlers.
import "react-native-gesture-handler/jestSetup";

// TECH-DEBT(rngh3-jest-ui-runtime-bindings): RNGH 3 calls worklets'
// `getUIRuntimeHolder`, which throws in the web build that jest resolves to.
// Mirrors RNGH's own web no-op.
jest.mock(
  "react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings",
  () => ({ installUIRuntimeBindings: () => {} })
);

// Icon fonts reach expo-font as jest-expo's stubbed asset id, which expo-asset
// rejects; RNTL 14's awaited act() surfaces that rejection, so report fonts as loaded.
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: () => true,
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// AsyncStorage — official in-memory mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// RNTL's awaited render lets providers' async storage loads (e.g. the persisted
// theme mode) land before assertions, so state must not leak between tests.
beforeEach(() => require("@react-native-async-storage/async-storage").clear());

// Reanimated 4 runs its jest-safe build via its jest resolver (see
// jest.config.js), so no manual mock is needed here.

// expo-constants — deterministic config so `src/config.ts` resolves an API base.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: "http://localhost:8080",
        googleWebClientId: "test-web-client-id",
      },
    },
  },
}));

// expo-secure-store — in-memory key/value store.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

// expo-localization — deterministic en-US locale.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US", languageCode: "en", regionCode: "US" }],
  getCalendars: () => [{ timeZone: "UTC" }],
}));

// NetInfo — online by default; tests drive transitions via the returned mock.
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

// expo-store-review — Play In-App Review isn't available off-device.
jest.mock("expo-store-review", () => ({
  isAvailableAsync: jest.fn(async () => true),
  requestReview: jest.fn(async () => {}),
}));

// Native Google Sign-In — not available off-device.
jest.mock("react-native-nitro-google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
  },
}));

// Sentry — swallow crash reporting in tests.
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: (c: unknown) => c,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  Native: {},
}));

// expo-notifications — no scheduler/permissions in the Jest environment.
// Individual tests override behavior with `jest.spyOn`/`mockResolvedValue`.
jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(async () => "test-notification-id"),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
}));

// expo-haptics — no-op.
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// Silence noisy act() / animation warnings that don't affect assertions.
const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("useNativeDriver") || msg.includes("not wrapped in act")) {
      return;
    }
    originalError(...(args as []));
  });
});
