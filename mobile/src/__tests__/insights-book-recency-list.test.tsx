import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { BookRecencyList } from "@/src/components/organisms/BookRecencyList";

const today = dayjs().format("YYYY-MM-DD");

// Genesis (book 1) read today; every other book (including Exodus) untouched.
const entries = [
  {
    date: today,
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 31),
  },
];

describe("BookRecencyList", () => {
  it("shows Never read for untouched books", () => {
    const { getAllByText } = renderWithProviders(<BookRecencyList entries={entries} />);
    expect(getAllByText("Never read").length).toBeGreaterThan(0);
  });

  it("shows the book name and a relative date for a recently read book", () => {
    const { getByText } = renderWithProviders(<BookRecencyList entries={entries} />);
    expect(getByText(Bible.getBookName(1, "en"))).toBeTruthy();
    expect(getByText(/Today/i)).toBeTruthy();
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
    // The select row now reflects the chosen sort.
    expect(getAllByText("Alphabetical").length).toBeGreaterThan(0);
  });
});
