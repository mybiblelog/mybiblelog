# Tech Debt Register

Workarounds and deferred follow-ups that should be undone later, kept in one place so they can be reviewed without searching the repo for them.

**Last reviewed:** 2026-10-30

## What goes here

An entry belongs here when there is a concrete thing to undo or finish later:

- A workaround for a bug or gap in a dependency, waiting on an upstream fix (an override, a pin, a config flag, a shim).
- A follow-up that was deliberately deferred (for example, a compatibility flag kept on until call sites are migrated).

Permanent design decisions and constraints don't belong here, even when they're unusual. Document those next to the code.

## Conventions

- **ID:** each entry has a stable kebab-case ID, used as its heading.
- **Code marker:** every code site carries a `TECH-DEBT(<id>)` comment next to the workaround, so `git grep -n "TECH-DEBT("` lists every site. JSON files (`package.json`) can't hold comments, so for those the entry's **Where** field is the only record.
- **Fields:**
  - **Where:** the file(s) involved.
  - **Why:** the problem being worked around.
  - **Remove when:** the condition that ends the debt.
  - **Check:** a quick way to tell whether that condition is met.
  - **Tracking:** an upstream issue or PR, if one exists.
  - **Added:** when the entry was added.
- **Resolving:** remove the workaround, its `TECH-DEBT` markers and its entry in the same change. Git history keeps the record.

## Reviewing

1. For each entry, run its **Check** (usually `npm outdated` / `npm view <pkg>` plus the linked issue).
2. When a fix has shipped, upgrade, remove the workaround, and run the affected tests (the full e2e suite for anything web/SSR).
3. Update **Last reviewed** above.

---

## Waiting on upstream

### vue-i18n-ssr-devtools-leak

- **Where:** `web/app/plugins/devtools-ssr-leak.server.ts`
- **Why:** In dev, vue-i18n registers its devtools plugin on every SSR request's app. It uses `@vue/devtools-api` v6, which queues the registration on `globalThis.__VUE_DEVTOOLS_PLUGINS__` when no devtools hook exists (never, on the server), so each rendered app is kept forever. The Nitro dev worker runs out of heap after about 1,000 renders, and the late e2e specs fail with 500s or `ERR_CONNECTION_REFUSED`. Production is unaffected.
- **Remove when:** vue-i18n skips devtools setup during SSR, or moves to `@vue/devtools-api` v7+.
- **Check:** `npm ls @vue/devtools-api` (is vue-i18n still on 6.x?), then delete the plugin and run the full e2e suite. It should pass without the dev server's memory climbing.
- **Tracking:** none filed yet.
- **Added:** 2026-10-30

### nuxt-i18n-nitro-auto-imports

- **Where:** `web/nuxt.config.ts` (`experimental.nitroAutoImports: true`)
- **Why:** `compatibilityVersion: 5` turns Nitro auto-imports off, and since Nuxt 4.6.2 that also removes them from `#imports` in the server bundle. `@nuxtjs/i18n`'s server runtime still imports `useRuntimeConfig` from `#imports`, so without the flag the web build fails with `"useRuntimeConfig" is not exported by "virtual:#imports"`.
- **Remove when:** `@nuxtjs/i18n` imports from `nitropack/runtime` instead.
- **Check:** `npm view @nuxtjs/i18n version` against the linked issue, then remove the flag and run `npm run build -w web`.
- **Tracking:** [nuxt-modules/i18n#4175](https://github.com/nuxt-modules/i18n/issues/4175)
- **Added:** 2026-10-30

### vite-pwa-dev-sw-route-markers

- **Where:** `web/nuxt.config.ts` (`hooks['vite:serverCreated']`)
- **Why:** `@vite-pwa/nuxt` registers its dev-server route markers only when `vite:serverCreated` fires with `isServer: false`. Under `experimental.viteEnvironmentApi` (the default at `compatibilityVersion: 5`) the hook fires once with `isServer: true`, so `nuxt dev` serves no service worker. The hook re-adds the markers.
- **Remove when:** `@vite-pwa/nuxt` drops or relaxes its `if (isServer) return` guard.
- **Check:** `npm view @vite-pwa/nuxt version`, then remove the hook and confirm `/dev-sw.js?dev-sw` still registers in `nuxt dev`.
- **Tracking:** none filed yet.
- **Added:** 2026-10-30

### jest-expo-jest-preset-override

- **Where:** `mobile/package.json` (`overrides["@react-native/jest-preset"]`)
- **Why:** `jest-expo@57` peer-depends on `@react-native/jest-preset@^0.85.0`, while React Native 0.86 needs `0.86.0`.
- **Remove when:** a `jest-expo` release widens its peer range to cover the app's React Native version.
- **Check:** `npm view jest-expo@57 peerDependencies` (or the next SDK's `jest-expo`).
- **Tracking:** none.
- **Added:** 2026-07-02

### mobile-eslint-9

- **Where:** `mobile/package.json` (`eslint ^9`)
- **Why:** `eslint-config-expo` depends on `eslint-plugin-react@7.37`, which caps its peer range at ESLint 9 and calls `context.getFilename()`, which ESLint 10 removed.
- **Remove when:** `eslint-plugin-react` (via `eslint-config-expo`) supports ESLint 10.
- **Check:** `npm view eslint-plugin-react peerDependencies.eslint`
- **Tracking:** none.
- **Added:** 2026-07

### typescript-estree-minimatch-override

- **Where:** root `package.json` (`overrides["@typescript-eslint/typescript-estree"].minimatch`)
- **Why:** The root ESLint 8 setup uses `@typescript-eslint` v6, whose `typescript-estree` pins `minimatch@9.0.3`. The override forces `^9.0.7`. The reason wasn't recorded; it's presumably a security patch.
- **Remove when:** the root moves to a `@typescript-eslint` major that depends on a patched `minimatch`.
- **Check:** `npm ls minimatch` after removing the override, then `npm audit`.
- **Tracking:** none.
- **Added:** 2026-10-30

### reanimated-flatlist-exiting

- **Where:** `mobile/src/components/organisms/AnimatedList.tsx`
- **Why:** On the New Architecture, Reanimated `exiting` animations inside a FlatList often never finish, leaving a permanent gap, so removed rows disappear instantly instead of animating out.
- **Remove when:** the linked Reanimated issues are fixed; then restore an `exiting` animation on cells.
- **Check:** issue status, then try an `exiting` animation on delete on an Android device.
- **Tracking:** [software-mansion/react-native-reanimated#5656](https://github.com/software-mansion/react-native-reanimated/issues/5656), [#8665](https://github.com/software-mansion/react-native-reanimated/issues/8665)
- **Added:** 2026-07

## Internal follow-ups

None currently.
