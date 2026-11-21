import { postFeedback, type FeedbackInput } from "@mybiblelog/shared";
import { httpClient } from "@/src/api/httpClient";

/** Auth is optional server-side: a bearer token (if any) links the feedback to the user. */
export const submitFeedback = (input: FeedbackInput): Promise<void> =>
  postFeedback(httpClient, input);
