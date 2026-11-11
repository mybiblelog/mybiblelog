# Contributing to My Bible Log

My Bible Log is a monorepo: a Nuxt web app (`web/`), an Express API (`api/`), shared TypeScript utilities (`shared/`), an Expo/React Native mobile app (`mobile/`), and a Playwright end-to-end suite (`e2e/`).

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

- Web and API: [Web & API Development](docs/web-api.md)
- Mobile: [Mobile App guide](docs/mobile.md). `mobile/` is a separate project with its own `package.json`, lint config, and tests; it is not a root npm workspace.

## Workflow

1. Branch off `main` with a short kebab-case name (`fix-change-email-e2e-tests`).
2. Make the change, with tests for new behavior and bug fixes.
3. Run the checks below for the areas you touched.
4. Open a pull request into `main`. Describe the outcome in a sentence or two, then list notable changes as bullets. Link an issue with `Fixes #123` if there is one.

Commit messages are a plain sentence saying what changed and why (`Fix change-email e2e tests`).

## Checks

| Area | Command |
| --- | --- |
| Lint (`api/`, `web/`, `shared/`) | `npm run lint` |
| Web CSS lint | `npm run -w web lint:css` |
| Shared and web unit tests | `npm run test` |
| API tests | `npm run test:api` |
| End-to-end tests | `npm run test:e2e` (see [`e2e/README.md`](e2e/README.md) for required `.env` vars) |
| Mobile | `npm run lint`, `npm run typecheck`, and `npm test` from `mobile/` |

CI runs the web lint and unit tests on pull requests that touch `web/` or `shared/`, and the mobile checks on pull requests that touch `mobile/` or `shared/`.

## Internationalization

- [Adding a Locale](docs/i18n/adding-a-locale.md)
- [Crowdin workflow](docs/i18n/crowdin.md) for translation work

## Issues and security

- Bugs, feature requests, and questions: open a GitHub issue.
- Security vulnerabilities: do not open a public issue. Follow the [Security Policy](SECURITY.md).

## License

Contributions are licensed under the [MIT License](LICENSE).
