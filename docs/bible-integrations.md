# Bible Integrations

How to add support for a new Bible **translation** or a new Bible **reading app / website**. Both are configured in [`shared/bible/apps.ts`](../shared/bible/apps.ts).

> **Note:** After any change under `shared/`, run `npm run heroku-prebuild` before `npm run dev` to see your changes — this rebuilds the `shared` project and reinstalls it as a dependency in the `api` and `web` projects.

## Adding support for a new Bible translation

1. Define the translation in [`shared/bible/apps.ts`](../shared/bible/apps.ts) by adding it to the `BibleVersions` constant.
1. Also in [`shared/bible/apps.ts`](../shared/bible/apps.ts): for each of the supported apps, there is a `BibleVersionsType` constant containing that app's internal code/tag/label for that translation. Find and add the code for the translation in each app. (TypeScript will raise an error to highlight where these updates are needed.)
1. In [`web/app/pages/settings/reading.vue`](../web/app/pages/settings/reading.vue) and [`web/app/components/forms/settings/PreferredBibleVersionForm.vue`](../web/app/components/forms/settings/PreferredBibleVersionForm.vue), add the display name of the translation to the `bibleVersionNames` constant in both files.

## Adding support for a new Bible reading app or website

1. Define the app in [`shared/bible/apps.ts`](../shared/bible/apps.ts) by adding it to the `BibleApps` constant.
1. Also in [`shared/bible/apps.ts`](../shared/bible/apps.ts): define a new function like `get{NewAppName}ReadingURL` that accepts a Bible version, book index, and chapter index, and returns a URL to directly open that chapter in the app.
1. Also in [`shared/bible/apps.ts`](../shared/bible/apps.ts): update the `getAppReadingUrl` function to use your new function to generate the external reading URL for the app.
1. In the [`web/app/pages/settings/reading.vue`](../web/app/pages/settings/reading.vue) file, add the display name of the app to the `bibleAppNames` constant.
