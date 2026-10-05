import { StyleSheet } from "react-native";
import { Button } from "@/src/components";
import { colorsByScheme, spacing } from "@/src/design";
import { act, fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";
import { useToast, type ToastType } from "./ToastProvider";

function Trigger({ type }: { type: ToastType }) {
  const { showToast } = useToast();
  return <Button label="show" onPress={() => showToast({ type, message: "Heads up" })} />;
}

function ProminentTrigger({ durationMs }: { durationMs?: number | null }) {
  const { showToast } = useToast();
  return (
    <Button
      label="show"
      onPress={() => showToast({ type: "info", message: "Heads up", prominent: true, durationMs })}
    />
  );
}

function show(type: ToastType, scheme: "light" | "dark") {
  renderWithProviders(<Trigger type={type} />, { scheme });
  fireEvent.press(screen.getByText("show"));
}

function showProminent(durationMs?: number | null) {
  renderWithProviders(<ProminentTrigger durationMs={durationMs} />);
  fireEvent.press(screen.getByText("show"));
}

const flatten = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, unknown>;

describe("ToastProvider", () => {
  it.each([
    ["info", "info"],
    ["success", "success"],
    ["error", "destructive"],
  ] as const)("fills a %s toast with its intent color in dark mode", (type, role) => {
    // The regression this guards: `info` used to paint itself `surface`, which
    // is all but invisible against the dark canvas.
    show(type, "dark");
    expect(flatten("toast.container").backgroundColor).toBe(colorsByScheme.dark[role]);
    expect(flatten("toast.message").color).toBe("#ffffff");
  });

  it("keeps the corner radius with the background color", () => {
    // Android drops a registered radius on a background-only style update — see
    // the comment in the component.
    show("error", "light");
    expect(flatten("toast.container").borderRadius).toBe(16);
  });

  it("anchors to the top of the screen, clear of the keyboard", () => {
    show("error", "light");
    const wrap = flatten("toast.wrap");
    expect(wrap.top).toBe(spacing.xs); // safe-area top is 0 in tests
    expect(wrap.bottom).toBeUndefined();
  });

  describe("prominent toasts", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      act(() => jest.runOnlyPendingTimers());
      jest.useRealTimers();
    });

    it("does not auto-dismiss when durationMs is null", () => {
      showProminent(null);
      expect(screen.getByTestId("toast.message")).toBeTruthy();
      act(() => jest.advanceTimersByTime(60_000));
      expect(screen.getByTestId("toast.message")).toBeTruthy();
    });

    it("shows a close button that dismisses it", () => {
      showProminent(null);
      fireEvent.press(screen.getByTestId("toast.close"));
      act(() => jest.advanceTimersByTime(1000)); // let the fade-out finish
      expect(screen.queryByTestId("toast.message")).toBeNull();
    });

    it("uses more generous padding and a larger, left-aligned message than the compact toast", () => {
      showProminent(null);
      const container = flatten("toast.container");
      const text = flatten("toast.message");
      expect(container.paddingHorizontal).toBe(spacing.lg);
      expect(text.fontSize).toBeGreaterThan(14);
      expect(text.textAlign).toBe("left");
    });
  });

  it("does not show a close button on the compact (non-prominent) toast", () => {
    show("info", "light");
    expect(screen.queryByTestId("toast.close")).toBeNull();
  });
});
