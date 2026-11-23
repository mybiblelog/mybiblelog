import type { HttpClient } from '../platform/http-client.js';

// Server constraints (api/validation/schemas/feedback.ts).
export const FEEDBACK_MESSAGE_MAX_LENGTH = 1500;

export type FeedbackKind = 'bug' | 'feature' | 'comment';

export type FeedbackInput = {
  email: string;
  kind: FeedbackKind;
  message: string;
};

/** Auth is optional server-side: a session (if any) links the feedback to the user. */
export const postFeedback = async (
  http: HttpClient,
  { email, kind, message }: FeedbackInput,
): Promise<void> => {
  await http.post('/api/feedback', { email, kind, message });
};
