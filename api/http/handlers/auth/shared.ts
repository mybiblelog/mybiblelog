/** Narrow an unknown JSON body to an indexable record for inline field guards. */
export const asRecord = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : {};
