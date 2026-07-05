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

function renderSheet(onApply = jest.fn(), onClose = jest.fn()) {
  return {
    onApply,
    onClose,
    ...renderWithProviders(
      <NotesQuerySheet
        visible
        appliedQuery={{ ...initialNotesQuery, filterTags: [] }}
        onApply={onApply}
        onClose={onClose}
      />
    ),
  };
}

describe("NotesQuerySheet", () => {
  it("disables Apply until the draft differs from the applied query", () => {
    const { getByLabelText, getByPlaceholderText } = renderSheet();
    expect(getByLabelText("Apply")).toBeDisabled();

    fireEvent.changeText(getByPlaceholderText("Search note text…"), "grace");
    expect(getByLabelText("Apply")).toBeEnabled();
  });

  it("maps 'only untagged' to exact matching with no tags", () => {
    const { getByText, getByLabelText, onApply } = renderSheet();
    fireEvent.press(getByText("Only untagged notes"));
    fireEvent.press(getByLabelText("Apply"));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ filterTagMatching: "exact", filterTags: [] })
    );
  });

  it("applies sort direction changes", () => {
    const { getByText, getByLabelText, onApply } = renderSheet();
    fireEvent.press(getByText("Oldest First"));
    fireEvent.press(getByLabelText("Apply"));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ sortDirection: "ascending" }));
  });

  it("applies page size changes", () => {
    const { getByText, getByLabelText, onApply } = renderSheet();
    fireEvent.press(getByText("50"));
    fireEvent.press(getByLabelText("Apply"));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });
});
