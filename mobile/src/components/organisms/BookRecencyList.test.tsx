import dayjs from "dayjs";
import { Bible, type InsightsLogEntry } from "@mybiblelog/shared";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";
import { BookRecencyList } from "./BookRecencyList";

const daysAgo = (n: number) => dayjs().subtract(n, "day").format("YYYY-MM-DD");

// Genesis (OT, book 1) read 3 days ago, Exodus (OT, book 2) read 40 days ago,
// Matthew (NT, book 40) read 1 day ago. Leviticus (OT, book 3) was read 500
// days ago — outside the default 365-day timeframe, so it only shows up as
// "read" once the timeframe switches to all-time. Amos (OT, book 30) and Mark
// (NT, book 41) are never read, to exercise "not read" sorting last.
const entries: InsightsLogEntry[] = [
  {
    date: daysAgo(3),
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 1),
  },
  {
    date: daysAgo(40),
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId: Bible.makeVerseId(2, 1, 1),
  },
  {
    date: daysAgo(1),
    startVerseId: Bible.makeVerseId(40, 1, 1),
    endVerseId: Bible.makeVerseId(40, 1, 1),
  },
  {
    date: daysAgo(500),
    startVerseId: Bible.makeVerseId(3, 1, 1),
    endVerseId: Bible.makeVerseId(3, 1, 1),
  },
];

const recentSetNames = /^(Genesis|Exodus|Matthew|Amos)$/;

function bookOrder() {
  return screen.getAllByText(recentSetNames).map((el) => el.props.children);
}

describe("BookRecencyList", () => {
  it("filters to the Old Testament", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    await fireEvent.press(screen.getByText("Old Testament"));
    expect(screen.getByText("Genesis")).toBeTruthy();
    expect(screen.getByText("Exodus")).toBeTruthy();
    expect(screen.getByText("Amos")).toBeTruthy();
    expect(screen.queryByText("Matthew")).toBeNull();
    expect(screen.queryByText("Mark")).toBeNull();
  });

  it("filters to the New Testament", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    await fireEvent.press(screen.getByText("New Testament"));
    expect(screen.getByText("Matthew")).toBeTruthy();
    expect(screen.getByText("Mark")).toBeTruthy();
    expect(screen.queryByText("Genesis")).toBeNull();
    expect(screen.queryByText("Exodus")).toBeNull();
  });

  it("shows the whole Bible by default", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    expect(screen.getByText("Genesis")).toBeTruthy();
    expect(screen.getByText("Matthew")).toBeTruthy();
  });

  it("treats a book read outside the default timeframe as not read", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    expect(screen.getByText("Leviticus")).toBeTruthy();
    expect(screen.queryByText("1 year ago")).toBeNull();
  });

  it("switching to all-time uses the earliest entry date as the window start", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    await fireEvent.press(screen.getByTestId("insights.books-timeframe-row"));
    await fireEvent.press(screen.getByText("All time"));
    // Leviticus's 500-day-old entry now falls inside the (widened) window.
    expect(screen.getByText("1 year ago")).toBeTruthy();
  });

  it("sorts most recent first by default, with never-read books last", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    // Matthew (1 day ago) > Genesis (3 days ago) > Exodus (40 days ago) >
    // Amos (never read, sorts last).
    expect(bookOrder()).toEqual(["Matthew", "Genesis", "Exodus", "Amos"]);
  });

  it("reverses to least recent first, still with never-read books last", async () => {
    await renderWithProviders(<BookRecencyList entries={entries} />);
    await fireEvent.press(screen.getByTestId("insights.books-sort-row"));
    await fireEvent.press(screen.getByText("Least recent"));
    expect(bookOrder()).toEqual(["Exodus", "Genesis", "Matthew", "Amos"]);
  });
});
