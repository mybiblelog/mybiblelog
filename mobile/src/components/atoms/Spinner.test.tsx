import { Spinner } from "./Spinner";
import { renderWithProviders, type TestInstance } from "@/src/test-utils/renderWithProviders";

const isSvgSized = (size: number) => (node: TestInstance) =>
  node.type === "RNSVGSvgView" && node.props.bbWidth === size && node.props.bbHeight === size;

// The rotation animates via Reanimated; under the jest mock the component
// still renders without throwing. These tests assert the size prop resolves
// to the expected dimensions.
describe("Spinner", () => {
  it("renders without throwing", async () => {
    await expect(renderWithProviders(<Spinner />)).resolves.toBeDefined();
  });

  it("sizes small by default", async () => {
    const { container } = await renderWithProviders(<Spinner />);
    expect(container.queryAll(isSvgSized(20))).toHaveLength(1);
  });

  it("sizes up when size='large'", async () => {
    const { container } = await renderWithProviders(<Spinner size="large" />);
    expect(container.queryAll(isSvgSized(36))).toHaveLength(1);
  });
});
