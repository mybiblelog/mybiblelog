import {
  createPassageNote,
  deletePassageNote,
  fetchBookNoteCounts,
  fetchPassageNotesPage,
  updatePassageNote,
  type PassageNote,
  type PassageNoteInput,
  type PassageNotesPageMeta,
  type PassageNotesQuery,
} from "@mybiblelog/shared";
import { httpClient } from "@/src/api/httpClient";

export const fetchNotesPage = (
  query: PassageNotesQuery
): Promise<{ notes: PassageNote[]; meta: PassageNotesPageMeta }> =>
  fetchPassageNotesPage(httpClient, query);

export const fetchNoteCountsByBook = (): Promise<Record<number, number>> =>
  fetchBookNoteCounts(httpClient);

export const createNote = (input: PassageNoteInput): Promise<PassageNote> =>
  createPassageNote(httpClient, input);

export const updateNote = (input: PassageNoteInput & { id: string }): Promise<PassageNote> =>
  updatePassageNote(httpClient, input);

export const deleteNote = (id: string): Promise<boolean> => deletePassageNote(httpClient, id);
