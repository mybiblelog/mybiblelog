# My Bible Log — Play Store Publishing Plan

A single reference for taking the mobile app from "release-ready code" to a live,
well-optimized Play Store listing. Complements (and corrects) the task-level
[`play-store-checklist.md`](./play-store-checklist.md).

**Corrections to the older checklist** (verify against code, not that doc):

- Expo SDK is **57** / RN 0.86 (checklist says 54/0.81). `targetSdkVersion` is **36** — comfortably above Google's minimum.
- `predictiveBackGestureEnabled` is now **`true`** in `app.json` (checklist says false).
- The app ships **7 locales** — en, de, es, fr, ko, pt, uk (checklist says en/es only). Localize the listing for all 7.

---

## 1. Identity & Naming

| Field | Value | Where it lives / notes |
| --- | --- | --- |
| Play Store title | **My Bible Log: Reading Tracker** | Play Console listing (29/30 chars) |
| On-device launcher name | **My Bible Log** | ⚠️ `app.json` `name` is currently `"Bible Log"` — change before the production build |
| Package name | **`com.mybiblelog.app`** | `app.json` → `android.package`. Permanent after first upload. Keep it: matches primary domain and is already wired into EAS + Google OAuth |
| Slug / scheme | `my-bible-log` / `biblelog` | Internal (EAS project + deep links). No user-facing impact; don't change |
| Developer name | My Bible Log (or your registered entity) | Play Console account setting |
| Website (listing) | `https://www.mybiblelog.com` | Product site; also the cross-device sync story |
| Promo site | `https://biblelog.app` | App-specific landing page; point it at the Play listing URL (`https://play.google.com/store/apps/details?id=com.mybiblelog.app`) once live |
| Support email | *(choose — e.g. support@mybiblelog.com)* | Required Play Console field |
| Privacy policy URL | `https://www.mybiblelog.com/policy/privacy` | Already linked in-app (`src/constants/links.ts`); must also be entered in the Play listing |

**Domain roles:** `mybiblelog.com` is the product (PWA, account, policies) — use it for
all listing URLs so brand and privacy-policy domains match. `biblelog.app` is a marketing
funnel: keep it as a lightweight promo page whose primary CTA is the Play Store badge
(plus a secondary "use it on the web" link).

### Pre-release naming action items

1. `mobile/app.json`: `"name": "Bible Log"` → `"name": "My Bible Log"`.
2. Verify the launcher label on a device after the change (12 chars — fits without truncation on standard launchers).

---

## 2. ASO Strategy

Google Play has no keyword field. Indexing weight is roughly:
**title (30) > short description (80) > full description (4000)**, plus engagement
signals (installs, ratings, retention). Each keyword only needs to appear once or
twice; stuffing is penalized.

### Keyword targets

| Tier | Keywords | Where placed |
| --- | --- | --- |
| Primary (high intent) | bible reading tracker, bible tracker, bible reading log | Title covers all three ("My **Bible Log**: **Reading Tracker**" indexes the full phrase "bible reading tracker") |
| Secondary | bible reading plan, bible progress, read the whole bible, bible in a year, chapter checklist | Short + full description |
| Habit/journal adjacency | bible reading habit, bible journal, bible notes, scripture | Full description |
| Differentiators | free, no ads, no subscriptions, at your own pace, offline | Short + full description; also the trust close |

**What we deliberately do NOT target:** "bible app" / "bible study app" head terms
(dominated by YouVersion-class apps with millions of reviews; unwinnable and attracts
users expecting Bible *text*, which hurts ratings). The listing copy explicitly says it
works *alongside* your favorite Bible app — that sets expectations and converts the
right users.

### Title (30-char limit)

> **My Bible Log: Reading Tracker** — 29 chars ✓

### Short description (80-char limit) — candidates

1. **(Recommended)** `Track your Bible reading at your own pace. Free — no ads, no subscriptions.` — 75 chars ✓
2. `Free Bible reading tracker. Set daily goals, log chapters, and take notes.` — 74 chars ✓
3. `Read the whole Bible your way. Track progress across all 66 books. Free.` — 72 chars ✓

