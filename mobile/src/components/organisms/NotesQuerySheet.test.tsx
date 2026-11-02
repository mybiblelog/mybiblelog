import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { initialNotesQuery } from "@/src/stores/passageNotes";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import { NotesQuerySheet } from "./NotesQuerySheet";

beforeEach(() => {
  useTagsStore.setState({
    state: {
      status: "ready",
      tags: [{ id: "t1", label: "Prayer", color: "#00aaf9", description: "", noteCount: 1 }],
    },
    sortOrder: "label:ascending",
  });
});

async function renderSheet(onApply = jest.fn(), onClose = jest.fn()) {
  return {
    onApply,
    onClose,
    ...(await renderWithProviders(
      <NotesQuerySheet
        visible
        appliedQuery={{ ...initialNotesQuery, filterTags: [] }}
        onApply={onApply}
        onClose={onClose}
      />
    )),
  };
}

describe("NotesQuerySheet", () => {
  it("disables Apply until the draft differs from the applied query", async () => {
    const { getByLabelText, getByPlaceholderText } = await renderSheet();
    expect(getByLabelText("Apply")).toBeDisabled();

    await fireEvent.changeText(getByPlaceholderText("Search note text…"), "grace");
    expect(getByLabelText("Apply")).toBeEnabled();
  });

  it("maps 'only untagged' to exact matching with no tags", async () => {
    const { getByText, getByLabelText, onApply } = await renderSheet();
    await fireEvent.press(getByText("Only untagged notes"));
    await fireEvent.press(getByLabelText("Apply"));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ filterTagMatching: "exact", filterTags: [] })
    );
  });

  it("applies sort direction changes", async () => {
    const { getByText, getByLabelText, onApply } = await renderSheet();
    await fireEvent.press(getByText("Oldest First"));
    await fireEvent.press(getByLabelText("Apply"));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ sortDirection: "ascending" }));
  });

  describe("passage order sorting", () => {
    // Genesis 1:1-31, as `openNotesForRange` would have set it up.
    const passageQuery = {
      ...initialNotesQuery,
      filterTags: [],
      filterPassageStartVerseId: 101001001,
      filterPassageEndVerseId: 101001031,
      sortOn: "passage" as const,
      sortDirection: "ascending" as const,
    };

    it("offers passage order only while a passage filter is set", async () => {
      expect((await renderSheet()).queryByText("Passage")).toBeNull();
      expect((await renderPassageSheet()).getByText("Passage")).toBeTruthy();
    });

    it("keeps passage order when applying an unrelated change", async () => {
      const { getByPlaceholderText, getByLabelText, onApply } = await renderPassageSheet();
      await fireEvent.changeText(getByPlaceholderText("Search note text…"), "grace");
      await fireEvent.press(getByLabelText("Apply"));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({ sortOn: "passage", sortDirection: "ascending" })
      );
    });

    it("reverts to newest first when the passage filter is cleared", async () => {
      const { getByText, getByLabelText, onApply } = await renderPassageSheet();
      await fireEvent.press(getByText("Clear passage"));
      await fireEvent.press(getByLabelText("Apply"));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOn: "createdAt",
          sortDirection: "descending",
          filterPassageStartVerseId: 0,
          filterPassageEndVerseId: 0,
        })
      );
    });

    it("does not stomp an explicit sort when the passage filter is cleared", async () => {
      const { getByText, getByLabelText, onApply } = await renderPassageSheet();
      await fireEvent.press(getByText("Oldest First"));
      await fireEvent.press(getByText("Clear passage"));
      await fireEvent.press(getByLabelText("Apply"));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({ sortOn: "createdAt", sortDirection: "ascending" })
      );
    });

    async function renderPassageSheet() {
      const onApply = jest.fn();
      return {
        onApply,
        ...(await renderWithProviders(
          <NotesQuerySheet
            visible
            appliedQuery={passageQuery}
            onApply={onApply}
            onClose={jest.fn()}
          />
        )),
      };
    }
  });
});
