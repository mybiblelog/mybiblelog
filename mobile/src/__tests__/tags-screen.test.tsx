jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn().mockResolvedValue([]),
  deleteTag: jest.fn().mockResolvedValue(true),
}));

import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { deleteTag, type PassageNoteTag } from "@/src/api/tagsApi";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import Tags from "@/app/(tabs)/notes/tags";

const tag = (overrides: Partial<PassageNoteTag>): PassageNoteTag => ({
  id: "t1",
  label: "Prayer",
  color: "#00aaf9",
  description: "",
  noteCount: 0,
  ...overrides,
});

function setTags(tags: PassageNoteTag[]) {
  useTagsStore.setState({ state: { status: "ready", tags }, sortOrder: "label:ascending" });
}

beforeEach(() => {
  useTagsStore.setState({ state: { status: "idle" }, sortOrder: "label:ascending" });
});

describe("Tags screen", () => {
  it("renders tag rows with note counts", () => {
    setTags([
      tag({ id: "t1", label: "Prayer", noteCount: 3, description: "Prayer notes" }),
      tag({ id: "t2", label: "Sermon", noteCount: 0 }),
    ]);
    const { getByText, getAllByText } = renderWithProviders(<Tags />);
    expect(getAllByText("Prayer").length).toBeGreaterThan(0);
    expect(getByText("Prayer notes")).toBeTruthy();
    expect(getByText("3 notes")).toBeTruthy();
  });

  it("shows the empty state when there are no tags", () => {
    setTags([]);
    const { getByText } = renderWithProviders(<Tags />);
    expect(getByText("No tags yet")).toBeTruthy();
  });

  it("blocks deleting a tag that is still in use", () => {
    setTags([tag({ id: "t1", label: "Prayer", noteCount: 3 })]);
    const { getByText, getAllByText } = renderWithProviders(<Tags />);
    fireEvent.press(getAllByText("Prayer")[0]);
    fireEvent.press(getByText("Delete"));
    expect(getByText("Tag in use")).toBeTruthy();
    expect(deleteTag).not.toHaveBeenCalled();
  });

  it("confirms before deleting an unused tag", () => {
    setTags([tag({ id: "t1", label: "Prayer", noteCount: 0 })]);
    const { getByText, getAllByText } = renderWithProviders(<Tags />);
    fireEvent.press(getAllByText("Prayer")[0]);
    fireEvent.press(getByText("Delete"));
    expect(getByText("Delete tag?")).toBeTruthy();
    fireEvent.press(getAllByText("Delete")[getAllByText("Delete").length - 1]);
    expect(deleteTag).toHaveBeenCalledWith("t1");
  });

  it("opens the tag editor from the Create Tag button", () => {
    setTags([]);
    const { getByText, getAllByText } = renderWithProviders(<Tags />);
    fireEvent.press(getAllByText("Create Tag")[0]);
    expect(getByText("New Tag")).toBeTruthy();
    expect(getByText("Label")).toBeTruthy();
    expect(getByText("Color")).toBeTruthy();
  });
});
