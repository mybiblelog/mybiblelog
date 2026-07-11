# My Bible Log

My Bible Log is a free, open source web app for tracking personal Bible reading.

This is the code that runs the live [mybiblelog.com](https://www.mybiblelog.com/) web app.

## Quick start

```bash
# use the correct NPM version, if applicable
# this is specified in package.json under "engines"
$ nvm use 24.2.0

# install root project dependencies
$ npm install

# install nuxt and express (/api) project dependencies
$ npm run heroku-prebuild

# make sure MongoDB is running
# docker-compose.yml is one option
$ docker compose up

# ensure env vars are set: see docs/web-api.md for the full .env example
# both /web and /api projects check for the .env in this root directory
$ touch .env

# serve both with hot reload
# web project served at localhost:3000
# express api project served at localhost:8080
# web project proxies /api/* requests to express api
$ npm run dev
```

See [Web & API Development](docs/web-api.md) for the full setup, environment variables, debugging, testing, and deployment details.

## Documentation

Full documentation lives in [`docs/`](docs/README.md):

- **[Web & API Development](docs/web-api.md)** — setup, environment variables, debugging, testing, scripts, deployment
- **[Google OAuth2](docs/oauth.md)** — Google sign-in for web and mobile
- **[Internationalization](docs/i18n/overview.md)** — i18n behavior, [Crowdin workflow](docs/i18n/crowdin.md), and [adding a locale](docs/i18n/adding-a-locale.md)
- **[Bible Integrations](docs/bible-integrations.md)** — adding a Bible translation or reading app
- **[Mobile App](docs/mobile.md)** — Expo / React Native app (docs under [`mobile/`](mobile/README.md))

See also [Contributing](CONTRIBUTING.md), the [Security Policy](SECURITY.md), and the [end-to-end test suite](e2e/README.md).
