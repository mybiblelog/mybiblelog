import { ProgressBar } from "./ProgressBar";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

// The fill width animates via Reanimated; under the jest mock the component
// still renders a track + fill without throwing. These tests assert it handles
// out-of-range and non-finite progress without crashing.
describe("ProgressBar", () => {
  it("renders for a normal progress value", () => {
    expect(() => renderWithProviders(<ProgressBar progress={0.5} />)).not.toThrow();
  });

  it("clamps and tolerates out-of-range and non-finite values", () => {
    expect(() => renderWithProviders(<ProgressBar progress={-1} />)).not.toThrow();
    expect(() => renderWithProviders(<ProgressBar progress={5} />)).not.toThrow();
    expect(() => renderWithProviders(<ProgressBar progress={NaN} />)).not.toThrow();
  });
});
