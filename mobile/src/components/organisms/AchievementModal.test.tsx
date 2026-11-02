import { act, fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAchievementsStore } from "@/src/stores/achievements";
import { AchievementModal } from "./AchievementModal";

beforeEach(() => {
  jest.useFakeTimers();
  useAchievementsStore.setState({ current: null });
});

afterEach(async () => {
  await act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe("AchievementModal", () => {
  it("renders nothing until an achievement fires", async () => {
    const { queryByText } = await renderWithProviders(<AchievementModal />);
    expect(queryByText("OK")).toBeNull();
  });

  it("celebrates a completed book with its name", async () => {
    useAchievementsStore.setState({ current: { type: "book", bookIndex: 64 } });
    const { getByText } = await renderWithProviders(<AchievementModal />);

    // Flush the stamp/particle timers so no work is left pending.
    await act(() => jest.advanceTimersByTime(3000));

    expect(getByText("Book Complete!")).toBeTruthy();
    expect(getByText("Congratulations! You have completed 3 John!")).toBeTruthy();
  });

  it("celebrates completing the whole Bible", async () => {
    useAchievementsStore.setState({ current: { type: "bible" } });
    const { getByText } = await renderWithProviders(<AchievementModal />);
    await act(() => jest.advanceTimersByTime(3000));
    expect(getByText("Bible Complete!")).toBeTruthy();
  });

  it("closes via the OK button", async () => {
    useAchievementsStore.setState({ current: { type: "book", bookIndex: 64 } });
    const { getByText } = await renderWithProviders(<AchievementModal />);
    await act(() => jest.advanceTimersByTime(3000));

    await fireEvent.press(getByText("OK"));
    expect(useAchievementsStore.getState().current).toBeNull();
  });
});
