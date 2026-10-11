import { httpClient } from "@/src/api/httpClient";

// Server constraints (api/validation/schemas/feedback.ts): message trimmed 1-1500 chars.
export const FEEDBACK_MESSAGE_MAX_LENGTH = 1500;

export type FeedbackKind = "bug" | "feature" | "comment";

export type FeedbackInput = {
  email: string;
  kind: FeedbackKind;
  message: string;
};

/** Auth is optional server-side: a bearer token (if any) links the feedback to the user. */
export async function submitFeedback(input: FeedbackInput): Promise<void> {
  await httpClient.post<unknown>("/api/feedback", input);
}
