jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

const mockDeleteAccount = jest.fn();
jest.mock("@/src/api/settingsApi", () => ({
  ...jest.requireActual("@/src/api/settingsApi"),
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...(args as [])),
}));

import type { TestInstance } from "test-renderer";
import { router } from "expo-router";
import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import DeleteAccountScreen from "@/app/(tabs)/settings/delete-account";

const logout = jest.fn(async () => {});

const LOG_ENTRIES_CHECK = "I understand that this will delete all of my log entry data.";
const NOTES_CHECK = "I understand that this will delete all of my notes and tags.";
const PERMANENT_CHECK = "I understand that this action is permanent and cannot be reversed.";
const CONFIRM_LABEL = "Delete my account";

function seed() {
  useAuthStore.setState({
    state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    logout,
  });
}

async function checkAll(getByText: (text: string) => TestInstance) {
  await fireEvent.press(getByText(LOG_ENTRIES_CHECK));
  await fireEvent.press(getByText(NOTES_CHECK));
  await fireEvent.press(getByText(PERMANENT_CHECK));
}

beforeEach(() => {
  logout.mockClear();
  mockDeleteAccount.mockReset();
  (router.replace as jest.Mock).mockClear();
  seed();
});

describe("Delete account screen", () => {
  it("keeps the confirm button disabled until all three checkboxes are checked", async () => {
    const { getByText, getByRole } = await renderWithProviders(<DeleteAccountScreen />);
    const confirmButton = () => getByRole("button", { name: CONFIRM_LABEL });

    expect(confirmButton().props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(getByText(LOG_ENTRIES_CHECK));
    expect(confirmButton().props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(getByText(NOTES_CHECK));
    expect(confirmButton().props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(getByText(PERMANENT_CHECK));
    expect(confirmButton().props.accessibilityState?.disabled).toBe(false);
  });

  it("deletes the account, logs out, and navigates away on success", async () => {
    mockDeleteAccount.mockResolvedValue(undefined);
    const { getByText, getAllByText } = await renderWithProviders(<DeleteAccountScreen />);

    await checkAll(getByText);
    await fireEvent.press(getByText(CONFIRM_LABEL));

    // The ConfirmDialog reuses the same label; press the dialog's copy (last one).
    const confirmButtons = getAllByText(CONFIRM_LABEL);
    await act(async () => {
      await fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    });

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
      expect(logout).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/settings");
    });
  });

  it("shows an error toast and leaves the screen usable when deleteAccount fails", async () => {
    mockDeleteAccount.mockRejectedValue(new Error("nope"));
    const { getByText, getAllByText, getByTestId, getByRole } = await renderWithProviders(
      <DeleteAccountScreen />
    );

    await checkAll(getByText);
    await fireEvent.press(getByText(CONFIRM_LABEL));

    const confirmButtons = getAllByText(CONFIRM_LABEL);
    await act(async () => {
      await fireEvent.press(confirmButtons[confirmButtons.length - 1]);
    });

    await waitFor(() => {
      expect(getByTestId("toast.message").props.children).toBe(
        "Unable to delete account. Please try again later."
      );
    });
    expect(logout).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();

    // isDeleting reset: the confirm button is interactive again (not stuck
    // loading/disabled). Wait out the dialog's close animation first, or its
    // copy of the label still matches.
    await waitFor(() => expect(getAllByText(CONFIRM_LABEL)).toHaveLength(1));
    expect(getByRole("button", { name: CONFIRM_LABEL }).props.accessibilityState?.disabled).toBe(
      false
    );
  });
});
