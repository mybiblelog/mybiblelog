# Contributing to My Bible Log

Thank you for your interest in contributing to My Bible Log! This project is a monorepo for tracking personal Bible reading, with a Nuxt web app (`web/`), an Express API (`api/`), shared TypeScript utilities (`shared/`), an Expo/React Native mobile app (`mobile/`), and a Playwright end-to-end suite (`e2e/`). We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Internationalization](#internationalization)
- [Mobile](#mobile)
- [Security](#security)
- [Questions?](#questions)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [mybiblelog.com@gmail.com](mailto:mybiblelog.com@gmail.com).

## Getting Started

See the [Web & API Development](docs/web-api.md) guide for instructions on setting up the `web` and `api` projects and running a development server.

For the mobile app, see [Mobile](#mobile) below.

## Testing

There is comprehensive testing in place for the API (`/api`), core utility files (`/shared`), the frontend (`/web`), the mobile app (`/mobile`), and end-to-end UI flows (`/e2e`).
Please ensure all relevant tests pass before submitting a pull request.

### API, Shared, and Web Tests (Vitest)

All tests should consistently pass when run in isolation or serially.

See the **Testing** section of the [README](./README.md) for the Jest and Playwright commands.

See [`e2e/README.md`](e2e/README.md) for required `.env` vars and running against a deployed app.

### Test Requirements

- All new features should include appropriate tests
- Bug fixes should include tests that verify the fix
- API endpoints should have corresponding Vitest tests
- Ideally, UI changes should have corresponding Playwright tests

## Code Style

We use ESLint for code quality and consistency in `api/`, `web/`, and `shared/`:

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

`mobile/` has its own ESLint config and is excluded from the root lint run — see [Mobile](#mobile).

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**

   - Write clean, well-tested code
   - Update documentation if needed
   - Add tests for new functionality

3. **Test your changes**

   ```bash
   npm run test # shared and web projects
   npm run test:api
   npm run test:e2e
   npm run lint
   ```

   If your change touches `mobile/`, also run its tests and lint from within that directory (see [Mobile](#mobile)).

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve issue with description"
   ```

5. **Push and create a Pull Request**

   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Guidelines

- Provide a clear description of what the PR does
- Reference any related issues
- Ensure all tests pass
- Request review from maintainers
- Be responsive to feedback

## Issue Reporting

Before creating an issue, please check if it already exists.

Use one of the existing templates to structure your issue:

- [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- [question template](.github/ISSUE_TEMPLATE/question.md)

## Internationalization

My Bible Log supports multiple languages.

Refer to [Adding a Locale](docs/i18n/adding-a-locale.md) for a checklist of how to add a new locale in the repository.

We use [Crowdin](https://crowdin.com/) to collaborate on translation work — see the [Crowdin workflow](docs/i18n/crowdin.md).

## Mobile

The mobile app is a separate Expo/React Native project under `mobile/`, with its own `package.json`, lint config, and test suite (not part of the root npm workspaces).

See the [Mobile App guide](docs/mobile.md) for development phases (emulator → device → preview build → production), environment setup, and a full command reference.

## Security

**DO NOT** create public GitHub issues for security vulnerabilities. See the [Security Policy](SECURITY.md) for how to report one.

## Questions?

- **General questions**: Use the [question template](.github/ISSUE_TEMPLATE/question.md)
- **Security concerns**: Email [mybiblelog.com@gmail.com](mailto:mybiblelog.com@gmail.com)
- **Code of Conduct violations**: Contact [mybiblelog.com@gmail.com](mailto:mybiblelog.com@gmail.com)

## License

By contributing to My Bible Log, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to My Bible Log! 🙏
