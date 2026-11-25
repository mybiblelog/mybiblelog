// Run the focus effect as a plain effect (no navigation container in tests).
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(cb, [cb]);
  },
}));
jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest.fn(),
  createNote: jest.fn(),
  fetchNoteCountsByBook: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn().mockResolvedValue([]),
}));

import { router } from "expo-router";
import { Bible, type PassageNote } from "@mybiblelog/shared";
import { createNote, fetchNotesPage } from "@/src/api/notesApi";
import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { useOfflineNotesStore } from "@/src/stores/offlineNotes";
import { notesActions } from "@/src/stores/passageNotes";
import { RecentNotesSection } from "./RecentNotesSection";

const notes: PassageNote[] = [
  {
    id: "n1",
    content: "In the beginning…",
    passages: [
      { startVerseId: Bible.makeVerseId(1, 1, 1), endVerseId: Bible.makeVerseId(1, 1, 5) },
    ],
    tags: [],
  },
  { id: "n2", content: "Second note", passages: [], tags: [] },
];

beforeEach(() => {
  (fetchNotesPage as jest.Mock).mockReset().mockResolvedValue({
    notes,
    meta: { offset: 0, limit: 3, size: notes.length },
  });
  (router.push as jest.Mock).mockClear();
  useConnectivityStore.setState({ isOnline: null, apiReachable: null });
  useOfflineNotesStore.setState({ state: { status: "ready", notes: [], isSyncing: false } });
});

describe("RecentNotesSection", () => {
  it("fetches and renders the most recent notes", async () => {
    const { getByText } = await renderWithProviders(<RecentNotesSection />);

    await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());
    expect(getByText("Second note")).toBeTruthy();
    expect(fetchNotesPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 3 }));
  });

  it("shows the empty state when there are no notes", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue({
      notes: [],
      meta: { offset: 0, limit: 3, size: 0 },
    });
    const { getByText } = await renderWithProviders(<RecentNotesSection />);

    await waitFor(() => expect(getByText("No Notes")).toBeTruthy());
  });

  it("navigates to the Notes tab from View All Notes", async () => {
    const { getByText } = await renderWithProviders(<RecentNotesSection />);
    await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());

    await fireEvent.press(getByText("View All Notes"));

    expect(router.push).toHaveBeenCalledWith("/(tabs)/notes");
  });

  it("opens the note editor from the New button", async () => {
    const { getByText } = await renderWithProviders(<RecentNotesSection />);
    await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());

    await fireEvent.press(getByText("New"));

    expect(getByText("New Note")).toBeTruthy();
  });

  it("renders notes staged offline instead of the (unreachable) online list", async () => {
    useConnectivityStore.setState({ isOnline: false });
    useOfflineNotesStore.setState({
      state: {
        status: "ready",
        notes: [
          {
            clientId: "local-1",
            content: "Staged while offline",
            passages: [],
            tags: [],
            createdAt: "2026-09-13T00:00:00.000Z",
            updatedAt: "2026-09-13T00:00:00.000Z",
          },
        ],
        isSyncing: false,
      },
    });

    const { getByText, queryByText } = await renderWithProviders(<RecentNotesSection />);

    await waitFor(() => expect(getByText("Staged while offline")).toBeTruthy());
    expect(queryByText("In the beginning…")).toBeNull();
  });

  describe("refetching when notes change elsewhere while Today stays focused", () => {
    const added: PassageNote = { id: "n3", content: "Brand new note", passages: [], tags: [] };
    const withAdded = () =>
      (fetchNotesPage as jest.Mock).mockResolvedValue({
        notes: [added, ...notes],
        meta: { offset: 0, limit: 3, size: 3 },
      });

    it("shows a note created through the notes store (e.g. a log entry's Take note)", async () => {
      const { getByText } = await renderWithProviders(<RecentNotesSection />);
      await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());
      (createNote as jest.Mock).mockResolvedValue(added);
      withAdded();

      await act(async () => {
        await notesActions.create({ content: added.content, passages: [], tags: [] });
      });

      await waitFor(() => expect(getByText("Brand new note")).toBeTruthy());
    });

    it("refetches after an offline-queue sync reports a server change", async () => {
      const { getByText } = await renderWithProviders(<RecentNotesSection />);
      await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());
      withAdded();

      await act(async () => notesActions.notifyServerChanged());

      await waitFor(() => expect(getByText("Brand new note")).toBeTruthy());
    });

    it("fetches once per change, not once per caller", async () => {
      const { getByText } = await renderWithProviders(<RecentNotesSection />);
      await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());
      const callsAfterMount = (fetchNotesPage as jest.Mock).mock.calls.filter(
        ([q]) => q.limit === 3
      ).length;
      (createNote as jest.Mock).mockResolvedValue(added);
      withAdded();

      await act(async () => {
        await notesActions.create({ content: added.content, passages: [], tags: [] });
      });
      await waitFor(() => expect(getByText("Brand new note")).toBeTruthy());

      const recentCalls = (fetchNotesPage as jest.Mock).mock.calls.filter(([q]) => q.limit === 3);
      expect(recentCalls).toHaveLength(callsAfterMount + 1);
    });
  });
});
