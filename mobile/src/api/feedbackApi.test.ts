import { httpClient } from "@/src/api/httpClient";
import { submitFeedback } from "./feedbackApi";

jest.mock("@/src/api/httpClient", () => ({ httpClient: { post: jest.fn() } }));

describe("submitFeedback", () => {
  it("posts the feedback body to /api/feedback", async () => {
    (httpClient.post as jest.Mock).mockResolvedValue({ data: {} });
    const input = { email: "a@b.com", kind: "bug" as const, message: "Broken" };
    await submitFeedback(input);
    expect(httpClient.post).toHaveBeenCalledWith("/api/feedback", input);
  });

  it("propagates failures", async () => {
    (httpClient.post as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(
      submitFeedback({ email: "a@b.com", kind: "comment", message: "x" })
    ).rejects.toThrow("boom");
  });
});
