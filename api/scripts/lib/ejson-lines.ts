import { BSON } from 'mongodb';

// Canonical (non-relaxed) EJSON keeps ObjectId, Date and numeric types
// distinct, so a restored document is identical to the one that was backed up.
export const serializeDocument = (doc: unknown): string => BSON.EJSON.stringify(doc as BSON.Document, { relaxed: false });

export const parseDocument = (line: string): BSON.Document => BSON.EJSON.parse(line, { relaxed: false }) as BSON.Document;
