jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import { Linking } from "react-native";
import { act, fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import AboutSettings from "@/app/(tabs)/settings/about";

describe("About settings screen", () => {
  it("shows an error toast when opening a link fails", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockRejectedValueOnce(new Error("cannot open"));
    const { getByText } = renderWithProviders(<AboutSettings />);

    await act(async () => {
      fireEvent.press(getByText("Privacy Policy"));
    });

    expect(openURL).toHaveBeenCalledWith("https://www.mybiblelog.com/policy/privacy");
    expect(getByText("Unable to open link.")).toBeTruthy();
  });

  it("opens the link and shows no error toast when it succeeds", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValueOnce(undefined as never);
    const { getByText, queryByText } = renderWithProviders(<AboutSettings />);

    await act(async () => {
      fireEvent.press(getByText("Terms and Conditions"));
    });

    expect(openURL).toHaveBeenCalledWith("https://www.mybiblelog.com/policy/terms");
    expect(queryByText("Unable to open link.")).toBeNull();
  });
});
