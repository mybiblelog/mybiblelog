import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { serializeDocument, parseDocument } from '../scripts/lib/ejson-lines';

describe('backup serialization', () => {
  it('round-trips ObjectId and Date types', () => {
    const doc = { _id: new ObjectId(), owner: new ObjectId(), tags: [new ObjectId()], createdAt: new Date('2026-01-02T03:04:05.678Z'), count: 3 };
    const line = serializeDocument(doc);
    expect(line).not.toContain('\n');
    const parsed = parseDocument(line);
    expect(parsed._id).toBeInstanceOf(ObjectId);
    expect((parsed.tags as ObjectId[])[0]).toBeInstanceOf(ObjectId);
    expect(parsed.createdAt).toBeInstanceOf(Date);
    // Canonical EJSON restores numbers as BSON wrappers (Int32), which preserves the stored type.
    expect(Number(parsed.count)).toBe(3);
    expect(parsed._id.equals(doc._id)).toBe(true);
    expect(parsed.createdAt).toEqual(doc.createdAt);
  });
});
