import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { DailyVersesChart } from "@/src/components/organisms/DailyVersesChart";

const today = dayjs().format("YYYY-MM-DD");

const entries = [
  {
    date: today,
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 31),
  },
];

describe("DailyVersesChart", () => {
  it("defaults to a 30-day window and renders the SVG geometry", () => {
    const { getByTestId, getByText } = renderWithProviders(<DailyVersesChart entries={entries} />);
    expect(getByText("Last 30 days")).toBeTruthy();
    expect(getByTestId("insights.trend-chart")).toBeTruthy();
    expect(getByTestId("insights.trend-line")).toBeTruthy();
    expect(getByTestId("insights.trend-area")).toBeTruthy();
  });

  it("switches the time window", () => {
    const { getAllByText, getByTestId, getByText } = renderWithProviders(
      <DailyVersesChart entries={entries} />
    );
    fireEvent.press(getByTestId("insights.trend-window-row"));
    fireEvent.press(getByText("Last 7 days"));
    expect(getAllByText("Last 7 days").length).toBeGreaterThan(0);
  });
});