Candidate 1 leads with the differentiator (self-paced + free/no-ads) since the title
already carries the primary keywords. Candidate 2 is the more keyword-dense fallback
if search impressions underperform — A/B test via Play Console Store Listing
Experiments after launch.

### Full description (4000-char limit) — launch draft (~1,900 chars ✓)

Plain text with unicode bullets (Play renders limited formatting; keep it simple):

```text
Read the whole Bible — your way.

Most Bible reading plans tell you what to read and when. My Bible Log works differently: you simply log what you've already read — from sermons, devotionals, small groups, or personal study — and it all counts toward your progress. No rigid schedules. No guilt if you miss a day.

TRACK YOUR PROGRESS
• See your reading progress through every chapter, every book, and the whole Bible — all 66 books, all 1,189 chapters
• Earn stars as you complete each book
• Get finish-date predictions based on your actual reading pace

SET A DAILY GOAL
• Choose a daily verse goal that fits your life — read a little or a lot
• Watch today's progress bar fill as you log your reading
• About 86 verses a day finishes the whole Bible in a year

LOG READING IN SECONDS
• Mark any chapter read with a single tap on the chapter checklist
• Smart reading suggestions help you decide what to read next
• Works offline — entries sync automatically when you're back online

BUILD A LASTING HABIT
• The reading calendar shows every day you read, with gold stars for days you hit your goal
• Review or edit any past entry
• Insights charts reveal your reading activity, most-read books, and trends over time

TAKE NOTES AS YOU READ
• Capture questions, insights, and reflections tied to any passage
• Organize notes with custom color-coded tags — memory verses, topics, prayers, and more

MADE FOR THE WAY YOU READ
• Works alongside your favorite Bible app — track your reading from any translation
• Light and dark themes
• Available in English, German, Spanish, French, Korean, Portuguese, and Ukrainian
• Sign in with email or Google — your log syncs across your phone and the web at mybiblelog.com

FREE. NO ADS. NO SUBSCRIPTIONS.
My Bible Log is completely free — no ads, no premium tier, no in-app purchases. Just a simple, encouraging way to read the whole Bible at your own pace.
```

Every claim above maps to a shipped screen: Today goal/progress + suggestions
(`app/(tabs)/index.tsx`), books/chapters/whole-Bible progress + stars
(`(tabs)/bible/`), finish-date predictions (`bible/progress.tsx`), checklist
(`(tabs)/checklist.tsx`), calendar (`(tabs)/calendar.tsx`), notes + tags
(`(tabs)/notes/`), insights charts (`settings/insights.tsx`), offline queue
(`src/storage/logEntries.ts` + `src/log-entries/sync.ts`), 7 locales
(`settings/language.tsx`), themes (`settings/appearance.tsx`), email + Google auth
(`app/login.tsx`).

### Category & tags

- **Category:** Books & Reference (where users browse for Bible tools; Lifestyle is
  a weaker fit and more competitive for featuring).
- **Tags (Console):** Bible, Books & Reference-adjacent tags offered by the console
  picker — pick "Bible", "Books", "Personalization"-type tags as available.
- **Ads declaration:** contains no ads. **In-app purchases:** none. Both are
  conversion-positive badges on the listing — make sure they're declared correctly.

---

## 3. Screenshot Plan

Up to 8 phone screenshots. The first 2–3 are visible before scrolling — put the
strongest conversion story there. Google requires ≥2 screenshots (min 320px,
max 3840px); for featuring eligibility provide **≥4 at 1080px+ in 16:9/9:16**.

Capture from the **native app on a release build** (Pixel-class device or emulator,
1080×2400), not the PWA — the existing `web/public/screenshots/<locale>/*.webp` shots
are the web app and show browser-ish chrome/framing. Reuse their *style* (phone frame,
short headline above the shot) for visual continuity with the website.

