import config from '../../config';
import { UpstreamServiceError } from '../../router/errors/upstream-error';

// Bounded in-memory cache of chapter payloads. Published chapter content is
// immutable, so entries never expire; the oldest entry is evicted (FIFO) once
// the cache is full. Map iteration order makes the first key the oldest.
const CHAPTER_CACHE_MAX_ENTRIES = 200;
const chapterCache = new Map<string, unknown>();

/**
 * Fetches one chapter JSON payload from the HelloAO Bible API.
 * Any network, HTTP, or JSON parsing failure becomes an {@link UpstreamServiceError}.
 */
export const fetchHelloaoChapter = async (
  translationId: string,
  usfm: string,
  chapter: number,
): Promise<unknown> => {
  const cacheKey = `${translationId}/${usfm}/${chapter}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey);
  }

  const url = `${config.helloao.apiBaseUrl}/${encodeURIComponent(translationId)}/${encodeURIComponent(usfm)}/${chapter}.json`;

  let response: Response;
  try {
    response = await fetch(url);
  }
  catch {
    throw new UpstreamServiceError();
  }
  if (!response.ok) {
    throw new UpstreamServiceError();
  }
  let payload: unknown;
  try {
    payload = await response.json();
  }
  catch {
    throw new UpstreamServiceError();
  }

  if (chapterCache.size >= CHAPTER_CACHE_MAX_ENTRIES) {
    const oldestKey = chapterCache.keys().next().value;
    if (oldestKey !== undefined) {
      chapterCache.delete(oldestKey);
    }
  }
  chapterCache.set(cacheKey, payload);

  return payload;
};
