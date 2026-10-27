import dayjs from "dayjs";
import { Bible, type InsightsLogEntry } from "@mybiblelog/shared";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";
import { BookFrequencyChart } from "./BookFrequencyChart";

const today = dayjs().format("YYYY-MM-DD");

// Genesis: 20/1533 verses read (~1%). Amos: 15/146 (~10%). Obadiah: 10/21
// (~48%). Revelation: 12/404 (~3%). Counts and proportions are chosen so raw
// and proportional "most read"/"least read" orderings diverge from each
// other, and so alphabetical order ("Amos" < "Genesis") diverges from Bible
// order (Genesis is book 1, Amos is book 30).
const entries: InsightsLogEntry[] = [
  {
    date: today,
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 20),
  },
  {
    date: today,
    startVerseId: Bible.makeVerseId(30, 1, 1),
    endVerseId: Bible.makeVerseId(30, 1, 15),
  },
  {
    date: today,
    startVerseId: Bible.makeVerseId(31, 1, 1),
    endVerseId: Bible.makeVerseId(31, 1, 10),
  },
  {
    date: today,
    startVerseId: Bible.makeVerseId(66, 1, 1),
    endVerseId: Bible.makeVerseId(66, 1, 12),
  },
];

const bookNames = /^(Genesis|Amos|Obadiah|Revelation)$/;

function renderedBookOrder() {
  return screen.getAllByText(bookNames).map((el) => el.props.children);
}

async function openSort() {
  await fireEvent.press(screen.getByTestId("insights.frequency-sort-row"));
}

describe("BookFrequencyChart", () => {
  it("defaults to Bible order with raw verse counts", async () => {
    await renderWithProviders(<BookFrequencyChart entries={entries} />);
    expect(renderedBookOrder()).toEqual(["Genesis", "Amos", "Obadiah", "Revelation"]);
    expect(screen.getByText("20")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("sorts alphabetically, independent of Bible order", async () => {
    await renderWithProviders(<BookFrequencyChart entries={entries} />);
    await openSort();
    await fireEvent.press(screen.getByText("Alphabetical"));
    expect(renderedBookOrder()).toEqual(["Amos", "Genesis", "Obadiah", "Revelation"]);
  });

  it("sorts most read by raw verse count", async () => {
    await renderWithProviders(<BookFrequencyChart entries={entries} />);
    await openSort();
    await fireEvent.press(screen.getByText("Most read"));
    // Raw counts: Genesis 20 > Amos 15 > Revelation 12 > Obadiah 10.
    expect(renderedBookOrder()).toEqual(["Genesis", "Amos", "Revelation", "Obadiah"]);
  });

  it("sorts least read by raw verse count", async () => {
    await renderWithProviders(<BookFrequencyChart entries={entries} />);
    await openSort();
    await fireEvent.press(screen.getByText("Least read"));
    expect(renderedBookOrder()).toEqual(["Obadiah", "Revelation", "Amos", "Genesis"]);
  });

  it("switches to the proportional metric, relabeling rows as percentages", async () => {
    await renderWithProviders(<BookFrequencyChart entries={entries} />);
    await fireEvent.press(screen.getByText("Proportional"));
    expect(screen.getByText("1%")).toBeTruthy(); // Genesis: 20/1533
    expect(screen.getByText("10%")).toBeTruthy(); // Amos: 15/146
    expect(screen.getByText("48%")).toBeTruthy(); // Obadiah: 10/21
    expect(screen.getByText("3%")).toBeTruthy(); // Revelation: 12/404
  });

  it("sorts most read by proportion once the proportional metric is selected", async () => {
    await renderWithProviders(<BookFrequencyChart entries={entries} />);
    await fireEvent.press(screen.getByText("Proportional"));
    await openSort();
    await fireEvent.press(screen.getByText("Most read"));
    // Proportions: Obadiah 48% > Amos 10% > Revelation 3% > Genesis 1% — the
    // opposite order from the raw-count "most read" sort above.
    expect(renderedBookOrder()).toEqual(["Obadiah", "Amos", "Revelation", "Genesis"]);
  });
});
