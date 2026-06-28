import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage-backed TTL cache.
 *
 * Mirrors the get/set/delete contract of shared `BrowserCache` (which is
 * `sessionStorage`-based and not React Native safe), so the dateVerseCounts
 * store can cache its computed map across launches the way the Nuxt store does.
 * Async (AsyncStorage) rather than synchronous.
 */

type CacheEnvelope<T> = { value: T; expiresAt: number };

const PREFIX = "cache.";

export async function setCache<T>(key: string, value: T, expirationInMinutes: number): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = {
      value,
      expiresAt: Date.now() + expirationInMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(envelope));
  } catch {
    // ignore cache write failures
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<T> | null;
    if (!envelope || typeof envelope.expiresAt !== "number") return null;
    if (Date.now() > envelope.expiresAt) {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }
    return envelope.value;
  } catch {
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // ignore
  }
}
