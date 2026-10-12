export type TextSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; url: string };

const URL_PATTERN = /https?:\/\/[^\s<>]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"”’]+$/;

/** Trims trailing punctuation (and unbalanced closing brackets) that belongs to the sentence, not the URL. */
function trimUrl(raw: string): string {
  let url = raw;
  for (;;) {
    const trimmed = url.replace(TRAILING_PUNCTUATION, '');
    if (trimmed !== url) {
      url = trimmed;
      continue;
    }
    const last = url.slice(-1);
    const open = { ')': '(', ']': '[', '}': '{' }[last];
    if (open && url.split(last).length > url.split(open).length) {
      url = url.slice(0, -1);
      continue;
    }
    return url;
  }
}

/** Splits plain note text into text and http(s) link segments. */
export function linkifyText(input: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of input.matchAll(URL_PATTERN)) {
    const url = trimUrl(match[0]);
    if (!/^https?:\/\/[^\s/?#]+/i.test(url)) { continue; }
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ type: 'text', text: input.slice(cursor, start) });
    }
    segments.push({ type: 'link', text: url, url });
    cursor = start + url.length;
  }
  if (cursor < input.length) {
    segments.push({ type: 'text', text: input.slice(cursor) });
  }
  return segments;
}
