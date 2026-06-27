# CLAUDE.md — Mobile App

Expo / React Native app. Key facts for agents:

- **SDK**: Expo 55+ — Expo Go does not support this version; use the Android emulator
- **Start command**: `npx expo run:android --device`, then bridge ports: `adb reverse tcp:8080 tcp:8080` and `adb reverse tcp:3000 tcp:3000`
- **Routing**: Expo Router (file-based, `app/` directory)
- **Auth**: Native Google Sign-In via `react-native-nitro-google-signin` — requires a native build; does not work in Expo Go or web mode
- **Build system**: EAS Build; profiles in `eas.json` (`development`, `preview`, `production`)
- **Env vars**: `EXPO_PUBLIC_*` prefix, declared in `.env` (copy from `.env.example`)
- **State**: Provider pattern; no Redux/Zustand; stores in `src/*/provider.tsx`
- **Monorepo**: Uses `@mybiblelog/shared` from `../shared`

See `README.md` for development phases (emulator → physical device → preview APK → production) and `docs/` for EAS build setup and Play Store checklist.
