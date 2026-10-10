/**
 * Detects a unique-constraint violation from either backend: a MongoDB
 * duplicate-key error (code 11000) or a SQLite UNIQUE constraint failure
 * (extended result code 2067, SQLITE_CONSTRAINT_UNIQUE).
 *
 * Uniqueness is enforced primarily by explicit checks in the repositories, but
 * the unique indexes remain an authoritative backstop against the rare
 * read-then-write race. This guard lets repositories turn that residual race
 * into a clean `ValidationError` instead of a 500.
 */
type DuplicateKeyError = {
  code?: number | string;
  errcode?: number;
  cause?: DuplicateKeyError;
};

const MONGO_DUPLICATE_KEY = 11000;
const SQLITE_CONSTRAINT_UNIQUE = 2067;

const isDuplicate = (candidate: DuplicateKeyError | null | undefined): boolean =>
  candidate?.code === MONGO_DUPLICATE_KEY || candidate?.errcode === SQLITE_CONSTRAINT_UNIQUE;

export const isDuplicateKeyError = (err: unknown): boolean => {
  const candidate = err as DuplicateKeyError | null;
  return isDuplicate(candidate) || isDuplicate(candidate?.cause);
};
