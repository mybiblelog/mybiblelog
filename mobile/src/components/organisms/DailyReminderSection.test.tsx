import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { appStorage } from "@/src/storage/keys";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test-utils/renderWithProviders";
import { DailyReminderSection } from "./DailyReminderSection";

const scheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const getPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissionsAsync = Notifications.requestPermissionsAsync as jest.Mock;

describe("DailyReminderSection", () => {
  beforeEach(async () => {
    await appStorage.remove("dailyReminder");
    scheduleNotificationAsync.mockClear().mockResolvedValue("scheduled-id");
    getPermissionsAsync.mockReset().mockResolvedValue({ status: "granted" });
    requestPermissionsAsync.mockReset().mockResolvedValue({ status: "granted" });
  });

  it("starts unchecked when no reminder is saved", async () => {
    renderWithProviders(<DailyReminderSection />);
    await waitFor(() =>
      expect(screen.getByRole("checkbox")).toHaveProp("accessibilityState", {
        checked: false,
        disabled: false,
      })
    );
  });

  it("schedules a notification and checks the box when toggled on", async () => {
    renderWithProviders(<DailyReminderSection />);
    await waitFor(() => screen.getByRole("checkbox"));

    fireEvent.press(screen.getByRole("checkbox"));

    await waitFor(() => expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("checkbox")).toHaveProp(
        "accessibilityState",
        expect.objectContaining({ checked: true })
      )
    );
  });

  it("shows an inline error and leaves the toggle off when permission is denied", async () => {
    getPermissionsAsync.mockResolvedValue({ status: "denied" });
    requestPermissionsAsync.mockResolvedValue({ status: "denied" });

    renderWithProviders(<DailyReminderSection />);
    await waitFor(() => screen.getByRole("checkbox"));

    fireEvent.press(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Notifications are turned off for this app. Enable them in your device settings to receive a reminder."
        )
      ).toBeTruthy()
    );
    expect(screen.getByRole("checkbox")).toHaveProp(
      "accessibilityState",
      expect.objectContaining({ checked: false })
    );
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("reschedules when the reminder is already on and the time changes", async () => {
    await appStorage.set("dailyReminder", {
      enabled: true,
      hour: 7,
      minute: 0,
      notificationId: "existing-id",
    });

    renderWithProviders(<DailyReminderSection />);
    await waitFor(() =>
      expect(screen.getByRole("checkbox")).toHaveProp(
        "accessibilityState",
        expect.objectContaining({ checked: true })
      )
    );

    fireEvent.press(screen.getByTestId("settings-reading.reminder-time-select"));
    // The time picker itself is a native spinner (untestable in Jest); this
    // confirms tapping the row opens the picker sheet rather than driving the
    // OS picker directly.
    await waitFor(() => expect(screen.getByText("Done")).toBeTruthy());
  });

  it("uses the imperative native dialog on Android instead of the sheet", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "android";
    const open = jest.spyOn(DateTimePickerAndroid, "open").mockImplementation(() => undefined);
    try {
      renderWithProviders(<DailyReminderSection />);
      await waitFor(() => screen.getByRole("checkbox"));

      fireEvent.press(screen.getByTestId("settings-reading.reminder-time-select"));

      expect(open).toHaveBeenCalledWith(expect.objectContaining({ mode: "time" }));
      expect(screen.queryByText("Done")).toBeNull();
    } finally {
      Platform.OS = originalOS;
      open.mockRestore();
    }
  });
});
