/**
 * Public website + legal links.
 *
 * The marketing site and legal documents are hosted by the Nuxt web app at
 * mybiblelog.com (the policy pages live at `/policy/:slug` — see
 * `nuxt/pages/policy/_slug.vue`). These are stable public URLs, so we keep them
 * as constants here rather than deriving them from the API base URL (which may
 * point at a separate API host or a localhost dev server).
 */
export const WEBSITE_BASE_URL = 'https://www.mybiblelog.com';

export const PRIVACY_POLICY_URL = `${WEBSITE_BASE_URL}/policy/privacy`;
export const TERMS_URL = `${WEBSITE_BASE_URL}/policy/terms`;
