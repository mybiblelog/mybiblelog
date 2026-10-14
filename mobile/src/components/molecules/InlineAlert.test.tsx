import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test-utils/renderWithProviders";
import { getCache, setCache } from "@/src/storage/dateVerseCountsCache";
import { InlineAlert } from "./InlineAlert";

describe("InlineAlert", () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it("calls onDismiss and hides the card when the dismiss button is pressed", () => {
    const onDismiss = jest.fn();
    renderWithProviders(
      <InlineAlert title="Heads up" dismissLabel="Dismiss" onDismiss={onDismiss} testID="alert" />
    );

    expect(screen.getByTestId("alert")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Dismiss"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("alert")).toBeNull();
  });

  it("does not render a dismiss button when dismissLabel is omitted", () => {
    renderWithProviders(<InlineAlert title="Heads up" testID="alert" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  describe("dismissKey persistence", () => {
    it("persists the dismissal via setCache under dismissKey", async () => {
      renderWithProviders(
        <InlineAlert
          title="Heads up"
          dismissLabel="Dismiss"
          dismissKey="test-alert"
          testID="alert"
        />
      );

      // The hydration gate resolves (no prior cache entry) and the card appears.
      await waitFor(() => expect(screen.getByTestId("alert")).toBeTruthy());

      fireEvent.press(screen.getByLabelText("Dismiss"));

      await waitFor(async () => {
        expect(await getCache<boolean>("test-alert")).toBe(true);
      });
    });

    it("renders null on a fresh mount when the dismissal is already cached", async () => {
      await setCache("test-alert", true, 60);

      renderWithProviders(
        <InlineAlert
          title="Heads up"
          dismissLabel="Dismiss"
          dismissKey="test-alert"
          testID="alert"
        />
      );

      await waitFor(() => expect(screen.queryByTestId("alert")).toBeNull());
      // Stays null — never flashes the card once hydration completes.
      expect(screen.queryByTestId("alert")).toBeNull();
    });
  });

  describe("hydration gate", () => {
    it("renders null until the cache check resolves when a dismissKey is set", async () => {
      renderWithProviders(
        <InlineAlert
          title="Heads up"
          dismissLabel="Dismiss"
          dismissKey="test-alert"
          testID="alert"
        />
      );

      // Synchronously after mount, the async getCache() lookup hasn't resolved yet.
      expect(screen.queryByTestId("alert")).toBeNull();

      await waitFor(() => expect(screen.getByTestId("alert")).toBeTruthy());
    });

    it("renders immediately (no gate) when no dismissKey is given", () => {
      renderWithProviders(<InlineAlert title="Heads up" testID="alert" />);
      expect(screen.getByTestId("alert")).toBeTruthy();
    });
  });

  describe("CTA layout", () => {
    it("renders a single full-width CTA when there is no secondary action", () => {
      const onPressCta = jest.fn();
      renderWithProviders(
        <InlineAlert title="Heads up" ctaLabel="Do it" onPressCta={onPressCta} testID="alert" />
      );

      fireEvent.press(screen.getByText("Do it"));
      expect(onPressCta).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/secondary/i)).toBeNull();
    });

    it("renders both CTA and secondary CTA when provided", () => {
      const onPressCta = jest.fn();
      const onPressSecondaryCta = jest.fn();
      renderWithProviders(
        <InlineAlert
          title="Heads up"
          ctaLabel="Do it"
          onPressCta={onPressCta}
          secondaryCtaLabel="Not now"
          onPressSecondaryCta={onPressSecondaryCta}
          testID="alert"
        />
      );

      fireEvent.press(screen.getByText("Do it"));
      fireEvent.press(screen.getByText("Not now"));
      expect(onPressCta).toHaveBeenCalledTimes(1);
      expect(onPressSecondaryCta).toHaveBeenCalledTimes(1);
    });

    it("omits the actions row entirely without a ctaLabel/onPressCta pair", () => {
      renderWithProviders(<InlineAlert title="Heads up" testID="alert" />);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });
});
