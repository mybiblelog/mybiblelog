import { Svg } from "react-native-svg";
import { Spinner } from "./Spinner";
import { getAllByComponentType, renderWithProviders } from "@/src/test-utils/renderWithProviders";

const svgsOfSize = (size: number) =>
  getAllByComponentType(Svg).filter((svg) => svg.props.width === size && svg.props.height === size);

// The rotation animates via Reanimated; under the jest mock the component
// still renders without throwing. These tests assert the size prop resolves
// to the expected dimensions.
describe("Spinner", () => {
  it("renders without throwing", async () => {
    await expect(renderWithProviders(<Spinner />)).resolves.toBeDefined();
  });

  it("sizes small by default", async () => {
    await renderWithProviders(<Spinner />);
    expect(svgsOfSize(20)).toHaveLength(1);
  });

  it("sizes up when size='large'", async () => {
    await renderWithProviders(<Spinner size="large" />);
    expect(svgsOfSize(36)).toHaveLength(1);
  });
});
