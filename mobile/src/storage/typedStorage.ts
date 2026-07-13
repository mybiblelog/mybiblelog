/**
 * Typed wrapper over an async key-value backend (AsyncStorage, or the
 * SecureStore adapter in `secureBackend.ts`).
 *
 * A registry (see `keys.ts`) declares every key once with its value type. The
 * generic accessors then make the compiler reject unknown keys and wrong-typed
 * values. Every value is JSON-encoded — the mobile app is unpublished, so there
 * is no legacy on-device encoding to preserve.
 *
 * This layer is (de)serialization only. Runtime shape validation stays in the
 * owner modules that already do it (`isLocalUserSettings`, the log-entry/note
 * guards, the auth-session shape check) — keeping those guards next to the types
 * they defend, and avoiding an import cycle back into this registry. `get`
 * therefore returns `T | null`, where `null` means "absent or unparseable".
 */

export interface KeyValueBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type StorageKeyDef<T> = { key: string; __type?: T };

export function defineKey<T>(key: string): StorageKeyDef<T> {
  return { key };
}

type KeyType<D> = D extends StorageKeyDef<infer T> ? T : never;

type StorageSchema = Record<string, StorageKeyDef<any>>;

/**
 * Build a typed accessor over an async backend. Reads never throw (a
 * parse/read failure yields `null`); writes are best-effort (failures are
 * swallowed) — the durability contract described in `docs/offline-storage.md`.
 */
export function createTypedStorage<S extends StorageSchema>(backend: KeyValueBackend, schema: S) {
  return {
    async get<K extends keyof S>(name: K): Promise<KeyType<S[K]> | null> {
      try {
        const raw = await backend.getItem(schema[name]!.key);
        if (raw == null) return null;
        return JSON.parse(raw) as KeyType<S[K]>;
      } catch {
        return null;
      }
    },
    async set<K extends keyof S>(name: K, value: KeyType<S[K]>): Promise<void> {
      try {
        await backend.setItem(schema[name]!.key, JSON.stringify(value));
      } catch {
        // best-effort: persistence never crashes the app
      }
    },
    async remove<K extends keyof S>(name: K): Promise<void> {
      try {
        await backend.removeItem(schema[name]!.key);
      } catch {
        // ignore
      }
    },
  };
}
