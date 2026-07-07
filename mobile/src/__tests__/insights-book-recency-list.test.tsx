import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { StyleSheet } from "react-native";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { BookRecencyList } from "@/src/components/organisms/BookRecencyList";
import { recencyByScheme } from "@/src/design";

const today = dayjs().format("YYYY-MM-DD");
const daysAgo = (n: number) => dayjs().subtract(n, "day").format("YYYY-MM-DD");

const recency = recencyByScheme.light;
const GREEN = recency[4]; // most recent quarter
const ORANGE = recency[2]; // 25–50% of the timeframe
const UNREAD = recency[0]; // not read in the timeframe

// Genesis read today (always most-recent). Exodus read 200 days ago (inside a
// 365-day window, outside a 30-day one). Every other book untouched.
const entries = [
  {
    date: today,
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 31),
  },
  {
    date: daysAgo(200),
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId: Bible.makeVerseId(2, 1, 22),
  },
];

const bgOf = (el: { props: { style?: unknown } }) =>
  (StyleSheet.flatten(el.props.style as never) as { backgroundColor?: string }).backgroundColor;

describe("BookRecencyList", () => {
  it("labels untouched books as not read in the timeframe", () => {
    const { getAllByText } = renderWithProviders(<BookRecencyList entries={entries} />);
    expect(getAllByText("Not read in timeframe").length).toBeGreaterThan(0);
  });

  it("shows the book name and a relative date for a recently read book", () => {
    const { getByText } = renderWithProviders(<BookRecencyList entries={entries} />);
    expect(getByText(Bible.getBookName(1, "en"))).toBeTruthy();
    expect(getByText(/Today/i)).toBeTruthy();
  });

  it("colors each book's swatch by recency level (green = most recent, black = unread)", () => {
    const { getByTestId } = renderWithProviders(<BookRecencyList entries={entries} />);
    expect(bgOf(getByTestId("insights.books-swatch.1"))).toBe(GREEN); // Genesis, today
    expect(bgOf(getByTestId("insights.books-swatch.2"))).toBe(ORANGE); // Exodus, 200d ago
    expect(bgOf(getByTestId("insights.books-swatch.5"))).toBe(UNREAD); // Deuteronomy, never
  });

  it("recolors when the timeframe is narrowed to 30 days", () => {
    const { getByTestId, getByText } = renderWithProviders(<BookRecencyList entries={entries} />);
    // Exodus (200 days ago) is orange within the default 365-day window...
    expect(bgOf(getByTestId("insights.books-swatch.2"))).toBe(ORANGE);
    fireEvent.press(getByTestId("insights.books-timeframe-row"));
    expect(getByText("All time")).toBeTruthy();
    fireEvent.press(getByText("Last 30 days"));
    // ...and falls outside a 30-day window, becoming unread.
    expect(bgOf(getByTestId("insights.books-swatch.2"))).toBe(UNREAD);
  });

  it("filters to the New Testament via the testament control", () => {
    const { queryByTestId, getByText } = renderWithProviders(<BookRecencyList entries={entries} />);
    expect(queryByTestId("insights.books-swatch.1")).toBeTruthy(); // Genesis visible in Whole Bible
    fireEvent.press(getByText("New Testament"));
    expect(queryByTestId("insights.books-swatch.1")).toBeNull(); // Genesis (OT) hidden
    expect(queryByTestId("insights.books-swatch.40")).toBeTruthy(); // Matthew (NT) shown
  });

  it("offers all four sort options and updates the selected value", () => {
    const { getAllByText, getByTestId, getByText } = renderWithProviders(
      <BookRecencyList entries={entries} />
    );
    fireEvent.press(getByTestId("insights.books-sort-row"));
    expect(getByText("Bible order")).toBeTruthy();
    expect(getByText("Least recent")).toBeTruthy();
    // "Most recent" is the default selection, so it appears both as the row's
    // current value and as an option in the open sheet.
    expect(getAllByText("Most recent").length).toBeGreaterThan(0);

    fireEvent.press(getByText("Alphabetical"));
    expect(getAllByText("Alphabetical").length).toBeGreaterThan(0);
  });
});
