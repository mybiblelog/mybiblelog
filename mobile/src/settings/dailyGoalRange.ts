/**
 * Valid range for `dailyVerseCountGoal`, mirroring the server's
 * `userSettingsBaseSchema` (`api/validation/schemas/user-settings.ts`). Shared
 * between Settings → Reading and the onboarding wizard's goal step.
 */
export const DAILY_GOAL_RANGE = { min: 1, max: 1111 } as const;
