import type { HttpClient } from '../platform/http-client.js';

// Server constraints (api/validation/schemas/passage-note-tag.ts).
export const TAG_LABEL_MAX_LENGTH = 32;
export const TAG_DESCRIPTION_MAX_LENGTH = 1500;

export type PassageNoteTag = {
  id: string;
  label: string;
  color: string;
  description: string;
  noteCount: number;
  createdAt?: string;
};

export type PassageNoteTagInput = {
  label: string;
  color: string;
  description: string;
};

export type UpdatePassageNoteTagInput = PassageNoteTagInput & { id: string };

export function parsePassageNoteTag(value: unknown): PassageNoteTag | null {
  if (!value || typeof value !== 'object') { return null; }
  const v = value as Record<string, unknown>;
  if (v.id === undefined || v.id === null) { return null; }
  return {
    id: String(v.id),
    label: typeof v.label === 'string' ? v.label : '',
    color: typeof v.color === 'string' ? v.color : '#000000',
    description: typeof v.description === 'string' ? v.description : '',
    noteCount: Number.isFinite(Number(v.noteCount)) ? Number(v.noteCount) : 0,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : undefined,
  };
}

const requirePassageNoteTag = (value: unknown, request: string): PassageNoteTag => {
  const parsed = parsePassageNoteTag(value);
  if (!parsed) { throw new Error(`${request} returned unexpected payload`); }
  return parsed;
};

export const fetchPassageNoteTags = async (http: HttpClient): Promise<PassageNoteTag[]> => {
  const { data } = await http.get<unknown>('/api/passage-note-tags');
  if (!Array.isArray(data)) { return []; }
  return data.map(parsePassageNoteTag).filter((tag): tag is PassageNoteTag => tag !== null);
};

export const createPassageNoteTag = async (
  http: HttpClient,
  { label, color, description }: PassageNoteTagInput,
): Promise<PassageNoteTag> => {
  const { data } = await http.post<unknown>('/api/passage-note-tags', { label, color, description });
  return requirePassageNoteTag(data, 'POST /passage-note-tags');
};

export const updatePassageNoteTag = async (
  http: HttpClient,
  { id, label, color, description }: UpdatePassageNoteTagInput,
): Promise<PassageNoteTag> => {
  const { data } = await http.patch<unknown>(`/api/passage-note-tags/${id}`, { label, color, description });
  return requirePassageNoteTag(data, 'PATCH /passage-note-tags');
};

export const deletePassageNoteTag = async (http: HttpClient, id: string): Promise<boolean> => {
  const { data } = await http.delete<unknown>(`/api/passage-note-tags/${id}`);
  return Boolean(data);
};
