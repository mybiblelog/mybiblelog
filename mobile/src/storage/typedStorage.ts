import { reportHandledError } from "@/src/observability/sentry";

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
 * they defend, and avoiding an import cycle back into this registry.
 *
 * `read` distinguishes the three ways a read can come back empty, because
 * collapsing them is how a transient backend failure turns into data loss: a
 * loader that can't tell "nothing stored" from "the keychain threw" hands the
 * store an empty list, and the store persists that empty list over the real
 * bytes. `get` keeps the old `T | null` shape for callers that genuinely don't
 * care. See `docs/offline-storage.md`.
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

export type ReadResult<T> =
  /** Stored and parsed. */
  | { status: "ok"; value: T }
  /** Nothing is stored under this key. */
  | { status: "absent" }
  /** Something is stored but it isn't valid JSON. Unrecoverable; not retryable. */
  | { status: "corrupt" }
  /** The backend itself threw. The real value may still be there — retryable. */
  | { status: "unreadable" };

type KeyType<D> = D extends StorageKeyDef<infer T> ? T : never;

type StorageSchema = Record<string, StorageKeyDef<any>>;

/**
 * Build a typed accessor over an async backend.
 *
 * Failure model:
 * - Reads never throw; `read` reports *why* it came back empty and `get`
 *   collapses every failure to `null`, exactly as before.
 * - A key whose read threw is **quarantined**. `setDerived` — the write of a
 *   value computed from an earlier read of that same key — is refused while a
 *   key is quarantined, so a degraded read can never be laundered into a
 *   durable delete. Plain `set` is unaffected: it replaces the value outright
 *   and doesn't depend on what was there, which is what keeps login working
 *   after a failed boot read.
 * - Quarantine clears on a subsequent successful read (`ok`, `absent` and
 *   `corrupt` all prove the backend works), a successful `remove`, or a
 *   successful authoritative `set` — which has already replaced the bytes the
 *   quarantine existed to protect. It must never be cleared by a *probe*: a
 *   speculative read before a derived write would fetch the real value and then
 *   let the caller's stale-derived value overwrite it — the original bug, a
 *   moment later.
 * - Writes are best-effort and report their outcome; failures never crash.
 */
export function createTypedStorage<S extends StorageSchema>(backend: KeyValueBackend, schema: S) {
  const unreadable = new Set<keyof S>();

  const keyOf = (name: keyof S): string => schema[name]!.key;

  async function read<K extends keyof S>(name: K): Promise<ReadResult<KeyType<S[K]>>> {
    let raw: string | null;
    try {
      raw = await backend.getItem(keyOf(name));
    } catch (err) {
      // Report on the transition only — a wedged backend would otherwise flood
      // telemetry with one event per read for the rest of the session.
      if (!unreadable.has(name)) {
        unreadable.add(name);
        reportHandledError(err, { op: "storage.read", key: keyOf(name) });
      }
      return { status: "unreadable" };
    }

    unreadable.delete(name);
    if (raw == null) return { status: "absent" };
    try {
      return { status: "ok", value: JSON.parse(raw) as KeyType<S[K]> };
    } catch (err) {
      reportHandledError(err, { op: "storage.parse", key: keyOf(name) });
      return { status: "corrupt" };
    }
  }

  async function write<K extends keyof S>(
    name: K,
    value: KeyType<S[K]>,
    authoritative: boolean
  ): Promise<boolean> {
    try {
      await backend.setItem(keyOf(name), JSON.stringify(value));
      // An authoritative write has already replaced whatever was on disk, so
      // there is no longer anything for the quarantine to protect. (Only
      // clearing it *without* writing would be unsafe — see the note above.)
      if (authoritative) unreadable.delete(name);
      return true;
    } catch (err) {
      reportHandledError(err, { op: "storage.write", key: keyOf(name) });
      return false;
    }
  }

  return {
    read,

    /** `null` means absent, unparseable, or unreadable — use `read` to tell them apart. */
    async get<K extends keyof S>(name: K): Promise<KeyType<S[K]> | null> {
      const result = await read(name);
      return result.status === "ok" ? result.value : null;
    },

    /** Replace the stored value. Independent of whatever was there before. */
    set<K extends keyof S>(name: K, value: KeyType<S[K]>): Promise<boolean> {
      return write(name, value, true);
    },

    /**
     * Persist a value derived from an earlier read of this same key. Skipped
     * when that read failed, so the stored bytes survive instead of being
     * overwritten by a value computed from nothing.
     */
    async setDerived<K extends keyof S>(name: K, value: KeyType<S[K]>): Promise<boolean> {
      if (unreadable.has(name)) {
        reportHandledError(new Error("storage_write_refused"), {
          op: "storage.setDerived",
          key: keyOf(name),
        });
        return false;
      }
      return write(name, value, false);
    },

    async remove<K extends keyof S>(name: K): Promise<boolean> {
      try {
        await backend.removeItem(keyOf(name));
        unreadable.delete(name);
        return true;
      } catch (err) {
        // Leave the quarantine in place: a failed delete means the old bytes
        // may still be there, so a derived write still must not clobber them.
        reportHandledError(err, { op: "storage.remove", key: keyOf(name) });
        return false;
      }
    },

    /** True when the last read of this key failed at the backend. */
    isUnreadable<K extends keyof S>(name: K): boolean {
      return unreadable.has(name);
    },

    /** Test-only: these instances are module-scoped singletons (see `keys.ts`). */
    __resetForTest(): void {
      unreadable.clear();
    },
  };
}
