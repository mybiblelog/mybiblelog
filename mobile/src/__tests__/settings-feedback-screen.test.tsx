const mockBack = jest.fn();
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: () => mockBack() } }));
jest.mock("@/src/api/feedbackApi", () => ({
  ...jest.requireActual("@/src/api/feedbackApi"),
  submitFeedback: jest.fn(),
}));
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { ApiError } from "@/src/api/apiError";
import { submitFeedback } from "@/src/api/feedbackApi";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import Feedback from "@/app/(tabs)/settings/feedback";

const submit = submitFeedback as jest.Mock;

beforeEach(() => {
  submit.mockReset();
  mockBack.mockClear();
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
  useAuthStore.setState({ state: { status: "unauthenticated" } });
});

describe("Feedback screen", () => {
  it("prefills and locks the email when signed in, and submits", async () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    submit.mockResolvedValue(undefined);
    const { getByTestId, getByText } = await renderWithProviders(<Feedback />);

    const email = getByTestId("feedback.email");
    expect(email.props.value).toBe("a@b.com");
    expect(email.props.editable).toBe(false);

    await fireEvent.press(getByTestId("feedback.kind-select"));
    await fireEvent.press(getByText("Feature Request"));
    await fireEvent.changeText(getByTestId("feedback.message"), "  Add dark mode  ");
    await fireEvent.press(getByTestId("feedback.submit"));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        email: "a@b.com",
        kind: "feature",
        message: "Add dark mode",
      })
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("lets guests enter an email and validates required fields", async () => {
    const { getByTestId, getByText } = await renderWithProviders(<Feedback />);

    expect(getByTestId("feedback.email").props.editable).toBe(true);
    await fireEvent.press(getByTestId("feedback.submit"));

    expect(getByText("Please enter a valid email address.")).toBeTruthy();
    expect(getByText("Please enter your feedback.")).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();

    await fireEvent.changeText(getByTestId("feedback.email"), "guest@x.com");
    await fireEvent.changeText(getByTestId("feedback.message"), "Hi");
    await fireEvent.press(getByTestId("feedback.submit"));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ email: "guest@x.com", kind: "bug", message: "Hi" })
    );
  });

  it("shows server errors and stays on the screen", async () => {
    submit.mockRejectedValue(new ApiError({ code: "too_many_requests", errors: [] }, 429));
    const { getByTestId, findByText } = await renderWithProviders(<Feedback />);

    await fireEvent.changeText(getByTestId("feedback.email"), "guest@x.com");
    await fireEvent.changeText(getByTestId("feedback.message"), "Hi");
    await fireEvent.press(getByTestId("feedback.submit"));

    expect(await findByText("Too many requests were sent in a short amount of time")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("disables submit and explains when offline", async () => {
    useConnectivityStore.setState({ isOnline: false });
    const { getByTestId, getByText } = await renderWithProviders(<Feedback />);

    expect(getByText("You're offline. Connect to the internet to submit feedback.")).toBeTruthy();
    expect(getByTestId("feedback.submit")).toBeDisabled();
  });
});
