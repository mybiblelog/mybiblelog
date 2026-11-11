import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { BookFrequencyChart } from "@/src/components/organisms/BookFrequencyChart";
import { useUserSettingsStore } from "@/src/stores/userSettings";

function setCanon(includeDeuterocanonical: boolean) {
  useUserSettingsStore.setState({
    state: {
      status: "ready",
      settings: {
        lookBackDate: "2020-01-01",
        dailyVerseCountGoal: 86,
        preferredBibleVersion: "ESV",
        preferredBibleApp: "",
        includeDeuterocanonical,
      },
      isRefreshingFromServer: false,
    },
  });
}

const initialSettingsState = useUserSettingsStore.getState().state;
afterEach(() => useUserSettingsStore.setState({ state: initialSettingsState }));

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
  it("lists deuterocanonical books only when the canon includes them", async () => {
    const tobit = Bible.getBookName(67, "en");
    setCanon(false);
    const common = await renderWithProviders(<BookFrequencyChart entries={entries} />);
    expect(common.queryByText(tobit)).toBeNull();
    await common.unmount();

    setCanon(true);
    const full = await renderWithProviders(<BookFrequencyChart entries={entries} />);
    expect(full.getByText(tobit)).toBeTruthy();
  });

  it("defaults to a 30-day timeframe and raw verse counts", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <BookFrequencyChart entries={entries} />
    );
    expect(getByTestId("insights.frequency-timeframe-row")).toBeTruthy();
    expect(getByText("Last 30 days")).toBeTruthy();
    expect(getByText("31")).toBeTruthy();
    expect(getByText(Bible.getBookName(9, "en"))).toBeTruthy();
  });

  it("switches to proportional percentages", async () => {
    const { getAllByText, getByText } = await renderWithProviders(
      <BookFrequencyChart entries={entries} />
    );
    await fireEvent.press(getByText("Proportional"));
    expect(getAllByText(/%$/).length).toBeGreaterThan(0);
  });

  it("keeps book names intact (with leading numbers) under alphabetical sort", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <BookFrequencyChart entries={entries} />
    );
    await fireEvent.press(getByTestId("insights.frequency-sort-row"));
    await fireEvent.press(getByText("Alphabetical"));
    expect(getByText(Bible.getBookName(9, "en"))).toBeTruthy();
  });

  it("includes entries older than a year under the all-time timeframe", async () => {
    const old = [
      {
        date: dayjs().subtract(3, "year").format("YYYY-MM-DD"),
        startVerseId: Bible.makeVerseId(2, 1, 1), // Exodus
        endVerseId: Bible.makeVerseId(2, 1, 22),
      },
    ];
    const { getByTestId, getByText, queryByText } = await renderWithProviders(
      <BookFrequencyChart entries={old} />
    );
    expect(queryByText("22")).toBeNull();
    await fireEvent.press(getByTestId("insights.frequency-timeframe-row"));
    await fireEvent.press(getByText("All time"));
    expect(getByText("22")).toBeTruthy();
  });
});
