import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import type { PassageNoteTag } from "@/src/api/tagsApi";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import { TagSelectorSheet } from "./TagSelectorSheet";

const tag = (id: string, label: string): PassageNoteTag => ({
  id,
  label,
  color: "#00aaf9",
  description: "",
  noteCount: 0,
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
  setTags([]);
  signIn();
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
});

const render = (props: Partial<React.ComponentProps<typeof TagSelectorSheet>> = {}) =>
  renderWithProviders(
    <TagSelectorSheet
      visible
      selectedTagIds={[]}
      allowCreate
      onDone={jest.fn()}
      onClose={jest.fn()}
      {...props}
    />
  );

describe("TagSelectorSheet", () => {
  it("offers tag creation when signed in and online", () => {
    const { getByTestId, getByText } = render();
    expect(getByTestId("tag-selector.create")).toBeTruthy();
    expect(getByText("No tags yet. Create your first tag.")).toBeTruthy();
  });

  it("hides the create button for the query-filter use (allowCreate off)", () => {
    const { queryByTestId } = render({ allowCreate: false });
    expect(queryByTestId("tag-selector.create")).toBeNull();
    expect(queryByTestId("tag-selector.blocked-notice")).toBeNull();
  });

  // The trap this guards: offline, tags can't be created (they have no offline
  // mutation queue) and the loaded list is empty — so the default copy would
  // invite the user to "create your first tag" and then lose their input.
  describe("when tags can't be created", () => {
    it("withdraws creation and reassures the user the note still saves", () => {
      useConnectivityStore.setState({ isOnline: false, apiReachable: null });

      const { getByText, queryByTestId } = render();

      expect(queryByTestId("tag-selector.create")).toBeNull();
      expect(
        getByText(
          "Tags aren’t available offline. Your note will still be saved and synced when you reconnect."
        )
      ).toBeTruthy();
      // The empty-list copy already carries the reason — don't say it twice.
      expect(queryByTestId("tag-selector.blocked-notice")).toBeNull();
    });

    it("explains the missing Create button when there are still tags to pick", () => {
      setTags([tag("t1", "Prayer")]);
      useConnectivityStore.setState({ isOnline: false, apiReachable: null });

      const { getByTestId, getByText, queryByTestId } = render();

      expect(queryByTestId("tag-selector.create")).toBeNull();
      expect(getByTestId("tag-selector.blocked-notice")).toBeTruthy();
      expect(getByText("Creating tags requires an internet connection.")).toBeTruthy();
    });

    it("never shows the misleading empty-account copy", () => {
      useConnectivityStore.setState({ isOnline: false, apiReachable: null });
      const { queryByText } = render();
      expect(queryByText("No tags yet. Create your first tag.")).toBeNull();
    });

    it("blames sign-in, not the network, when signed out but online", () => {
      setTags([tag("t1", "Prayer")]);
      useAuthStore.setState({ state: { status: "unauthenticated" } });

      const { getByText, queryByText, queryByTestId } = render();

      expect(queryByTestId("tag-selector.create")).toBeNull();
      expect(getByText("Sign in to create and use tags.")).toBeTruthy();
      expect(queryByText("Creating tags requires an internet connection.")).toBeNull();
    });

    it("uses the sign-in wording in the empty-list copy too", () => {
      useAuthStore.setState({ state: { status: "unauthenticated" } });

      const { getByText } = render();

      expect(
        getByText("Sign in to use tags. Your note will still be saved on this device.")
      ).toBeTruthy();
    });

    it("still lets already-loaded tags be selected", () => {
      setTags([tag("t1", "Prayer")]);
      useConnectivityStore.setState({ isOnline: false, apiReachable: null });
      const onDone = jest.fn();

      const { getByText } = render({ onDone });

      fireEvent.press(getByText("Prayer"));
      fireEvent.press(getByText("Done"));
      expect(onDone).toHaveBeenCalledWith(["t1"]);
    });
  });
});
