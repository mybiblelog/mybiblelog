jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  createTag: jest.fn(),
  updateTag: jest.fn(),
}));

import { ApiError } from "@/src/api/apiError";
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

  // Tags have no offline queue, so a dropped connection is the likely failure
  // here — a flat "unable to save" would leave the user with nothing to act on.
  it("names the connection as the reason when the save fails offline", async () => {
    (createTag as jest.Mock).mockRejectedValue(new ApiError({ code: "network_error", errors: [] }));
    const onClose = jest.fn();
    const { getByLabelText, getByPlaceholderText, findByText } = renderWithProviders(
      <TagEditorSheet visible onClose={onClose} />
    );

    fireEvent.changeText(getByPlaceholderText("Tag name"), "Prayer");
    fireEvent.press(getByLabelText("Save"));

    expect(
      await findByText("Can't reach the server. Please check your connection and try again.")
    ).toBeTruthy();
    // The sheet stays open so the typed-in tag isn't thrown away.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("falls back to the generic message for an unrecognized failure", async () => {
    (createTag as jest.Mock).mockRejectedValue(new Error("boom"));
    const { getByLabelText, getByPlaceholderText, findByText } = renderWithProviders(
      <TagEditorSheet visible onClose={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("Tag name"), "Prayer");
    fireEvent.press(getByLabelText("Save"));

    expect(await findByText("Unable to save the tag.")).toBeTruthy();
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
