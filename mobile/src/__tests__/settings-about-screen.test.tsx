jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { appStorage } from "@/src/storage/keys";
import { __resetDevMenuCacheForTest } from "@/src/dev/devToolsButton";
import AboutSettings from "@/app/(tabs)/settings/about";

const devMenu = require("expo-dev-menu") as { setToolsButtonVisible?: jest.Mock };
const setToolsButtonVisible = devMenu.setToolsButtonVisible!;

beforeEach(async () => {
  devMenu.setToolsButtonVisible = setToolsButtonVisible;
  setToolsButtonVisible.mockClear();
  __resetDevMenuCacheForTest();
  appStorage.__resetForTest();
  await AsyncStorage.clear();
});

describe("About screen dev tools button toggle", () => {
  it("hides the floating button and flips its label", async () => {
    const { getByTestId, getByText } = renderWithProviders(<AboutSettings />);

    fireEvent.press(getByTestId("about.devToolsButtonToggle"));

    expect(setToolsButtonVisible).toHaveBeenCalledWith(false);
    await waitFor(() => expect(getByText("Show Dev Tools Button (Dev)")).toBeTruthy());
  });

  it("starts from the persisted preference", async () => {
    await AsyncStorage.setItem("devToolsButtonVisible.v1", JSON.stringify(false));

    const { getByText, getByTestId } = renderWithProviders(<AboutSettings />);

    await waitFor(() => expect(getByText("Show Dev Tools Button (Dev)")).toBeTruthy());

    fireEvent.press(getByTestId("about.devToolsButtonToggle"));
    expect(setToolsButtonVisible).toHaveBeenCalledWith(true);
  });

  it("explains itself when the dev menu has no toggle", async () => {
    delete devMenu.setToolsButtonVisible;
    __resetDevMenuCacheForTest();

    const { getByTestId, getByText } = renderWithProviders(<AboutSettings />);

    fireEvent.press(getByTestId("about.devToolsButtonToggle"));

    await waitFor(() => expect(getByText(/no toggle for the floating button/)).toBeTruthy());
  });
});
