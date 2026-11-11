jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

import { renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { DAILY_REMINDER_NOTIFICATION_DATA_TYPE } from "./dailyReminder";
import { useDailyReminderTapRouting } from "./useDailyReminderTapRouting";

const addListener = Notifications.addNotificationResponseReceivedListener as jest.Mock;

function responseWithType(type: string) {
  return { notification: { request: { content: { data: { type } } } } };
}

async function mountAndGetListener(onboardingCompleted: boolean) {
  const hook = await renderHook(() => useDailyReminderTapRouting(onboardingCompleted));
  const listener = addListener.mock.calls.at(-1)?.[0] as ((r: unknown) => void) | undefined;
  return { hook, listener };
}

describe("useDailyReminderTapRouting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens Today when the daily reminder is tapped", async () => {
    const { listener } = await mountAndGetListener(true);

    listener!(responseWithType(DAILY_REMINDER_NOTIFICATION_DATA_TYPE));

    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("ignores other notifications", async () => {
    const { listener } = await mountAndGetListener(true);

    listener!(responseWithType("something-else"));

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does not listen before onboarding is completed", async () => {
    await mountAndGetListener(false);

    expect(addListener).not.toHaveBeenCalled();
  });

  it("never navigates from the cold-start response", async () => {
    await mountAndGetListener(true);

    expect(Notifications.getLastNotificationResponseAsync).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount", async () => {
    const remove = jest.fn();
    addListener.mockReturnValueOnce({ remove });
    const { hook } = await mountAndGetListener(true);

    await hook.unmount();

    expect(remove).toHaveBeenCalled();
  });
});
