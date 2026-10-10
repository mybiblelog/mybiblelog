const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Validates a client-supplied id string before it is used in a repository
 * lookup. Every backend issues ids in MongoDB ObjectId format (24 hex
 * characters), so this check is backend-neutral.
 */
export const isValidObjectId = (id: string): boolean => {
  return OBJECT_ID_PATTERN.test(id);
};
