jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const mockSaveLocalUserSettings = jest.fn(async () => {});
jest.mock("@/src/settings/userSettingsStorage", () => ({
  ...jest.requireActual("@/src/settings/userSettingsStorage"),
  saveLocalUserSettings: (...args: unknown[]) => mockSaveLocalUserSettings(...(args as [])),
}));

const mockUpdateSettings = jest.fn();
jest.mock("@/src/api/settingsApi", () => ({
  ...jest.requireActual("@/src/api/settingsApi"),
  updateSettings: (...args: unknown[]) => mockUpdateSettings(...(args as [])),
}));

import ReadingSettings from "@/app/(tabs)/settings/reading";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";

const SAVED = {
  lookBackDate: "2026-01-01",
  dailyVerseCountGoal: 86,
  preferredBibleVersion: "KJV",
  preferredBibleApp: "BIBLEGATEWAY",
};

function seed({ authenticated = true }: { authenticated?: boolean } = {}) {
  useConnectivityStore.setState({ isOnline: true });
  useAuthStore.setState({
    state: authenticated
      ? { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } }
      : { status: "unauthenticated" },
  });
  useUserSettingsStore.setState({
    state: { status: "ready", settings: { ...SAVED }, isRefreshingFromServer: false },
  });
}

beforeEach(() => {
  mockSaveLocalUserSettings.mockClear();
  mockUpdateSettings.mockReset();
  mockUpdateSettings.mockResolvedValue({ ...SAVED });
  seed();
});

describe("Reading settings screen", () => {
  it("does not persist anything while a field is being edited", () => {
    const { getByTestId } = renderWithProviders(<ReadingSettings />);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "120");

    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(mockSaveLocalUserSettings).not.toHaveBeenCalled();
    // The store still holds the saved value, so the rest of the app is unaffected.
    const state = useUserSettingsStore.getState().state;
    expect(state.status === "ready" && state.settings.dailyVerseCountGoal).toBe(86);
  });

  it("saves the daily goal only when Save is pressed", async () => {
    mockUpdateSettings.mockResolvedValue({ ...SAVED, dailyVerseCountGoal: 120 });
    const { getByTestId } = renderWithProviders(<ReadingSettings />);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "120");
    await act(async () => {
      fireEvent.press(getByTestId("settings-reading.daily-goal-save"));
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ dailyVerseCountGoal: 120 });
    await waitFor(() => {
      const state = useUserSettingsStore.getState().state;
      expect(state.status === "ready" && state.settings.dailyVerseCountGoal).toBe(120);
    });
  });

  it("keeps Save disabled until the value differs from the saved one", () => {
    const { getByTestId } = renderWithProviders(<ReadingSettings />);
    const save = getByTestId("settings-reading.daily-goal-save");

    expect(save.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "120");
    expect(save.props.accessibilityState.disabled).toBe(false);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "86");
    expect(save.props.accessibilityState.disabled).toBe(true);
  });

  it("discards an edit back to the saved value", () => {
    const { getByTestId, queryByTestId } = renderWithProviders(<ReadingSettings />);

    expect(queryByTestId("settings-reading.daily-goal-discard")).toBeNull();

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "120");
    fireEvent.press(getByTestId("settings-reading.daily-goal-discard"));

    expect(getByTestId("settings-reading.daily-goal-input").props.value).toBe("86");
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range daily goal without saving", async () => {
    const { getByTestId, getByText } = renderWithProviders(<ReadingSettings />);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "5000");
    await act(async () => {
      fireEvent.press(getByTestId("settings-reading.daily-goal-save"));
    });

    expect(getByText("Enter a whole number between 1 and 1111.")).toBeTruthy();
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it("rejects a look back date that isn't a real day", async () => {
    const { getByTestId, getByText } = renderWithProviders(<ReadingSettings />);

    fireEvent.changeText(getByTestId("settings-reading.look-back-date-input"), "2026-02-30");
    await act(async () => {
      fireEvent.press(getByTestId("settings-reading.look-back-date-save"));
    });

    expect(getByText("Enter a date as YYYY-MM-DD.")).toBeTruthy();
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it("stages a picked Bible version and only saves it on Save", async () => {
    mockUpdateSettings.mockResolvedValue({ ...SAVED, preferredBibleVersion: "ESV" });
    const { getByTestId, getByText } = renderWithProviders(<ReadingSettings />);

    fireEvent.press(getByTestId("settings-reading.bible-version-select"));
    fireEvent.press(getByText("English Standard Version (ESV)"));

    // Picking an option stages the choice; Save turns on but nothing is stored.
    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(mockSaveLocalUserSettings).not.toHaveBeenCalled();
    expect(
      getByTestId("settings-reading.bible-version-save").props.accessibilityState.disabled
    ).toBe(false);

    await act(async () => {
      fireEvent.press(getByTestId("settings-reading.bible-version-save"));
    });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ preferredBibleVersion: "ESV" });
  });

  it("saves device-only settings locally, never to the server", async () => {
    const { getByTestId, getByText } = renderWithProviders(<ReadingSettings />);

    fireEvent.press(getByTestId("settings-reading.bible-app-select"));
    fireEvent.press(getByText("Logos"));
    await act(async () => {
      fireEvent.press(getByTestId("settings-reading.bible-app-save"));
    });

    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(mockSaveLocalUserSettings).toHaveBeenCalledWith(
      expect.objectContaining({ preferredBibleApp: "LOGOS" })
    );
  });

  it("falls back to device storage when signed out", async () => {
    seed({ authenticated: false });
    const { getByTestId } = renderWithProviders(<ReadingSettings />);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "120");
    await act(async () => {
      fireEvent.press(getByTestId("settings-reading.daily-goal-save"));
    });

    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(mockSaveLocalUserSettings).toHaveBeenCalledWith(
      expect.objectContaining({ dailyVerseCountGoal: 120 })
    );
  });

  it("keeps an in-progress edit when settings refresh underneath it", () => {
    const { getByTestId } = renderWithProviders(<ReadingSettings />);

    fireEvent.changeText(getByTestId("settings-reading.daily-goal-input"), "120");
    act(() => {
      useUserSettingsStore.setState({
        state: {
          status: "ready",
          settings: { ...SAVED, dailyVerseCountGoal: 99 },
          isRefreshingFromServer: false,
        },
      });
    });

    expect(getByTestId("settings-reading.daily-goal-input").props.value).toBe("120");
  });
});
