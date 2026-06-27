# Google Play Store Release Checklist

A pre-publishing checklist for the Bible Log mobile app (Expo / React Native,
package `com.mybiblelog.app`). Items are grouped by priority:

- **🔴 Required** — Play will reject the app, or it cannot be built/submitted, without these.
- **🟡 Recommended** — strongly advised for a quality first release; some are Play policy soft-requirements.
- **🟢 Nice to have** — polish and maintainability; safe to defer past the first release.

Status reflects a code review of the `mobile/` directory as of this checklist's creation.
Items marked _(Console)_ live in the Google Play Console, not in this repo.

---

## 🔴 Required

### Legal & policy compliance

- [ ] **Privacy policy.** No privacy policy URL exists in the app or config. Play
  **requires** a privacy policy for every app, and it is mandatory for apps using
  Google Sign-In. Publish a policy and add the URL to the Play listing _(Console)_,
  and ideally link it from the app (see Settings → About below).
- [ ] **Account & data deletion.** `app/(tabs)/settings/account.tsx` only offers
  logout. Play **requires** apps that let users create accounts to provide an
  in-app way to request account/data deletion **and** a publicly reachable
  deletion URL. Add an in-app "Delete account" flow (calling an API endpoint) and
  declare the deletion URL in the Data Safety form.
- [ ] **Data Safety form.** _(Console)_ Must be completed. The app collects an
  email address (email + Google auth) and user-generated Bible log entries, all
  sent to the backend API. Declare data types collected, purpose, encryption in
  transit, and whether data is shared.
- [ ] **Content rating questionnaire.** _(Console)_ Complete the IARC rating
  questionnaire; the app is unrated until this is done.
- [ ] **Target audience & content.** _(Console)_ Declare target age group and
  confirm no ads / appropriate content declarations.

### Build & signing configuration

- [ ] **Production environment secrets.** `app.config.ts` throws if
  `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` are missing.
  Only `localhost`/example defaults exist in `.env.example`. Set production values
  as EAS secrets (pointing `EXPO_PUBLIC_API_BASE_URL` at the **production** API,
  not staging/localhost) before a production build.
- [ ] **Release build format = AAB.** The Play Store requires an Android App
  Bundle. `eas.json` only defines `apk` output for `development`/`preview`; the
  `production` profile has no `android.buildType`, so EAS defaults to `app-bundle`
  (correct) — verify the production build actually produces an `.aab`.
- [ ] **App signing keystore.** Ensure an EAS-managed (or uploaded) release
  keystore exists and enroll in Play App Signing _(Console)_. The keystore's
  signing identity is permanent for this package name.
- [ ] **Google OAuth production SHA-1.** Register the **production** signing
  certificate's SHA-1 with the Android OAuth client in Google Cloud Console (the
  dev build uses the debug SHA-1; see `docs/android-dev-build.md`). Without this,
  Google Sign-In silently fails on the released app.
- [ ] **Play submission credentials.** `eas.json` `submit.production` is empty.
  To use `eas submit`, configure a Google Play service-account JSON key (or submit
  the bundle manually). _(Console + eas.json)_
- [ ] **Target API level.** _(Console requirement)_ Confirm the build's
  `targetSdkVersion` meets Google's current minimum for new apps/updates
  (Expo SDK 54 / RN 0.81 targets a recent level — verify after `expo prebuild`).
- [ ] **versionCode management.** `eas.json` uses `appVersionSource: "remote"` with
  `autoIncrement: true` for production, so EAS owns the `versionCode`. Confirm this
  is initialized correctly so each upload has a unique, increasing code.

### Store listing assets _(Console)_

- [ ] App title, short description, and full description (localize for `en` and
  `es` to match the in-app locales).
- [ ] Hi-res app icon (512×512), feature graphic (1024×500), and phone
  screenshots (and tablet screenshots if listing as tablet-optimized).
- [ ] Support / contact email address.

---

## 🟡 Recommended

- [ ] **Settings → About screen.** No app version, build, or legal links are shown
  anywhere in the UI. Add an About section showing the version
  (`Constants.expoConfig.version`) plus links to the privacy policy, terms, and a
  support contact. This aids support and review.
- [ ] **Terms of Service.** Consider publishing and linking a ToS alongside the
  privacy policy.
- [ ] **Crash & error reporting.** No crash reporting (e.g. Sentry) is configured.
  Add one so production crashes are visible after launch.
- [ ] **Audit Android permissions.** No explicit `android.permissions` allow-list
  in `app.json`; Expo/plugins may inject permissions at prebuild. Run
  `expo prebuild` and review the generated `AndroidManifest.xml` — keep `INTERNET`,
  and use `android.permissions`/`blockedPermissions` to strip anything unexpected,
  since unused sensitive permissions trigger Play review friction.
- [ ] **Verify force-upgrade path end-to-end.** `UpgradeGate` / `appSupportApi`
  call `/mobile-app/support`. Confirm the production API returns correct
  `minimumSupported`/`storeUrl` and that `storeUrl` points at the real Play listing
  (the standalone `app/upgrade-required.tsx` route hardcodes `storeUrl: null` and
  `minimumSupported.version: "?"`).
- [ ] **Test on a real release build.** Run a closed/internal testing track
  _(Console)_ to validate Google Sign-In, email login, deep-link OAuth return
  (`scheme: "biblelog"`), offline behavior, and dark/light themes on physical
  devices before production rollout.
- [ ] **Predictive back gesture.** `predictiveBackGestureEnabled: false` opts out
  of the Android 14+ predictive back animation. Re-enable and verify navigation if
  targeting a polished modern UX.
- [ ] **Localized store listing.** The app ships `en` and `es`; provide localized
  Play listings to match.

---

## 🟢 Nice to have

- [ ] **Remove leftover template assets.** `assets/images/react-logo.png`,
  `react-logo@2x.png`, `react-logo@3x.png`, and `partial-react-logo.png` are
  unused Expo starter assets — delete them to reduce bundle size and clutter.
- [ ] **Automated tests.** No test runner is configured (no Jest, no `*.test.*`
  files). Add unit/component tests for auth, log-entry, and settings logic to
  guard regressions.
- [ ] **Resolve config FIXMEs.** `app.config.ts` has a FIXME suggesting env
  validation move to `config.ts`; `docs/android-dev-build.md` has an unfinished
  "editing below this line" section. Tidy before release docs are shared.
- [ ] **Tablet / large-screen support.** `ios.supportsTablet` is true; consider
  verifying and declaring Android large-screen/foldable support for better store
  placement.
- [ ] **App shortcuts / monochrome icon polish.** A monochrome adaptive icon is
  already provided (`android-icon-monochrome.png`) — verify it renders well under
  Android themed icons.
- [ ] **Pre-launch report review.** _(Console)_ After uploading to a test track,
  review Google's automated pre-launch report for crashes and accessibility issues.

---

### Quick status summary

| Area | State |
| --- | --- |
| App identity (name, package, icons, splash, adaptive icon) | ✅ In good shape |
| Auth (Google + email), i18n (en/es), theming, force-upgrade gate | ✅ Implemented |
| Privacy policy / terms | ❌ Missing |
| In-app account/data deletion | ❌ Missing (logout only) |
| Production build secrets & OAuth prod SHA-1 | ⚠️ Not configured |
| Play submission credentials (`eas submit`) | ⚠️ Empty in `eas.json` |
| About/version/support surface in UI | ⚠️ Absent |
| Crash reporting & tests | ⚠️ Absent |
| Leftover template assets | ⚠️ Present |
