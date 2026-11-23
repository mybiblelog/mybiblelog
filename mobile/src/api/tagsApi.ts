import {
  createPassageNoteTag,
  deletePassageNoteTag,
  fetchPassageNoteTags,
  updatePassageNoteTag,
  type PassageNoteTag,
  type PassageNoteTagInput,
} from "@mybiblelog/shared";
import { httpClient } from "@/src/api/httpClient";

export const fetchTags = (): Promise<PassageNoteTag[]> => fetchPassageNoteTags(httpClient);

export const createTag = (input: PassageNoteTagInput): Promise<PassageNoteTag> =>
  createPassageNoteTag(httpClient, input);

export const updateTag = (input: PassageNoteTagInput & { id: string }): Promise<PassageNoteTag> =>
  updatePassageNoteTag(httpClient, input);

export const deleteTag = (id: string): Promise<boolean> => deletePassageNoteTag(httpClient, id);
