import { parseApiLogEntry, parseApiLogEntries } from './logEntryMapper';

describe('parseApiLogEntry', () => {
  const base = { date: '2026-06-27', startVerseId: 43003016, endVerseId: 43003018 };

  it('parses a well-formed entry and keeps the string id', () => {
    expect(parseApiLogEntry({ ...base, id: 'abc' })).toEqual({
      id: 'abc',
      ...base,
    });
  });

  it('falls back to `_id` when `id` is absent', () => {
    expect(parseApiLogEntry({ ...base, _id: 'mongo-id' })?.id).toBe('mongo-id');
  });

  it('stringifies a numeric id', () => {
    expect(parseApiLogEntry({ ...base, id: 42 })?.id).toBe('42');
  });

  it('leaves id undefined when neither id nor _id is present', () => {
    expect(parseApiLogEntry(base)?.id).toBeUndefined();
  });

  it('coerces numeric verse ids that arrive as strings', () => {
    const parsed = parseApiLogEntry({
      date: '2026-06-27',
      startVerseId: '43003016',
      endVerseId: '43003018',
    });
    expect(parsed).toMatchObject({ startVerseId: 43003016, endVerseId: 43003018 });
  });

  it('returns null when the date is missing', () => {
    expect(parseApiLogEntry({ startVerseId: 1, endVerseId: 2 })).toBeNull();
  });

  it('returns null when a verse id is not coercible', () => {
    expect(
      parseApiLogEntry({ date: '2026-06-27', startVerseId: 'x', endVerseId: 2 }),
    ).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(parseApiLogEntry(null)).toBeNull();
    expect(parseApiLogEntry('nope')).toBeNull();
    expect(parseApiLogEntry(undefined)).toBeNull();
  });
});

describe('parseApiLogEntries', () => {
  it('filters out unusable rows and keeps valid ones', () => {
    const result = parseApiLogEntries([
      { date: '2026-06-27', startVerseId: 1, endVerseId: 2 },
      null,
      { date: '2026-06-28', startVerseId: 'bad', endVerseId: 2 },
      { id: 'x', date: '2026-06-29', startVerseId: 3, endVerseId: 4 },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(['2026-06-27', '2026-06-29']);
  });

  it('returns an empty array for non-array input', () => {
    expect(parseApiLogEntries({})).toEqual([]);
    expect(parseApiLogEntries(null)).toEqual([]);
  });
});
