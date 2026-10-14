jest.mock("@/src/bible/openInBible", () => ({
  openPassageInBible: jest.fn(),
}));
jest.mock("@/src/stores/logEntries", () => ({
  ...jest.requireActual("@/src/stores/logEntries"),
  logEntryActions: {
    ...jest.requireActual("@/src/stores/logEntries").logEntryActions,
    deleteEntry: jest.fn(),
  },
}));

import { Text, TouchableOpacity } from "react-native";
import { Bible } from "@mybiblelog/shared";
import { openPassageInBible } from "@/src/bible/openInBible";
import { logEntryActions } from "@/src/stores/logEntries";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useLogEntryOverlays } from "./LogEntryOverlays";

// A harness exposing the hook's `openMenu` through a pressable button so
// tests can drive the overlays exactly like a screen would.
function Harness({ entry }: { entry: StoredLogEntry }) {
  const { openMenu, overlays } = useLogEntryOverlays({ entries: [entry] });
  return (
    <>
      <TouchableOpacity onPress={() => openMenu(entry)}>
        <Text>Open Menu</Text>
      </TouchableOpacity>
      {overlays}
    </>
  );
}

const genesisEntry: StoredLogEntry = {
  id: "1",
  clientId: "client-1",
  date: "2026-09-20",
  startVerseId: Bible.makeVerseId(1, 1, 1),
  endVerseId: Bible.makeVerseId(1, 1, 5),
};

// The final verse of Revelation: no next verse exists, so Continue Reading
// must be omitted (getNextVerseId(..., true) returns 0).
const lastBook = Bible.getBookCount();
const lastChapter = Bible.getBookChapterCount(lastBook);
const lastVerse = Bible.getChapterVerseCount(lastBook, lastChapter);
const finalVerseEntry: StoredLogEntry = {
  id: "2",
  clientId: "client-2",
  date: "2026-09-20",
  startVerseId: Bible.makeVerseId(lastBook, lastChapter, 1),
  endVerseId: Bible.makeVerseId(lastBook, lastChapter, lastVerse),
};

describe("useLogEntryOverlays", () => {
  beforeEach(() => {
    (openPassageInBible as jest.Mock).mockReset();
    (logEntryActions.deleteEntry as jest.Mock).mockReset();
  });

  it("omits Continue Reading for the final verse of Revelation", () => {
    const { getByText, queryByText } = renderWithProviders(<Harness entry={finalVerseEntry} />);
    fireEvent.press(getByText("Open Menu"));
    expect(getByText("Open in Bible")).toBeTruthy();
    expect(queryByText("Continue Reading")).toBeNull();
  });

  it("offers Continue Reading when a next verse exists", () => {
    const { getByText } = renderWithProviders(<Harness entry={genesisEntry} />);
    fireEvent.press(getByText("Open Menu"));
    expect(getByText("Continue Reading")).toBeTruthy();
  });

  it("shows the open-in-bible failure toast when it fails to open", async () => {
    (openPassageInBible as jest.Mock).mockResolvedValue(false);
    const { getByText } = renderWithProviders(<Harness entry={genesisEntry} />);
    fireEvent.press(getByText("Open Menu"));
    fireEvent.press(getByText("Open in Bible"));

    await waitFor(() => expect(getByText("Unable to open Bible app.")).toBeTruthy());
  });

  it("does not show the failure toast when opening succeeds", async () => {
    (openPassageInBible as jest.Mock).mockResolvedValue(true);
    const { getByText, queryByText } = renderWithProviders(<Harness entry={genesisEntry} />);
    fireEvent.press(getByText("Open Menu"));
    fireEvent.press(getByText("Open in Bible"));

    await waitFor(() => expect(openPassageInBible).toHaveBeenCalled());
    expect(queryByText("Unable to open Bible app.")).toBeNull();
  });

  it("deletes the confirmed entry by clientId", async () => {
    const { getByText, getAllByText } = renderWithProviders(<Harness entry={genesisEntry} />);
    fireEvent.press(getByText("Open Menu"));
    fireEvent.press(getByText("Delete"));

    // Both the menu action and the confirm dialog's button read "Delete";
    // the dialog's title confirms the confirm sheet is now open.
    expect(getByText("Delete log entry?")).toBeTruthy();
    const deleteButtons = getAllByText("Delete");
    fireEvent.press(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() =>
      expect(logEntryActions.deleteEntry).toHaveBeenCalledWith(genesisEntry.clientId)
    );
  });
});
