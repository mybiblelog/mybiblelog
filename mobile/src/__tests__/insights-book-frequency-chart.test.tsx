import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { BookFrequencyChart } from "@/src/components/organisms/BookFrequencyChart";

const today = dayjs().format("YYYY-MM-DD");

const entries = [
  {
    date: today,
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 31),
  },
  {
    date: today,
    startVerseId: Bible.makeVerseId(9, 1, 1), // 1 Samuel
    endVerseId: Bible.makeVerseId(9, 1, 10),
  },
];

describe("BookFrequencyChart", () => {
  it("defaults to a 30-day timeframe and raw verse counts", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <BookFrequencyChart entries={entries} />
    );
    expect(getByTestId("insights.frequency-timeframe-row")).toBeTruthy();
    expect(getByText("Last 30 days")).toBeTruthy();
    expect(getByText("31")).toBeTruthy();
    expect(getByText(Bible.getBookName(9, "en"))).toBeTruthy();
  });

  it("switches to proportional percentages", () => {
    const { getAllByText, getByText } = renderWithProviders(
      <BookFrequencyChart entries={entries} />
    );
    fireEvent.press(getByText("Proportional"));
    expect(getAllByText(/%$/).length).toBeGreaterThan(0);
  });

  it("keeps book names intact (with leading numbers) under alphabetical sort", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <BookFrequencyChart entries={entries} />
    );
    fireEvent.press(getByTestId("insights.frequency-sort-row"));
    fireEvent.press(getByText("Alphabetical"));
    expect(getByText(Bible.getBookName(9, "en"))).toBeTruthy();
  });
});
