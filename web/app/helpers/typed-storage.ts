/**
 * Typed wrapper over the synchronous Web Storage APIs (`localStorage` /
 * `sessionStorage`).
 *
 * A registry (see `app-storage.ts`) declares every key once, with its value
 * type and a codec describing how that value is (de)serialized. The generic
 * accessors then make the compiler reject unknown keys and wrong-typed values.
 *
 * Codecs are per-key rather than a single JSON codec on purpose: the web app is
 * published, so existing values already on users' devices must keep loading.
 * Each key preserves its historical encoding (plain string, validated enum,
 * boolean-as-`'true'`); `jsonCodec` is the default for any *new* key.
 */

export type StorageCodec<T> = {
  /** Decode a stored string. Return `null` if it can't be interpreted as `T`. */
  parse: (raw: string) => T | null;
  serialize: (value: T) => string;
};

/**
 * Value is stored verbatim as its own string. Parameterize with a string
 * subtype (e.g. `stringCodec<LocaleCode>()`) when the key holds a narrower
 * union; the stored value is cast without runtime validation, matching how
 * these keys were read before.
 */
export function stringCodec<T extends string = string>(): StorageCodec<T> {
  return {
    parse: raw => raw as T,
    serialize: value => value,
  };
}

/**
 * String union validated against an allow-list object (e.g. `BibleApps`). Any
 * value not present in the object reads back as `null`.
 */
export function enumCodec<T extends string>(allowed: Record<string, unknown>): StorageCodec<T> {
  return {
    parse: raw => (allowed[raw] !== undefined ? (raw as T) : null),
    serialize: value => value,
  };
}

/** Boolean stored as the literal `'true'` (any other/absent value is `false`). */
export const boolFlagCodec: StorageCodec<boolean> = {
  parse: raw => raw === 'true',
  serialize: value => (value ? 'true' : ''),
};

/** JSON-encoded value with an optional runtime guard. The default for new keys. */
export function jsonCodec<T>(guard?: (value: unknown) => value is T): StorageCodec<T> {
  return {
    parse: (raw) => {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (guard && !guard(parsed)) { return null; }
        return parsed as T;
      }
      catch { return null; }
    },
    serialize: value => JSON.stringify(value),
  };
}

export type StorageKeyDef<T> = { key: string; codec: StorageCodec<T> };

export function defineKey<T>(key: string, codec: StorageCodec<T>): StorageKeyDef<T> {
  return { key, codec };
}

type KeyType<D> = D extends StorageKeyDef<infer T> ? T : never;

// `StorageKeyDef<any>` (not `<unknown>`) in the constraint: `StorageCodec` is
// invariant in `T` (it appears in both `parse`'s return and `serialize`'s
// parameter), so any concrete bound rejects the registry's real entries. `any`
// only relaxes the *constraint*; each entry keeps its precise type via `KeyType`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebStorageSchema = Record<string, StorageKeyDef<any>>;

/**
 * Build a typed accessor over a Web Storage backend.
 *
 * `backend` is a thunk so the client-only guard lives here once: it returns the
 * `Storage` object on the client and `null` during SSR, where `get` yields
 * `null` and `set`/`remove` are no-ops. Call sites no longer need their own
 * `import.meta.client` checks.
 */
export function createWebStorage<S extends WebStorageSchema>(
  backend: () => Storage | null,
  schema: S,
) {
  return {
    get<K extends keyof S>(name: K): KeyType<S[K]> | null {
      const store = backend();
      if (!store) { return null; }
      const def = schema[name]!;
      const raw = store.getItem(def.key);
      if (raw === null) { return null; }
      return def.codec.parse(raw) as KeyType<S[K]> | null;
    },
    set<K extends keyof S>(name: K, value: KeyType<S[K]>): void {
      const store = backend();
      if (!store) { return; }
      const def = schema[name]!;
      store.setItem(def.key, def.codec.serialize(value));
    },
    remove<K extends keyof S>(name: K): void {
      backend()?.removeItem(schema[name]!.key);
    },
  };
}
