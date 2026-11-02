import { StyleSheet } from "react-native";
import { SegmentBar, type SegmentBarSegment } from "./SegmentBar";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

async function renderSegments(segments: SegmentBarSegment[]) {
  const { container } = await renderWithProviders(<SegmentBar segments={segments} />);
  // The bar is the clipped track View under the provider wrappers; its children
  // are the rendered segments.
  const [bar] = container.queryAll(
    (node) => node.type === "View" && StyleSheet.flatten(node.props.style)?.overflow === "hidden"
  );
  return bar?.children ?? [];
}

describe("SegmentBar", () => {
  it("renders one view per positive-count segment", async () => {
    const segments = [
      { startVerseId: 1, read: true, verseCount: 10 },
      { startVerseId: 2, read: false, verseCount: 5 },
    ];
    expect(await renderSegments(segments)).toHaveLength(2);
  });

  it("filters out zero, non-finite, and negative verse counts", async () => {
    const segments = [
      { startVerseId: 1, read: true, verseCount: 10 },
      { startVerseId: 2, read: false, verseCount: 0 },
      { startVerseId: 3, read: false, verseCount: Infinity },
      { startVerseId: 4, read: true, verseCount: -3 },
    ];
    expect(await renderSegments(segments)).toHaveLength(1);
  });

  it("renders an empty bar for no segments", async () => {
    expect(await renderSegments([])).toHaveLength(0);
  });
});
