import { ALLOWED_PLATFORMS } from '../../http/helpers/platform';

/**
 * Aggregation expressions over `UserDocument.platforms`, shared by the admin
 * user list (filtering/annotating one page) and the platform/locale report
 * (grouping every user), so both agree on what "uses web+android" and
 * "signed up on android" mean.
 *
 * They are built from the static `ALLOWED_PLATFORMS` list rather than
 * `$objectToArray`, so they never touch keys outside the allowlist and need no
 * newer-server operators.
 */

/**
 * How long after `createdAt` a platform's `firstSeenAt` may be and still count
 * as the platform the account was created on. Registration records activity
 * immediately (`trackClientActivity(..., { force: true })`), so genuine signup
 * platforms land within seconds; the margin only absorbs clock/ordering noise.
 * Accounts created before platform tracking existed (Oct 2026) have no entry
 * this close to `createdAt`, so they report `null` (unknown) instead of being
 * misattributed to whatever platform they happened to use after the rollout.
 */
export const SIGNUP_PLATFORM_WINDOW_MS = 24 * 60 * 60 * 1000;

const isRecorded = (platform: string) => ({ $ne: [{ $type: `$platforms.${platform}` }, 'missing'] });

/** The user's recorded platforms, in `ALLOWED_PLATFORMS` order (e.g. `['web', 'android']`). */
export const recordedPlatformsExpr = {
  $concatArrays: ALLOWED_PLATFORMS.map((platform) => ({
    $cond: [isRecorded(platform), [platform], []],
  })),
};

/**
 * The platform the account was created on, or `null` when unknown (see
 * `SIGNUP_PLATFORM_WINDOW_MS`): the recorded platform with the earliest
 * `firstSeenAt`, provided that is within the window after `createdAt`.
 */
export const signupPlatformExpr = {
  $let: {
    vars: {
      earliest: {
        $reduce: {
          input: {
            $concatArrays: ALLOWED_PLATFORMS.map((platform) => ({
              $cond: [isRecorded(platform), [{ k: platform, t: `$platforms.${platform}.firstSeenAt` }], []],
            })),
          },
          initialValue: null,
          in: {
            $cond: [
              { $or: [{ $eq: ['$$value', null] }, { $lt: ['$$this.t', '$$value.t'] }] },
              '$$this',
              '$$value',
            ],
          },
        },
      },
    },
    in: {
      $cond: [
        {
          $and: [
            { $ne: ['$$earliest', null] },
            { $lte: ['$$earliest.t', { $add: ['$createdAt', SIGNUP_PLATFORM_WINDOW_MS] }] },
          ],
        },
        '$$earliest.k',
        null,
      ],
    },
  },
};
