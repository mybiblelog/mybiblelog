import { Types } from 'mongoose';

/**
 * Validates a client-supplied id string before it is used in a repository
 * lookup. Routes use this instead of importing the MongoDB driver directly.
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};
