import crypto from 'node:crypto';

// Per-process random value and counter, as in the ObjectId spec.
const processUnique = crypto.randomBytes(5).toString('hex');
let counter = crypto.randomInt(0, 0xffffff);

/**
 * Generates a 24-hex-character id in MongoDB ObjectId layout (4-byte seconds
 * timestamp, 5-byte process-unique value, 3-byte counter) without depending on
 * the `mongodb` driver. Keeping the ObjectId shape means ids validate the same
 * way (`isValidObjectId`) and look the same to clients on either backend.
 */
export const generateId = (): string => {
  counter = (counter + 1) % 0x1000000;
  const seconds = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  return seconds + processUnique + counter.toString(16).padStart(6, '0');
};
