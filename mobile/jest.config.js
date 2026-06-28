/**
 * Jest config for the mobile app. Uses the `jest-expo` preset so React Native /
 * Expo modules transform correctly, plus a setup file that mocks native modules
 * (AsyncStorage, SecureStore, NetInfo, Reanimated, Google Sign-In, Sentry) so
 * both pure logic and component tests run headless under Node.
 */
module.exports = {
  preset: "jest-expo",
  // Reanimated 4 / worklets ship a jest resolver that strips `.native`
  // extensions so the jest-safe builds load (avoids "Native part of Worklets
  // doesn't seem to be initialized").
  resolver: "<rootDir>/node_modules/react-native-worklets/jest/resolver.js",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    // expo-modules-core is nested under expo/ (not hoisted in this monorepo),
    // so jest's resolver needs an explicit pointer.
    "^expo-modules-core$":
      "<rootDir>/node_modules/expo/node_modules/expo-modules-core",
    "^expo-modules-core/(.*)$":
      "<rootDir>/node_modules/expo/node_modules/expo-modules-core/$1",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.{ts,tsx}",
    "<rootDir>/app/**/*.test.{ts,tsx}",
  ],
  clearMocks: true,
};
