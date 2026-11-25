import { reportHandledError } from "@/src/observability/sentry";
import { appStorage } from "@/src/storage/keys";

/**
 * Persistence for the Today screen's one-time "set a daily reminder" card
 * (`DailyReminderPromptCard`).
 */
export type DailyReminderPromptState = {
  dismissed: boolean;
};

export async function isDailyReminderPromptDismissed(): Promise<boolean> {
  try {
    const stored = await appStorage.get("dailyReminderPrompt");
    return stored?.dismissed === true;
  } catch (err) {
    reportHandledError(err, { op: "dailyReminderPrompt.isDismissed" });
    return false;
  }
}

export async function dismissDailyReminderPrompt(): Promise<void> {
  try {
    await appStorage.set("dailyReminderPrompt", { dismissed: true });
  } catch (err) {
    reportHandledError(err, { op: "dailyReminderPrompt.dismiss" });
  }
}
