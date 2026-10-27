import { ProgressBar } from "./ProgressBar";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

// The fill width animates via Reanimated; under the jest mock the component
// still renders a track + fill without throwing. These tests assert it handles
// out-of-range and non-finite progress without crashing.
describe("ProgressBar", () => {
  it("renders for a normal progress value", async () => {
    await expect(renderWithProviders(<ProgressBar progress={0.5} />)).resolves.toBeDefined();
  });

  it("clamps and tolerates out-of-range and non-finite values", async () => {
    await expect(renderWithProviders(<ProgressBar progress={-1} />)).resolves.toBeDefined();
    await expect(renderWithProviders(<ProgressBar progress={5} />)).resolves.toBeDefined();
    await expect(renderWithProviders(<ProgressBar progress={NaN} />)).resolves.toBeDefined();
  });
});
