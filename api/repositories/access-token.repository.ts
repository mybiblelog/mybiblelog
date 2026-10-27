import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { ACCESS_TOKEN_PREFIX, isAccessTokenScope } from '@mybiblelog/shared';
import type { Collections } from '../mongo/useCollections';
import type { AccessTokenDocument } from '../mongo/documents';
import { isValidObjectId } from './helpers/ids';
import { AccessTokenCreateInput, AccessTokenRecord } from './helpers/types';

// 32 random bytes is 256 bits of entropy, so an unsalted SHA-256 is enough:
// there is no low-entropy secret to brute-force, unlike a password.
const TOKEN_RANDOM_BYTES = 32;
// Enough of the token to tell tokens apart in a list, far too little to guess the rest.
const DISPLAY_PREFIX_LENGTH = ACCESS_TOKEN_PREFIX.length + 4;

export const hashAccessToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const toAccessTokenRecord = (doc: AccessTokenDocument): AccessTokenRecord => ({
  id: doc._id.toString(),
  ownerId: doc.owner.toString(),
  name: doc.name,
  prefix: doc.prefix,
  scopes: doc.scopes.filter(isAccessTokenScope),
  tokenVersion: doc.tokenVersion,
  expiresAt: doc.expiresAt,
  lastUsedAt: doc.lastUsedAt,
  createdAt: doc.createdAt,
});

export const createAccessTokenRepository = ({ accessTokens }: Collections) => {
  return {
    /**
     * Creates a token and returns its record along with the plaintext token,
     * which is not stored and cannot be recovered afterwards.
     */
    async create(ownerId: string, input: AccessTokenCreateInput): Promise<{ record: AccessTokenRecord; token: string }> {
      const token = ACCESS_TOKEN_PREFIX + crypto.randomBytes(TOKEN_RANDOM_BYTES).toString('base64url');
      const doc: AccessTokenDocument = {
        _id: new ObjectId(),
        owner: new ObjectId(ownerId),
        name: input.name,
        tokenHash: hashAccessToken(token),
        prefix: token.slice(0, DISPLAY_PREFIX_LENGTH),
        scopes: [...input.scopes],
        tokenVersion: input.tokenVersion,
        expiresAt: input.expiresAt,
        lastUsedAt: null,
        createdAt: new Date(),
      };
      await accessTokens.insertOne(doc);
      return { record: toAccessTokenRecord(doc), token };
    },

    /** Newest first, including expired tokens so the user can see and remove them. */
    async listByOwner(ownerId: string): Promise<AccessTokenRecord[]> {
      const docs = await accessTokens.find({ owner: new ObjectId(ownerId) }).sort({ createdAt: -1 }).toArray();
      return docs.map(toAccessTokenRecord);
    },

    async countUnexpiredByOwner(ownerId: string, now = new Date()): Promise<number> {
      return accessTokens.countDocuments({ owner: new ObjectId(ownerId), expiresAt: { $gt: now } });
    },

    /** Looks a token up by its plaintext. Expiry and scopes are the caller's to check. */
    async findByToken(token: string): Promise<AccessTokenRecord | null> {
      const doc = await accessTokens.findOne({ tokenHash: hashAccessToken(token) });
      return doc && toAccessTokenRecord(doc);
    },

    async recordUse(id: string, now = new Date()): Promise<void> {
      await accessTokens.updateOne({ _id: new ObjectId(id) }, { $set: { lastUsedAt: now } });
    },

    /** Revoking deletes the token outright; nothing else refers to it. */
    async deleteByIdForOwner(ownerId: string, id: string): Promise<boolean> {
      if (!isValidObjectId(id)) {
        return false;
      }
      const result = await accessTokens.deleteOne({ _id: new ObjectId(id), owner: new ObjectId(ownerId) });
      return result.deletedCount === 1;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await accessTokens.deleteMany({ owner: new ObjectId(ownerId) });
    },
  };
};
