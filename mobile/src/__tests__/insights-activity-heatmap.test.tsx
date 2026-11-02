import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { ActivityHeatmap } from "@/src/components/organisms/ActivityHeatmap";

const today = dayjs().format("YYYY-MM-DD");

const entries = [
  {
    date: today,
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 31),
  },
];

describe("ActivityHeatmap", () => {
  it("renders the grid and legend", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <ActivityHeatmap entries={entries} />
    );
    expect(getByTestId("insights.heatmap-grid")).toBeTruthy();
    expect(getByText("Less")).toBeTruthy();
    expect(getByText("More")).toBeTruthy();
  });

  it("reveals the count and date for a tapped cell", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <ActivityHeatmap entries={entries} />
    );
    await fireEvent.press(getByTestId(`insights.heatmap-cell.${today}`));
    expect(getByText(/31 verses read/)).toBeTruthy();
  });

  it("shows no-activity messaging for an empty day", async () => {
    const { getByTestId, getByText } = await renderWithProviders(<ActivityHeatmap entries={[]} />);
    await fireEvent.press(getByTestId(`insights.heatmap-cell.${today}`));
    expect(getByText(/No verses read/)).toBeTruthy();
  });
});
