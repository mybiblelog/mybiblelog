import { httpClient } from "@/src/api/httpClient";

// Server constraints (api/validation/schemas/passage-note-tag.ts):
// label trimmed 1-32 chars, color hex (#rgb/#rrggbb), description <= 1500 chars.
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

export type TagInput = {
  label: string;
  color: string;
  description: string;
};

export function parseApiPassageNoteTag(value: unknown): PassageNoteTag | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.id === undefined || v.id === null) return null;
  return {
    id: String(v.id),
    label: typeof v.label === "string" ? v.label : "",
    color: typeof v.color === "string" ? v.color : "#000000",
    description: typeof v.description === "string" ? v.description : "",
    noteCount: Number.isFinite(Number(v.noteCount)) ? Number(v.noteCount) : 0,
    createdAt: typeof v.createdAt === "string" ? v.createdAt : undefined,
  };
}

export async function fetchTags(): Promise<PassageNoteTag[]> {
  const { data } = await httpClient.get<unknown>("/api/passage-note-tags");
  if (!Array.isArray(data)) return [];
  return data.map(parseApiPassageNoteTag).filter((tag): tag is PassageNoteTag => tag !== null);
}

export async function createTag(input: TagInput): Promise<PassageNoteTag> {
  const { data } = await httpClient.post<unknown>("/api/passage-note-tags", input);
  const parsed = parseApiPassageNoteTag(data);
  if (!parsed) throw new Error("POST /passage-note-tags returned unexpected payload");
  return parsed;
}

export async function updateTag(input: TagInput & { id: string }): Promise<PassageNoteTag> {
  const { data } = await httpClient.put<unknown>(`/api/passage-note-tags/${input.id}`, input);
  const parsed = parseApiPassageNoteTag(data);
  if (!parsed) throw new Error("PUT /passage-note-tags returned unexpected payload");
  return parsed;
}

export async function deleteTag(id: string): Promise<boolean> {
  const { data } = await httpClient.delete<unknown>(`/api/passage-note-tags/${id}`);
  return Boolean(data);
}