| # | Screen (route) | Headline verbiage | Why this order |
| --- | --- | --- | --- |
| 1 | Today — goal met state (`(tabs)/index.tsx`) | **Set a daily goal. See today's progress.** | The core loop in one image; show a filled progress bar (positive emotion) |
| 2 | Bible books list (`(tabs)/bible/index.tsx`) | **Watch all 66 books fill in.** | The "whole Bible" promise; shows stars + per-book progress |
| 3 | Checklist (`(tabs)/checklist.tsx`) | **Log a chapter in one tap — all 1,189.** | Effort objection killer; differentiator vs. journal apps |
| 4 | Calendar with gold stars (`(tabs)/calendar.tsx`) | **Build a habit you can see.** | Habit/streak motivation |
| 5 | Notes list with tags (`(tabs)/notes/index.tsx`) | **Capture insights as you read.** | Second use-case (journaling) for note-takers |
| 6 | Insights charts (`settings/insights.tsx`) | **Understand your reading patterns.** | Data-viz eye candy; heatmap reads well as a thumbnail |
| 7 | Progress predictions (`bible/progress.tsx`) | **Know when you'll finish.** | Unique feature; motivational |
| 8 | Today in dark mode or notes offline view | **Works offline. Free. No ads. Ever.** | Trust close; doubles as dark-theme showcase |

Seed a demo account with realistic, wholesome data before capturing: several weeks of
calendar stars, a few completed books (e.g., the Gospels), tagged notes with
substantive content, and a partially-filled daily goal. Avoid empty states and
placeholder text in every shot.

### Other required graphics

| Asset | Spec | Status / notes |
| --- | --- | --- |
| Hi-res icon | 512×512 PNG, no alpha | Produce from the existing icon source (`mobile/assets/images/icon.png` is the in-app icon; export a 512 master) |
| Feature graphic | 1024×500 PNG/JPG | Not in repo. Recommended composition: app icon + wordmark left, tagline **"Read the whole Bible — your way."** right, on the brand background. Shown at the top of the listing and in featuring — keep text minimal and legible at small sizes |
| Promo video | Optional (YouTube URL) | Skip for launch |
| Tablet screenshots | 7"/10" if declaring tablet support | Defer unless declaring large-screen support |

---

## 4. Localized Listings (7 locales at launch)

The store listing text and screenshots should be localized for every locale the app
ships. Translation sources already exist on the web side — reuse the vetted phrasing
rather than re-translating.

