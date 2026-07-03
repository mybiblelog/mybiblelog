jest.mock("@/src/bible/openInBible", () => ({
  openPassageInBible: jest.fn(),
}));

import { Bible } from "@mybiblelog/shared";
import { openPassageInBible } from "@/src/bible/openInBible";
import type { DisplayReadingSuggestion } from "@/src/reading-suggestions/useReadingSuggestions";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { ReadingSuggestionsSection } from "./ReadingSuggestionsSection";

const suggestion: DisplayReadingSuggestion = {
  startVerseId: Bible.makeVerseId(40, 1, 1),
  endVerseId: Bible.makeVerseId(40, 1, 25),
  passageLabel: "Matthew 1",
  contextMessage: "Read something new in the New Testament",
  newVerseCount: 25,
};

describe("ReadingSuggestionsSection", () => {
  it("renders suggestion rows with passage, context, and new-verse meta", () => {
    const { getByText } = renderWithProviders(
      <ReadingSuggestionsSection suggestions={[suggestion]} today="2026-07-03" />
    );
    expect(getByText("Reading Suggestions")).toBeTruthy();
    expect(getByText("Matthew 1")).toBeTruthy();
    expect(getByText("Read something new in the New Testament")).toBeTruthy();
    expect(getByText("25 new verses")).toBeTruthy();
  });

  it("shows the empty state when there are no suggestions", () => {
    const { getByText } = renderWithProviders(
      <ReadingSuggestionsSection suggestions={[]} today="2026-07-03" />
    );
    expect(getByText("No Suggestions")).toBeTruthy();
  });

  it("opens the passage in the Bible app from the row menu", async () => {
    (openPassageInBible as jest.Mock).mockResolvedValue(true);
    const { getByText } = renderWithProviders(
      <ReadingSuggestionsSection suggestions={[suggestion]} today="2026-07-03" />
    );

    fireEvent.press(getByText("Matthew 1"));
    fireEvent.press(getByText("Open in Bible"));

    await waitFor(() =>
      expect(openPassageInBible).toHaveBeenCalledWith(suggestion.startVerseId, expect.any(Object))
    );
  });

  it("opens the log-entry editor prefilled from Log reading", () => {
    const { getByText, getAllByText } = renderWithProviders(
      <ReadingSuggestionsSection suggestions={[suggestion]} today="2026-07-03" />
    );

    fireEvent.press(getByText("Matthew 1"));
    fireEvent.press(getByText("Log reading"));

    expect(getByText("Add Log Entry")).toBeTruthy();
    // The editor is seeded with the suggestion's passage: the full-chapter
    // range displays as "Matthew 1" in the editor as well as the row.
    expect(getAllByText("Matthew 1").length).toBeGreaterThanOrEqual(2);
    expect(getByText("Matthew")).toBeTruthy();
  });
});
