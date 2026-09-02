// Thin client over the Google Play Developer API v3 (androidpublisher).
//
// google-auth-library handles the service-account JWT and token refresh; the
// endpoints themselves are plain REST, so they are called with fetch rather
// than pulling in the full googleapis client for six routes.
//
// Every listing change goes through an "edit": insert one, apply changes to it,
// validate, then commit. An uncommitted edit is invisible in Play Console and
// expires on its own, which is what makes --dry-run safe.

import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";
const UPLOAD = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3";

/**
 * Service-account credentials from an explicit path, or from
 * GOOGLE_PLAY_SERVICE_ACCOUNT_KEY (a path to the JSON key, or the JSON itself
 * for CI secrets that cannot hold a file).
 */
export function loadCredentials(keyPath) {
  const raw = keyPath ?? process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "No Play service-account key. Set GOOGLE_PLAY_SERVICE_ACCOUNT_KEY to the key file's path " +
        "(mobile/.env works — it is read by the npm scripts) or pass --key <path>."
    );
  }

  const text = raw.trimStart().startsWith("{") ? raw : readFileSync(raw, "utf8");
  let credentials;
  try {
    credentials = JSON.parse(text);
  } catch (error) {
    throw new Error(`Play service-account key is not valid JSON: ${error.message}`);
  }
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Play service-account key is missing client_email / private_key.");
  }
  return credentials;
}

export function createPlayClient({ packageName, keyPath }) {
  const credentials = loadCredentials(keyPath);
  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [SCOPE],
  });
  const base = `${API}/applications/${packageName}/edits`;

  async function call(url, { method = "GET", body, contentType } = {}) {
    const { token } = await auth.getAccessToken();
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
    });

    const text = await response.text();
    if (!response.ok) throw apiError(response.status, text, packageName);
    return text ? JSON.parse(text) : null;
  }

  const json = (url, method, payload) =>
    call(url, {
      method,
      body: payload === undefined ? undefined : JSON.stringify(payload),
      contentType: payload === undefined ? undefined : "application/json",
    });

  return {
    insertEdit: () => json(base, "POST", {}),
    deleteEdit: (editId) => call(`${base}/${editId}`, { method: "DELETE" }),
    listListings: (editId) => json(`${base}/${editId}/listings`, "GET"),
    updateListing: (editId, language, listing) =>
      json(`${base}/${editId}/listings/${language}`, "PUT", { language, ...listing }),
    deletePhoneScreenshots: (editId, language) =>
      call(`${base}/${editId}/images/${language}/phoneScreenshots`, { method: "DELETE" }),
    uploadPhoneScreenshot: (editId, language, file) =>
      call(
        `${UPLOAD}/applications/${packageName}/edits/${editId}/images/${language}/phoneScreenshots?uploadType=media`,
        { method: "POST", body: readFileSync(file), contentType: "image/png" }
      ),
    validateEdit: (editId) => json(`${base}/${editId}:validate`, "POST", {}),
    commitEdit: (editId) => json(`${base}/${editId}:commit`, "POST", {}),
  };
}

/** Turns the API's JSON error envelope into something actionable at the terminal. */
function apiError(status, text, packageName) {
  let detail = text;
  try {
    detail = JSON.parse(text).error?.message ?? text;
  } catch {
    // Non-JSON body (proxy/HTML error page) — keep it as-is.
  }

  if (status === 404) {
    return new Error(
      `Play API 404 for ${packageName}: ${detail}\n` +
        "  The app must exist in Play Console with at least one uploaded build before the API accepts edits."
    );
  }
  if (status === 401 || status === 403) {
    return new Error(
      `Play API ${status}: ${detail}\n` +
        "  Check that the service account is invited to this Play Console account with the " +
        '"Edit store listing, pricing & distribution" permission for this app.'
    );
  }
  if (status === 409) {
    return new Error(
      `Play API 409: ${detail}\n  Another edit is in progress or this edit expired — re-run to start a fresh one.`
    );
  }
  return new Error(`Play API ${status}: ${detail}`);
}
