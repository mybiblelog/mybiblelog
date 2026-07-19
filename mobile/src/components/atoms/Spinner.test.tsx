import { Spinner } from "./Spinner";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

// The rotation animates via Reanimated; under the jest mock the component
// still renders without throwing. These tests assert the size prop resolves
// to the expected dimensions.
describe("Spinner", () => {
  it("renders without throwing", () => {
    expect(() => renderWithProviders(<Spinner />)).not.toThrow();
  });

  it("sizes small by default", () => {
    const { UNSAFE_root } = renderWithProviders(<Spinner />);
    const svg = UNSAFE_root.findByProps({ width: 20, height: 20 });
    expect(svg).toBeTruthy();
  });

  it("sizes up when size='large'", () => {
    const { UNSAFE_root } = renderWithProviders(<Spinner size="large" />);
    const svg = UNSAFE_root.findByProps({ width: 36, height: 36 });
    expect(svg).toBeTruthy();
  });
});
