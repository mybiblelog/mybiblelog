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

> The non-English copy was adapted from the vetted marketing text in
> `web/content/<locale>/index.md`. It should get a native-speaker pass before the
> first publish in that locale; until then, publish English only with
> `--locales en-US`.

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
