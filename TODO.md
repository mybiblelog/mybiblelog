# TODO

## Remove the `nitroAutoImports` workaround once @nuxtjs/i18n is fixed

Nuxt 4.6 broke the web build: `@nuxtjs/i18n` fails with `"useRuntimeConfig" is not exported by "virtual:#imports"`. This is a known upstream bug ([nuxt-modules/i18n#4175](https://github.com/nuxt-modules/i18n/issues/4175)).

The cause: `compatibilityVersion: 5` turns Nitro auto-imports off, and since Nuxt 4.6.2 that also removes them from `#imports` in the server bundle. The i18n module's server runtime still imports `useRuntimeConfig` from `#imports`.

Workaround: `experimental.nitroAutoImports: true` in `web/nuxt.config.ts`.

When an `@nuxtjs/i18n` release imports from `nitropack/runtime` instead:

1. Upgrade `@nuxtjs/i18n`.
2. Delete `nitroAutoImports: true` and its comment from `web/nuxt.config.ts`.
3. Confirm `npm run build:web` still succeeds.
