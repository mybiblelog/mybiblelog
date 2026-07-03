import { act, fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAchievementsStore } from "@/src/stores/achievements";
import { AchievementModal } from "./AchievementModal";

beforeEach(() => {
  jest.useFakeTimers();
  useAchievementsStore.setState({ current: null });
});

afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe("AchievementModal", () => {
  it("renders nothing until an achievement fires", () => {
    const { queryByText } = renderWithProviders(<AchievementModal />);
    expect(queryByText("OK")).toBeNull();
  });

  it("celebrates a completed book with its name", () => {
    useAchievementsStore.setState({ current: { type: "book", bookIndex: 64 } });
    const { getByText } = renderWithProviders(<AchievementModal />);

    // Flush the stamp/particle timers so no work is left pending.
    act(() => jest.advanceTimersByTime(3000));

    expect(getByText("Book Complete!")).toBeTruthy();
    expect(getByText("Congratulations! You have completed 3 John!")).toBeTruthy();
  });

  it("celebrates completing the whole Bible", () => {
    useAchievementsStore.setState({ current: { type: "bible" } });
    const { getByText } = renderWithProviders(<AchievementModal />);
    act(() => jest.advanceTimersByTime(3000));
    expect(getByText("Bible Complete!")).toBeTruthy();
  });

  it("closes via the OK button", () => {
    useAchievementsStore.setState({ current: { type: "book", bookIndex: 64 } });
    const { getByText } = renderWithProviders(<AchievementModal />);
    act(() => jest.advanceTimersByTime(3000));

    fireEvent.press(getByText("OK"));
    expect(useAchievementsStore.getState().current).toBeNull();
  });
});
