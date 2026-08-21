jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn().mockResolvedValue([]),
  deleteTag: jest.fn().mockResolvedValue(true),
}));

import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { deleteTag, type PassageNoteTag } from "@/src/api/tagsApi";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
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

function signIn() {
  useAuthStore.setState({
    state: { status: "authenticated", session: { token: "t", user: { email: "a@b.c" } } },
  });
}

beforeEach(() => {
  useTagsStore.setState({ state: { status: "idle" }, sortOrder: "label:ascending" });
  // Tag creation requires a live authenticated API, so the default fixture is
  // signed in and online — the offline cases opt out explicitly.
  signIn();
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
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

  // Tags have no offline mutation queue (unlike notes and log entries), so the
  // action is withdrawn up front rather than offered and then failed.
  describe("when tags can't be created", () => {
    it("disables Create Tag and says why while the device is offline", () => {
      setTags([tag({ id: "t1", label: "Prayer" })]);
      useConnectivityStore.setState({ isOnline: false, apiReachable: null });

      const { getByTestId, getByText } = renderWithProviders(<Tags />);

      expect(getByTestId("tags.new")).toBeDisabled();
      expect(getByText("Creating tags requires an internet connection.")).toBeTruthy();
    });

    it("distinguishes an unreachable server from a dead network", () => {
      setTags([tag({ id: "t1", label: "Prayer" })]);
      useConnectivityStore.setState({ isOnline: true, apiReachable: false });

      const { getByTestId, getByText } = renderWithProviders(<Tags />);

      expect(getByTestId("tags.new")).toBeDisabled();
      expect(getByText("Creating tags requires reaching the My Bible Log server.")).toBeTruthy();
    });

    it("blames sign-in, not the network, when signed out but online", () => {
      setTags([tag({ id: "t1", label: "Prayer" })]);
      useAuthStore.setState({ state: { status: "unauthenticated" } });

      const { getByTestId, getByText, queryByText } = renderWithProviders(<Tags />);

      expect(getByTestId("tags.new")).toBeDisabled();
      expect(getByText("Sign in to create and use tags.")).toBeTruthy();
      expect(queryByText("Creating tags requires an internet connection.")).toBeNull();
    });

    it("drops the empty-state CTA so it can't be tapped either", () => {
      setTags([]);
      useConnectivityStore.setState({ isOnline: false, apiReachable: null });

      const { queryAllByText, getByText } = renderWithProviders(<Tags />);

      expect(getByText("No tags yet")).toBeTruthy();
      // Only the (disabled) toolbar button remains — the CTA is gone.
      expect(queryAllByText("Create Tag")).toHaveLength(1);
    });
  });
});
