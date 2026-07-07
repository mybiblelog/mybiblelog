export const parseCookieHeader = (cookieHeader: string): Record<string, string> => {
  // RFC 6265: cookie-string is `cookie-pair *( ";" SP cookie-pair )`
  // We intentionally keep this minimal and boundary-correct.
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) {
      continue;
    }
    const name = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1);
    if (!name) {
      continue;
    }
    // Cookie values are often URL-encoded; decode if possible, otherwise keep raw.
    try {
      out[name] = decodeURIComponent(rawValue);
    }
    catch {
      out[name] = rawValue;
    }
  }
  return out;
};
