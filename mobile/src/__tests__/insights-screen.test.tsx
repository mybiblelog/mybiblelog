import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import Insights from "@/app/(tabs)/settings/insights";

const today = dayjs().format("YYYY-MM-DD");

beforeEach(() => {
  useLogEntriesStore.setState({
    state: {
      status: "ready",
      entries: [
        {
          clientId: "c1",
          date: today,
          startVerseId: Bible.makeVerseId(1, 1, 1),
          endVerseId: Bible.makeVerseId(1, 1, 31),
        },
      ],
      isSyncing: false,
    },
  });
});

describe("Insights screen", () => {
  it("shows a loading state while entries are hydrating", () => {
    useLogEntriesStore.setState({ state: { status: "loading" } });
    const { getByText } = renderWithProviders(<Insights />);
    expect(getByText("Loading your reading history…")).toBeTruthy();
  });

  it("defaults to the Activity view", async () => {
    const { getByTestId } = renderWithProviders(<Insights />);
    await waitFor(() => expect(getByTestId("insights.heatmap-grid")).toBeTruthy());
  });

  it("switches to the Books view and shows book rows", async () => {
    const { getByText, getByTestId } = renderWithProviders(<Insights />);
    fireEvent.press(getByText("Books"));
    await waitFor(() => expect(getByTestId("insights.books-sort-row")).toBeTruthy());
    expect(getByText(Bible.getBookName(1, "en"))).toBeTruthy();
  });

  it("switches to the Frequency view", async () => {
    const { getByText, getByTestId } = renderWithProviders(<Insights />);
    fireEvent.press(getByText("Frequency"));
    await waitFor(() => expect(getByTestId("insights.frequency-timeframe-row")).toBeTruthy());
    expect(getByText("Verse counts")).toBeTruthy();
  });

  it("switches to the Trend view", async () => {
    const { getByText, getByTestId } = renderWithProviders(<Insights />);
    fireEvent.press(getByText("Trend"));
    await waitFor(() => expect(getByTestId("insights.trend-chart")).toBeTruthy());
  });
});
