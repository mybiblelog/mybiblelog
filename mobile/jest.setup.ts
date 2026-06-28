/**
 * Global test setup. Mocks the native modules the app touches so tests can run
 * headless under jest-expo. Keep these stubs minimal — individual tests can
 * override behavior with `jest.spyOn` / `mockImplementation` as needed.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

// React Native Gesture Handler — installs no-op gesture handlers.
import "react-native-gesture-handler/jestSetup";

// AsyncStorage — official in-memory mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Reanimated 4 runs its jest-safe build via the worklets resolver (see
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
  getLocales: () => [
    { languageTag: "en-US", languageCode: "en", regionCode: "US" },
  ],
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
