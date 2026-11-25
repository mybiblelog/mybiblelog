// Run the focus effect as a plain effect (no navigation container in tests).
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(cb, [cb]);
  },
}));

import { router } from "expo-router";
import { appStorage } from "@/src/storage/keys";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test-utils/renderWithProviders";
import { DailyReminderPromptCard } from "./DailyReminderPromptCard";

const TITLE = "Never miss a day";

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
});

describe("DailyReminderPromptCard", () => {
  it("introduces the reminder once the reader has an entry and the reminder is off", async () => {
    await renderWithProviders(<DailyReminderPromptCard hasEntries />);
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
  });

  it("stays hidden before the first entry", async () => {
    await renderWithProviders(<DailyReminderPromptCard hasEntries={false} />);
    // Let the storage read settle before asserting absence.
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull());
  });

  it("stays hidden when the reminder is already on", async () => {
    await appStorage.set("dailyReminder", {
      enabled: true,
      hour: 8,
      minute: 0,
      notificationId: "id",
    });
    await renderWithProviders(<DailyReminderPromptCard hasEntries />);
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull());
  });

  it("stays hidden once dismissed", async () => {
    await appStorage.set("dailyReminderPrompt", { dismissed: true });
    await renderWithProviders(<DailyReminderPromptCard hasEntries />);
    await waitFor(() => expect(screen.queryByText(TITLE)).toBeNull());
  });

  it("persists dismissal from the No Thanks button", async () => {
    await renderWithProviders(<DailyReminderPromptCard hasEntries />);
    await waitFor(() => screen.getByText(TITLE));
    await fireEvent.press(screen.getByText("No Thanks"));
    expect(screen.queryByText(TITLE)).toBeNull();
    await waitFor(async () =>
      expect(await appStorage.get("dailyReminderPrompt")).toEqual({ dismissed: true })
    );
  });

  it("sends the reader to the reminder settings", async () => {
    await renderWithProviders(<DailyReminderPromptCard hasEntries />);
    await waitFor(() => screen.getByText(TITLE));
    await fireEvent.press(screen.getByText("Set a Reminder"));
    expect(router.push).toHaveBeenCalledWith("/settings/reading");
  });
});
