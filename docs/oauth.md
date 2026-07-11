# Google OAuth2

My Bible Log lets users sign in with a Google account. This applies to both the web app (redirect flow) and the mobile app (native id_token exchange).

## Web: Connecting to Google OAuth2

To allow users to sign in with their existing Google accounts you will need to follow several steps:

- Set up an OAuth2 client with the Google credentials manager: `https://console.developers.google.com/apis/credentials/oauthclient/`
- Ensure all relevant hosts are set as allowed Google redirect URLs:
  - `http://localhost:3000/google-login`
  - `https://THISAPP.herokuapp.com/google-login`
  - `https://www.THISAPP.com/google-login`
- Get the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables from Google
- Set up those variables in a `.env` file to run the project locally
- Set up those variables in Heroku to deploy the project

## Environment variables

These are the Google-related entries from the root `.env` (see [Web & API Development](web-api.md#environment-variables) for the full file):

```bash
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxx
GOOGLE_REDIRECT=http://xxxxxxxxxx:xxxx/google-login
# Comma-separated extra Google client IDs accepted as the audience of a
# native-mobile id_token (iOS / Android / web). GOOGLE_CLIENT_ID is always allowed.
GOOGLE_ALLOWED_CLIENT_IDS=xxxxxxxxxx-ios.apps.googleusercontent.com,xxxxxxxxxx-web.apps.googleusercontent.com
```

`GOOGLE_ALLOWED_CLIENT_IDS` exists specifically for the mobile flow below — the API accepts a native `id_token` only if its audience is one of these client IDs (`GOOGLE_CLIENT_ID` is always allowed).

## Mobile: native Google Sign-In

The mobile app uses **native Google Sign-In** ([`react-native-nitro-google-signin`](https://github.com/react-native-nitro-google-sign-in/google-signin)) to obtain a Google `id_token`, then exchanges it for a session:

- `POST /api/auth/oauth2/google/id-token` — body `{ idToken, locale? }`, returns `{ token, user }`

The `id_token`'s audience is the **web** client ID (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` on the mobile side), so the API must list that ID in its `GOOGLE_ALLOWED_CLIENT_IDS`. This works in all mobile development phases; it does **not** work in Expo Go or in web mode.

For the mobile OAuth client IDs and Android SHA-1 signing setup, see [`mobile/docs/android-dev-build.md`](../mobile/docs/android-dev-build.md) and the Google Sign-In section of [`mobile/README.md`](../mobile/README.md).
