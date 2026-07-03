import { Bible } from "@mybiblelog/shared";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import { NoteEditorModal } from "./NoteEditorModal";

const passage = {
  startVerseId: Bible.makeVerseId(64, 1, 1),
  endVerseId: Bible.makeVerseId(64, 1, Bible.getChapterVerseCount(64, 1)),
};

beforeEach(() => {
  useTagsStore.setState({ state: { status: "ready", tags: [] }, sortOrder: "label:ascending" });
});

describe("NoteEditorModal initialPassages", () => {
  it("prefills a new note with the given passage", () => {
    const onSubmit = jest.fn();
    const { getByText } = renderWithProviders(
      <NoteEditorModal
        visible
        initialPassages={[passage]}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    expect(getByText("New Note")).toBeTruthy();
    expect(
      getByText(Bible.displayVerseRange(passage.startVerseId, passage.endVerseId))
    ).toBeTruthy();

    fireEvent.press(getByText("Save"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ passages: [passage], content: "", tags: [] })
    );
  });

  it("treats the prefilled draft as clean — closing does not prompt to discard", () => {
    const onClose = jest.fn();
    const { getByText, queryByText } = renderWithProviders(
      <NoteEditorModal visible initialPassages={[passage]} onClose={onClose} onSubmit={jest.fn()} />
    );

    fireEvent.press(getByText("Close"));
    expect(queryByText("Discard changes?")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