| Play locale | App locale | Copy source (adapt, don't copy verbatim) | Screenshot set |
| --- | --- | --- | --- |
| en-US (default) | en | This document (§2) | Capture per §3 |
| de-DE | de | `web/content/de/index.md` | Re-capture with app language = de |
| es-419 + es-ES | es | `web/content/es/index.md` | app language = es |
| fr-FR | fr | `web/content/fr/index.md` | app language = fr |
| ko-KR | ko | `web/content/ko/index.md` | app language = ko |
| pt-BR | pt | `web/content/pt/index.md` | app language = pt |
| uk | uk | `web/content/uk/index.md` | app language = uk |

Localization mechanics:

- **Title:** translate the descriptor, keep the brand: e.g. de `My Bible Log: Lese-Tracker`,
  es `My Bible Log: Plan de lectura` — verify each stays ≤30 chars and check the web
  content files for the phrasing each locale already uses for "reading tracker".
- **Screenshots:** all 8 shots contain UI text, so re-capture each locale by switching
  the app language in Settings → Language on the same seeded account (~30 min per
  locale once the en flow is scripted). Headline overlays come from each locale's
  web content equivalents.
- If launch time is tight, ship en + the 2–3 locales with the most web traffic first
  and add the rest in the first update — but text-only localization (without localized
  screenshots) is still better than nothing and takes minutes per locale.

---

## 5. Technical Release Track

Condensed, corrected sequence. Items marked *(Console)* happen in Play Console.

### A. Pre-build (in repo)

1. **Rename**: `app.json` `name` → `"My Bible Log"` (§1).
2. **Permission audit**: run `npx expo prebuild` and inspect the generated
   `AndroidManifest.xml`. Expect `INTERNET` + `VIBRATE`; use `android.blockedPermissions`
   in `app.json` to strip `SYSTEM_ALERT_WINDOW` and legacy storage permissions if they
   appear in the release manifest. Confirm `usesCleartextTraffic` is debug-only.
3. **Production secrets** (EAS secrets, not `.env`): `EXPO_PUBLIC_API_BASE_URL`
   (production API), `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_SENTRY_DSN`
   (+ `SENTRY_ORG`/`SENTRY_PROJECT` for source maps). `src/config.ts` hard-fails
   without the first two — good.
4. **Force-upgrade endpoint**: confirm the production API's `/mobile-app/support`
   returns a real `minimumSupported` and the final Play `storeUrl`
   (`https://play.google.com/store/apps/details?id=com.mybiblelog.app`). The
   standalone `app/upgrade-required.tsx` route currently hardcodes `storeUrl: null` — fix
   or confirm it's only rendered via `UpgradeGate` with live data.

### B. Build, sign, submit

5. `eas build --profile production --platform android` — verify it produces an
   **`.aab`** (production profile has no `buildType` override, so app-bundle is the
   default) and that EAS remote `versionCode` auto-increments.
6. **Play App Signing** *(Console)*: enroll on first upload; let EAS manage the upload
   keystore.
7. **Google Sign-In prod SHA-1**: after the first build, register the app-signing
   certificate's SHA-1 (from Play Console → App integrity) with the Android OAuth
   client in Google Cloud Console. Without this, Google Sign-In silently fails in
   production — test it on the internal track before rollout.
8. **`eas submit` credentials**: create a Play service-account JSON key and fill
   `eas.json` → `submit.production`; or upload the first `.aab` manually (a manual
   first upload is required before API submissions work anyway).

### C. Console declarations *(Console)*

9. **App access**: the app requires sign-in — provide working demo credentials for
   Google's review team (a dedicated reviewer account on the production API).
10. **Data Safety form**: declare — email address (account), user-generated content
    (reading log entries, notes/tags) stored on your own API; crash diagnostics via
    Sentry; all encrypted in transit; no data sold/shared for advertising; account
    and data deletable in-app **and** via a public web URL (declare the web account
    page at mybiblelog.com — required alongside the in-app flow).
11. **Content rating (IARC)** questionnaire → expect Everyone.
12. **Target audience**: 13+ (avoid the under-13 designation and its added
    obligations). **Ads**: none. **Privacy policy URL**: §1.
13. **Store listing**: title, descriptions, graphics, screenshots per §2–§4;
    category Books & Reference; support email.

### D. Rollout

14. **Internal testing track** first: validate Google Sign-In (prod SHA-1!), email
    login, deep-link OAuth return (`biblelog` scheme), offline sync, dark/light
    themes, all 7 languages, and the About-screen links on physical devices.
15. Review the **pre-launch report** for crashes/accessibility flags.
16. **Note for personal developer accounts** created after Nov 2023: Google requires
    a closed test with ≥12 testers for 14 continuous days before production access.
    Organization accounts are exempt. Budget this into the timeline — it's the
    single longest lead-time item if it applies.
17. **Production rollout**: staged (start 20%, ramp to 100% watching Sentry + Play
    vitals).
18. Post-launch: point `biblelog.app` CTA at the listing, add the Play badge to
    `mybiblelog.com`, and start a Store Listing Experiment on the short description
    (§2 candidates 1 vs 2).

---

## 6. Launch Checklist (condensed order of operations)

- [ ] Rename app to "My Bible Log" in `app.json`
- [ ] Permission audit via prebuild; add `blockedPermissions` if needed
- [ ] Set production EAS secrets (API URL, Google web client ID, Sentry DSN)
- [ ] Production `.aab` build via EAS; confirm versionCode auto-increment
- [ ] Create Play app (`com.mybiblelog.app`), enroll Play App Signing
- [ ] Register prod SHA-1 with Google OAuth client; verify Google Sign-In on internal track
- [ ] Complete Console declarations: App access (demo creds), Data Safety, IARC, target audience, ads=none, privacy URL
- [ ] Produce assets: 512 icon, 1024×500 feature graphic, 8 en screenshots (seeded demo account)
- [ ] Enter en listing: title "My Bible Log: Reading Tracker", short + full description (§2)
- [ ] Localize listings + screenshots for de/es/fr/ko/pt/uk (§4)
- [ ] Internal testing pass (auth, offline, themes, locales, links)
- [ ] Closed test (12 testers × 14 days) **if** personal dev account
- [ ] Fix/verify force-upgrade `storeUrl` against the live listing URL
- [ ] Staged production rollout; monitor Sentry + Play vitals
- [ ] Update `biblelog.app` and `mybiblelog.com` with Play Store links/badges
- [ ] Post-launch: short-description A/B experiment
