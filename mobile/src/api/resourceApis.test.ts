jest.mock("@/src/api/httpClient", () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import { httpClient } from "@/src/api/httpClient";
import { submitFeedback } from "./feedbackApi";
import {
  createNote,
  deleteNote,
  fetchNoteCountsByBook,
  fetchNotesPage,
  updateNote,
} from "./notesApi";
import { deleteAccount, getSettings, updateSettings } from "./settingsApi";
import { createTag, deleteTag, fetchTags, updateTag } from "./tagsApi";

// The request/response logic lives in `@mybiblelog/shared` and is tested there;
// these only pin that each binding goes through the mobile `httpClient`.
const mocked = httpClient as jest.Mocked<typeof httpClient>;

beforeEach(() => {
  jest.clearAllMocks();
  mocked.get.mockResolvedValue({ data: { id: "1" } });
  mocked.post.mockResolvedValue({ data: { id: "1" } });
  mocked.patch.mockResolvedValue({ data: { id: "1" } });
  mocked.delete.mockResolvedValue({ data: true });
});

it.each([
  [
    "fetchNotesPage",
    () => fetchNotesPage({ limit: 10 } as never),
    "get",
    "/api/passage-notes?limit=10",
  ],
  ["fetchNoteCountsByBook", () => fetchNoteCountsByBook(), "get", "/api/passage-notes/count/books"],
  [
    "createNote",
    () => createNote({ content: "c", passages: [], tags: [] }),
    "post",
    "/api/passage-notes",
  ],
  [
    "updateNote",
    () => updateNote({ id: "1", content: "c", passages: [], tags: [] }),
    "patch",
    "/api/passage-notes/1",
  ],
  ["deleteNote", () => deleteNote("1"), "delete", "/api/passage-notes/1"],
  ["fetchTags", () => fetchTags(), "get", "/api/passage-note-tags"],
  [
    "createTag",
    () => createTag({ label: "l", color: "#000", description: "" }),
    "post",
    "/api/passage-note-tags",
  ],
  [
    "updateTag",
    () => updateTag({ id: "1", label: "l", color: "#000", description: "" }),
    "patch",
    "/api/passage-note-tags/1",
  ],
  ["deleteTag", () => deleteTag("1"), "delete", "/api/passage-note-tags/1"],
  ["getSettings", () => getSettings(), "get", "/api/settings"],
  ["updateSettings", () => updateSettings({ locale: "es" }), "patch", "/api/settings"],
  ["deleteAccount", () => deleteAccount(), "delete", "/api/settings/account"],
  [
    "submitFeedback",
    () => submitFeedback({ email: "a@b.com", kind: "bug", message: "m" }),
    "post",
    "/api/feedback",
  ],
] as const)("%s calls httpClient.%s", async (_name, call, method, path) => {
  await call();
  expect(mocked[method]).toHaveBeenCalledWith(
    path,
    ...(method === "get" || method === "delete" ? [] : [expect.anything()])
  );
});
