# CLAUDE.md — Mobile App

Expo / React Native app. Key facts for agents:

- **SDK**: Expo 55+ — Expo Go does not support this version; use the Android emulator
- **Start command**: `npx expo run:android --device`, then bridge ports: `adb reverse tcp:8080 tcp:8080` and `adb reverse tcp:3000 tcp:3000`
- **Routing**: Expo Router (file-based, `app/` directory)
- **Auth**: Native Google Sign-In via `react-native-nitro-google-signin` — requires a native build; does not work in Expo Go or web mode
- **Build system**: EAS Build; profiles in `eas.json` (`development`, `preview`, `production`)
- **Tests**: `npm test` runs Jest via the `jest-expo` preset (config in `jest.config.js`, native-module mocks in `jest.setup.ts`). Unit + component tests are co-located as `*.test.ts(x)` under `src/` and `app/`. Use `renderWithProviders` from `src/test-utils/` for components needing theme/locale. Reanimated 4 works through the `react-native-worklets/jest/resolver.js` resolver; `expo-modules-core` is path-mapped because it isn't hoisted.
- **Env vars**: `EXPO_PUBLIC_*` prefix, declared in `.env` (copy from `.env.example`)
- **State**: Domain state lives in Zustand stores under `src/stores/` (`auth`, `logEntries`, `userSettings`, `dateVerseCounts`, `connectivity`), initialized once via `src/stores/init.ts` from `app/_layout.tsx`. Each store keeps a `useX()` hook returning `{ state, ...actions }`. Stores consume `@mybiblelog/shared` the way the Nuxt Pinia stores do: the HTTP adapter (`src/api/httpClient.ts`) implements shared's `HttpClient`, and `src/stores/logEntries.ts` uses `shared/log-entries-api`. The offline-first mutation queue (`src/storage/logEntries.ts` + `src/log-entries/sync.ts`) is mobile-only. Pure UI concerns stay as React providers: `ThemeProvider`, `LocaleProvider`, `ToastProvider`. The log-entry editor is local component state via `src/log-entry-editor/useLogEntryEditor.ts`, which delegates to shared `LogEntryEditorMachine`.
- **Monorepo**: Uses `@mybiblelog/shared` from `../shared`

See `README.md` for development phases (emulator → physical device → preview APK → production) and `docs/` for EAS build setup and Play Store checklist.
