jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn(),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
}));
jest.mock("@/src/stores/userSettings", () => ({
  useUserSettingsStore: { getState: jest.fn(() => ({ state: { status: "loading" } })) },
  userSettingsActions: {
    setLocalSettings: jest.fn().mockResolvedValue(undefined),
    updateServerSettings: jest.fn().mockResolvedValue(true),
  },
}));

import { createTag, deleteTag, fetchTags, type PassageNoteTag } from "@/src/api/tagsApi";
import { userSettingsActions, useUserSettingsStore } from "@/src/stores/userSettings";
import { useTagsStore } from "./passageNoteTags";

const actions = () => useTagsStore.getState();

const tag = (id: string, label: string, noteCount = 0): PassageNoteTag => ({
  id,
  label,
  color: "#00aaf9",
  description: "",
  noteCount,
});

function setReady(tags: PassageNoteTag[]) {
  useTagsStore.setState({ state: { status: "ready", tags } });
}

beforeEach(() => {
  useTagsStore.setState({ state: { status: "idle" }, sortOrder: "label:ascending" });
});

describe("loadTags", () => {
  it("loads and sorts tags by the current sort order", async () => {
    (fetchTags as jest.Mock).mockResolvedValue([tag("1", "zebra"), tag("2", "apple")]);
    await actions().loadTags();
    const state = useTagsStore.getState().state;
    expect(state.status === "ready" && state.tags.map((t) => t.label)).toEqual(["apple", "zebra"]);
  });

  it("hydrates the sort order from user settings", async () => {
    (useUserSettingsStore.getState as jest.Mock).mockReturnValue({
      state: {
        status: "ready",
        settings: { passageNoteTagSortOrder: "noteCount:descending" },
      },
    });
    (fetchTags as jest.Mock).mockResolvedValue([tag("1", "a", 1), tag("2", "b", 5)]);

    await actions().loadTags();

    expect(useTagsStore.getState().sortOrder).toBe("noteCount:descending");
    const state = useTagsStore.getState().state;
    expect(state.status === "ready" && state.tags.map((t) => t.label)).toEqual(["b", "a"]);
  });

  it("keeps the loaded list when a refresh fails", async () => {
    setReady([tag("1", "kept")]);
    (fetchTags as jest.Mock).mockRejectedValue(new Error("offline"));
    await actions().loadTags();
    const state = useTagsStore.getState().state;
    expect(state.status === "ready" && state.tags.map((t) => t.label)).toEqual(["kept"]);
  });
});

describe("setSortOrder", () => {
  it("resorts and persists to user settings", async () => {
    setReady([tag("1", "a", 1), tag("2", "b", 5)]);
    await actions().setSortOrder("noteCount:descending");

    const state = useTagsStore.getState().state;
    expect(state.status === "ready" && state.tags.map((t) => t.label)).toEqual(["b", "a"]);
    expect(userSettingsActions.setLocalSettings).toHaveBeenCalledWith({
      passageNoteTagSortOrder: "noteCount:descending",
    });
    expect(userSettingsActions.updateServerSettings).toHaveBeenCalledWith({
      passageNoteTagSortOrder: "noteCount:descending",
    });
  });

  it("does not persist when persist is false", async () => {
    await actions().setSortOrder("color:hue", { persist: false });
    expect(userSettingsActions.updateServerSettings).not.toHaveBeenCalled();
  });
});

describe("mutations", () => {
  it("create returns the created tag and inserts it sorted", async () => {
    (createTag as jest.Mock).mockResolvedValue(tag("3", "middle"));
    setReady([tag("1", "apple"), tag("2", "zebra")]);

    const created = await actions().create({ label: "middle", color: "#00aaf9", description: "" });

    expect(created).toEqual(tag("3", "middle"));
    const state = useTagsStore.getState().state;
    expect(state.status === "ready" && state.tags.map((t) => t.label)).toEqual([
      "apple",
      "middle",
      "zebra",
    ]);
  });

  it("remove drops the tag on success", async () => {
    (deleteTag as jest.Mock).mockResolvedValue(true);
    setReady([tag("1", "a"), tag("2", "b")]);

    const removed = await actions().remove("1");

    expect(removed).toBe(true);
    const state = useTagsStore.getState().state;
    expect(state.status === "ready" && state.tags.map((t) => t.id)).toEqual(["2"]);
  });
});
