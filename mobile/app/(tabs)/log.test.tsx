import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import {
  getDefaultLocalUserSettingsForTest,
  useUserSettingsStore,
} from "@/src/stores/userSettings";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import Log from "./log";

function setEntries(entries: StoredLogEntry[]) {
  useLogEntriesStore.setState({
    state: { status: "ready", entries, isSyncing: false },
  });
}

beforeEach(() => {
  useUserSettingsStore.setState({
    state: {
      status: "ready",
      settings: getDefaultLocalUserSettingsForTest(),
      isRefreshingFromServer: false,
    },
  });
});

describe("Log screen", () => {
  it("shows a loading state while entries hydrate", () => {
    useLogEntriesStore.setState({ state: { status: "loading" } });
    const { getByText } = renderWithProviders(<Log />);
    expect(getByText("Loading log entries…")).toBeTruthy();
  });

  it("renders rows for each entry", () => {
    setEntries([
      { clientId: "c1", date: "2026-06-27", startVerseId: 101001001, endVerseId: 101001005 },
      { clientId: "c2", date: "2026-06-20", startVerseId: 101002001, endVerseId: 101002003 },
    ]);
    const { getByText } = renderWithProviders(<Log />);
    expect(getByText("Genesis 1:1-5")).toBeTruthy();
    expect(getByText("Genesis 2:1-3")).toBeTruthy();
  });

  it("shows the empty state with a CTA when there are no entries", () => {
    setEntries([]);
    const { getByText } = renderWithProviders(<Log />);
    expect(getByText("No log entries yet")).toBeTruthy();
    expect(getByText("Add a log entry")).toBeTruthy();
  });

  it("opens the entry menu for a row", () => {
    setEntries([
      { clientId: "c1", date: "2026-06-27", startVerseId: 101001001, endVerseId: 101001005 },
    ]);
    const { getByLabelText, getByText } = renderWithProviders(<Log />);
    fireEvent.press(getByLabelText("Genesis 1:1-5"));
    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
  });
});
