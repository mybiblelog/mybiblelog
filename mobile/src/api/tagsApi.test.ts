jest.mock("@/src/api/httpClient", () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import { httpClient } from "@/src/api/httpClient";
import {
  createTag,
  deleteTag,
  fetchTags,
  parseApiPassageNoteTag,
  updateTag,
} from "@/src/api/tagsApi";

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe("parseApiPassageNoteTag", () => {
  it("parses a full tag and normalizes the id to a string", () => {
    expect(
      parseApiPassageNoteTag({
        id: 7,
        label: "Prayer",
        color: "#00aaf9",
        description: "d",
        noteCount: "3",
        createdAt: "2026-01-01T00:00:00.000Z",
      })
    ).toEqual({
      id: "7",
      label: "Prayer",
      color: "#00aaf9",
      description: "d",
      noteCount: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("defaults missing fields", () => {
    expect(parseApiPassageNoteTag({ id: "a" })).toEqual({
      id: "a",
      label: "",
      color: "#000000",
      description: "",
      noteCount: 0,
      createdAt: undefined,
    });
  });

  it("returns null for non-objects and tags without ids", () => {
    expect(parseApiPassageNoteTag(null)).toBeNull();
    expect(parseApiPassageNoteTag({ label: "orphan" })).toBeNull();
  });
});

describe("fetchTags", () => {
  beforeEach(() => jest.clearAllMocks());

  it("parses an array of tags", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: [{ id: "1", label: "Prayer" }] });
    expect(await fetchTags()).toEqual([expect.objectContaining({ id: "1", label: "Prayer" })]);
  });

  it("returns an empty array when data isn't an array", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: null });
    expect(await fetchTags()).toEqual([]);
  });
});

describe("createTag", () => {
  beforeEach(() => jest.clearAllMocks());

  const input = { label: "Prayer", color: "#00aaf9", description: "" };

  it("returns the parsed tag on success", async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { id: "1", label: "Prayer" } });
    expect(await createTag(input)).toEqual(expect.objectContaining({ id: "1", label: "Prayer" }));
  });

  it("throws when the response fails parseApiPassageNoteTag", async () => {
    mockedHttpClient.post.mockResolvedValue({ data: null });
    await expect(createTag(input)).rejects.toThrow(
      "POST /passage-note-tags returned unexpected payload"
    );
  });
});

describe("updateTag", () => {
  beforeEach(() => jest.clearAllMocks());

  const input = { id: "1", label: "Prayer", color: "#00aaf9", description: "" };

  it("returns the parsed tag on success", async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { id: "1", label: "Prayer" } });
    expect(await updateTag(input)).toEqual(expect.objectContaining({ id: "1", label: "Prayer" }));
  });

  it("throws when the response fails parseApiPassageNoteTag", async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { label: "orphan" } });
    await expect(updateTag(input)).rejects.toThrow(
      "PATCH /passage-note-tags returned unexpected payload"
    );
  });
});

describe("deleteTag", () => {
  beforeEach(() => jest.clearAllMocks());

  it("coerces a truthy data field to true", async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: { ok: true } });
    expect(await deleteTag("1")).toBe(true);
  });

  it("coerces a falsy data field to false", async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: 0 });
    expect(await deleteTag("1")).toBe(false);
  });
});
