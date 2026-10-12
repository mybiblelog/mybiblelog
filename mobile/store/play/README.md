# Play Store listing

The source of truth for the app's Google Play listing copy, in every language the
app ships. Screenshots are **not** here: they are generated locally into
`mobile/screenshots/<app-locale>/` (gitignored) by `npm run screenshots:mobile`
from the repo root, and read from there at publish time.

## Editing the copy

`listings/<play-locale>/` holds one file per Play field:

| File | Play field | Limit |
| --- | --- | --- |
| `title.txt` | Title | 30 chars |
| `short-description.txt` | Short description | 80 chars |
| `full-description.txt` | Full description | 4000 chars |

Plain text only — Play renders no markup, so the full description uses `•`
bullets and blank lines. Trailing whitespace is stripped on publish.

`config.json` holds everything the tooling needs: the package name, the Play
locales and which app locale supplies their screenshots, and the ordered list of
screenshot slugs to upload (Play displays them in upload order).

## Listing strategy

Google Play has no keyword field; indexing weight is roughly title (30) > short
description (80) > full description (4000), plus engagement signals. Each keyword
only needs to appear once or twice — stuffing is penalized.

- The title "My Bible Log: Reading Tracker" is built so it indexes the full phrase
  "bible reading tracker". Other targets (bible reading plan, bible progress, bible
  in a year, bible journal, bible notes) live in the short and full descriptions,
  along with the differentiators: free, no ads, no subscriptions, at your own pace,
  offline.
- We deliberately do **not** target "bible app" / "bible study app". Those head terms
  are dominated by YouVersion-class apps, and they attract users expecting Bible
  *text*, which hurts ratings. The copy says the app works *alongside* your favorite
  Bible app to set that expectation.
- Every claim in the copy must map to a shipped screen. Re-check this when editing.
- Category is Books & Reference. An untried idea: a Store Listing Experiment in Play
  Console comparing a self-paced/free short description against a keyword-dense one
  ("Free Bible reading tracker. Set daily goals, log chapters, and take notes.").
- Domains: `mybiblelog.com` is the product (PWA, account, policies) and supplies every
  listing URL, so brand and privacy-policy domains match. `biblelog.app` is a
  lightweight promo page whose main CTA is the Play badge.

## Graphics (phone screenshots + feature graphic)

With `"screenshots": { "composed": true }` in `config.json`, Play gets designed
images rather than the raw app captures. Each image is an HTML slide: a
background, one or more captures placed and rotated, and localized text.
`npm run play:graphics` renders the slides with headless Chromium into
`mobile/screenshots/play/<play-locale>/`, and that folder is what gets
published.

- `graphics/layout.json`: the visual design only. Each slide has an `id`, a `kind`
  (`phone`, uploaded in layout order, 2–8 of them; or the single `feature`
  graphic, 1024×500), a pixel `size`, a `background` (`color`, an optional CSS
  `gradient`, an optional `pattern` of `dots`/`diagonal`/`grid`), plus `shapes`,
  `images` and `texts`. Images and shapes are positioned by their centre (`x`,
  `y`) with an optional `rotate`, `rotateX`/`rotateY`, `frame` (a CSS phone bezel)
  and `shadow`. An image's `src` is a capture slug from
  `mobile/screenshots/<app-locale>/`; `asset` takes a repo-relative image path
  instead. A text box is positioned by its top-left and wraps within `width`.
  Give it a `height` and the font shrinks until the text fits.
- `listings/<play-locale>/graphics.json`: the copy, a flat map of the `key`s that
  `layout.json` uses. English must cover every key. Any other locale falls back
  to English for a missing key, with a warning. The non-English headlines come
  from the web homepage (`web/content/<locale>/index.md`).

```sh
cd mobile
npm run play:graphics -- --serve                 # live preview: edit the JSON, reload
npm run play:graphics                            # render every locale
npm run play:graphics -- --locales de-DE --slides 04-calendar
```

Render after every `npm run screenshots:mobile`. The fonts load from Google
Fonts, so rendering needs a network connection.

## Publishing

```sh
cd mobile
npm run play:validate       # offline: field limits, missing files, screenshot specs
npm run play:listing:diff   # what would change against the live listing
npm run play:listing:push   # apply text + screenshots to every configured locale
```

Both publishing commands take flags after `--`, e.g.
`npm run play:listing:push -- --locales en-US --text-only`. See the header of
`mobile/scripts/play/push.mjs` for the full list.

A push opens one Play edit, applies every locale, then commits it, so the listing
never goes live half-updated. Play reviews listing changes before they appear.

### Credentials

The scripts need a Play Console service account with *Edit store listing, pricing
& distribution* on this app. Create the key in Google Cloud Console, invite the
service account in Play Console → Users and permissions, then point the scripts
at it:

```sh
# mobile/.env (gitignored; the npm scripts read it)
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=./play-service-account.json
```

The variable also accepts the JSON itself, for CI secrets that cannot hold a
file. Never commit the key — `play-service-account*.json` is gitignored.

The API only accepts edits once the app exists in Play Console with at least one
uploaded build, so the first release still has to be uploaded by hand.

## Adding a locale

1. Add an entry to `config.json` → `locales` with its Play code and the `app`
   locale whose screenshots it should use (or `aliasOf` another Play locale to
   share one set of files, as `es-ES` does with `es-419`).
2. Create `listings/<play-locale>/` with the three text files.
3. `npm run play:validate`.
