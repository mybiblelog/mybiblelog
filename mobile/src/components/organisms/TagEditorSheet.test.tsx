jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  createTag: jest.fn(),
  updateTag: jest.fn(),
}));

import { createTag } from "@/src/api/tagsApi";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { TAG_COLOR_PALETTE } from "@/src/notes/tagColors";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import { TagEditorSheet } from "./TagEditorSheet";

beforeEach(() => {
  useTagsStore.setState({ state: { status: "ready", tags: [] }, sortOrder: "label:ascending" });
});

describe("TagEditorSheet", () => {
  it("disables Save until a label is entered", () => {
    const { getByLabelText, getByPlaceholderText } = renderWithProviders(
      <TagEditorSheet visible onClose={jest.fn()} />
    );
    expect(getByLabelText("Save")).toBeDisabled();
    fireEvent.changeText(getByPlaceholderText("Tag name"), "Prayer");
    expect(getByLabelText("Save")).toBeEnabled();
  });

  it("saves with the selected palette color and reports the saved tag", async () => {
    (createTag as jest.Mock).mockResolvedValue({
      id: "t9",
      label: "Prayer",
      color: TAG_COLOR_PALETTE[3],
      description: "",
      noteCount: 0,
    });
    const onSaved = jest.fn();
    const { getByLabelText, getByPlaceholderText } = renderWithProviders(
      <TagEditorSheet visible onClose={jest.fn()} onSaved={onSaved} />
    );

    fireEvent.changeText(getByPlaceholderText("Tag name"), "Prayer");
    fireEvent.press(getByLabelText(TAG_COLOR_PALETTE[3]));
    fireEvent.press(getByLabelText("Save"));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createTag).toHaveBeenCalledWith({
      label: "Prayer",
      color: TAG_COLOR_PALETTE[3],
      description: "",
    });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: "t9" }));
  });

  it("keeps an off-palette color choosable when editing a web-created tag", () => {
    const { getByLabelText } = renderWithProviders(
      <TagEditorSheet
        visible
        initialTag={{ id: "t1", label: "Web", color: "#123456", description: "", noteCount: 0 }}
        onClose={jest.fn()}
      />
    );
    expect(getByLabelText("#123456")).toBeTruthy();
  });
});
