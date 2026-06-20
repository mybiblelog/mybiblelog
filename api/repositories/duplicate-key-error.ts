/**
 * Detects a MongoDB duplicate-key error (code 11000).
 *
 * Uniqueness is enforced primarily by explicit checks in the repositories, but
 * the unique indexes remain as an authoritative backstop against the rare
 * read-then-write race. This guard lets repositories turn that residual race
 * into a clean `ValidationError` instead of a 500.
 */
type DuplicateKeyError = {
  code?: number;
  cause?: { code?: number };
};

export const isDuplicateKeyError = (err: unknown): boolean => {
  const candidate = err as DuplicateKeyError | null;
  return candidate?.code === 11000 || candidate?.cause?.code === 11000;
};
