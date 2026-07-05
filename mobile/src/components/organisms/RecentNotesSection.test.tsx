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
}));
jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn().mockResolvedValue([]),
}));

import { router } from "expo-router";
import { Bible } from "@mybiblelog/shared";
import { fetchNotesPage, type PassageNote } from "@/src/api/notesApi";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
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
});

describe("RecentNotesSection", () => {
  it("fetches and renders the most recent notes", async () => {
    const { getByText } = renderWithProviders(<RecentNotesSection />);

    await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());
    expect(getByText("Second note")).toBeTruthy();
    expect(fetchNotesPage).toHaveBeenCalledWith(expect.objectContaining({ limit: 3 }));
  });

  it("shows the empty state when there are no notes", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue({
      notes: [],
      meta: { offset: 0, limit: 3, size: 0 },
    });
    const { getByText } = renderWithProviders(<RecentNotesSection />);

    await waitFor(() => expect(getByText("No Notes")).toBeTruthy());
  });

  it("navigates to the Notes tab from View All Notes", async () => {
    const { getByText } = renderWithProviders(<RecentNotesSection />);
    await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());

    fireEvent.press(getByText("View All Notes"));

    expect(router.push).toHaveBeenCalledWith("/(tabs)/notes");
  });

  it("opens the note editor from the New button", async () => {
    const { getByText } = renderWithProviders(<RecentNotesSection />);
    await waitFor(() => expect(getByText("In the beginning…")).toBeTruthy());

    fireEvent.press(getByText("New"));

    expect(getByText("New Note")).toBeTruthy();
  });
});
