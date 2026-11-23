import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '../platform/http-client.js';
import {
  createPassageNoteTag,
  deletePassageNoteTag,
  fetchPassageNoteTags,
  parsePassageNoteTag,
  updatePassageNoteTag,
} from './api.js';

const mockedHttpClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const http = mockedHttpClient as unknown as HttpClient;

describe('parsePassageNoteTag', () => {
  it('parses a full tag and normalizes the id to a string', () => {
    expect(
      parsePassageNoteTag({
        id: 7,
        label: 'Prayer',
        color: '#00aaf9',
        description: 'd',
        noteCount: '3',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({
      id: '7',
      label: 'Prayer',
      color: '#00aaf9',
      description: 'd',
      noteCount: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('defaults missing fields', () => {
    expect(parsePassageNoteTag({ id: 'a' })).toEqual({
      id: 'a',
      label: '',
      color: '#000000',
      description: '',
      noteCount: 0,
      createdAt: undefined,
    });
  });

  it('returns null for non-objects and tags without ids', () => {
    expect(parsePassageNoteTag(null)).toBeNull();
    expect(parsePassageNoteTag({ label: 'orphan' })).toBeNull();
  });
});

describe('fetchPassageNoteTags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses an array of tags', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: [{ id: '1', label: 'Prayer' }] });
    expect(await fetchPassageNoteTags(http)).toEqual([expect.objectContaining({ id: '1', label: 'Prayer' })]);
  });

  it('returns an empty array when data is not an array', async () => {
    mockedHttpClient.get.mockResolvedValue({ data: null });
    expect(await fetchPassageNoteTags(http)).toEqual([]);
  });
});

describe('createPassageNoteTag', () => {
  beforeEach(() => vi.clearAllMocks());

  const input = { label: 'Prayer', color: '#00aaf9', description: '' };

  it('returns the parsed tag on success', async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { id: '1', label: 'Prayer' } });
    expect(await createPassageNoteTag(http, input)).toEqual(expect.objectContaining({ id: '1', label: 'Prayer' }));
  });

  it('throws when the response fails parsePassageNoteTag', async () => {
    mockedHttpClient.post.mockResolvedValue({ data: null });
    await expect(createPassageNoteTag(http, input)).rejects.toThrow(
      'POST /passage-note-tags returned unexpected payload',
    );
  });
});

describe('updatePassageNoteTag', () => {
  beforeEach(() => vi.clearAllMocks());

  const input = { id: '1', label: 'Prayer', color: '#00aaf9', description: '' };

  it('returns the parsed tag on success', async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { id: '1', label: 'Prayer' } });
    expect(await updatePassageNoteTag(http, input)).toEqual(expect.objectContaining({ id: '1', label: 'Prayer' }));
  });

  it('throws when the response fails parsePassageNoteTag', async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { label: 'orphan' } });
    await expect(updatePassageNoteTag(http, input)).rejects.toThrow(
      'PATCH /passage-note-tags returned unexpected payload',
    );
  });
});

describe('deletePassageNoteTag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('coerces a truthy data field to true', async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: { ok: true } });
    expect(await deletePassageNoteTag(http, '1')).toBe(true);
  });

  it('coerces a falsy data field to false', async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: 0 });
    expect(await deletePassageNoteTag(http, '1')).toBe(false);
  });
});
