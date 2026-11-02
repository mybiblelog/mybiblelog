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
  it("defaults to a 30-day window and renders the SVG geometry", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <DailyVersesChart entries={entries} />
    );
    expect(getByText("Last 30 days")).toBeTruthy();
    expect(getByTestId("insights.trend-chart")).toBeTruthy();
    expect(getByTestId("insights.trend-line")).toBeTruthy();
    expect(getByTestId("insights.trend-area")).toBeTruthy();
  });

  it("switches the time window", async () => {
    const { getAllByText, getByTestId, getByText } = await renderWithProviders(
      <DailyVersesChart entries={entries} />
    );
    await fireEvent.press(getByTestId("insights.trend-window-row"));
    await fireEvent.press(getByText("Last 7 days"));
    expect(getAllByText("Last 7 days").length).toBeGreaterThan(0);
  });

  it("switches to a rolling average and still renders a curved line", async () => {
    const { getAllByText, getByTestId, getByText } = await renderWithProviders(
      <DailyVersesChart entries={entries} />
    );
    expect(getByText("Daily reading")).toBeTruthy();
    await fireEvent.press(getByTestId("insights.trend-metric-row"));
    await fireEvent.press(getByText("7-day average"));
    expect(getAllByText("7-day average").length).toBeGreaterThan(0);
    expect(getByTestId("insights.trend-line").props.d).toContain("C");
  });
});
