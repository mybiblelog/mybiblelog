import { SegmentBar, type SegmentBarSegment } from "./SegmentBar";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

function renderSegments(segments: SegmentBarSegment[]) {
  const tree = renderWithProviders(<SegmentBar segments={segments} />).toJSON();
  // The bar is a single View; its children are the rendered segments.
  const root = Array.isArray(tree) ? tree[0] : tree;
  const children = root?.children ?? [];
  return Array.isArray(children) ? children : [children];
}

describe("SegmentBar", () => {
  it("renders one view per positive-count segment", () => {
    const segments = [
      { startVerseId: 1, read: true, verseCount: 10 },
      { startVerseId: 2, read: false, verseCount: 5 },
    ];
    expect(renderSegments(segments)).toHaveLength(2);
  });

  it("filters out zero, non-finite, and negative verse counts", () => {
    const segments = [
      { startVerseId: 1, read: true, verseCount: 10 },
      { startVerseId: 2, read: false, verseCount: 0 },
      { startVerseId: 3, read: false, verseCount: Infinity },
      { startVerseId: 4, read: true, verseCount: -3 },
    ];
    expect(renderSegments(segments)).toHaveLength(1);
  });

  it("renders an empty bar for no segments", () => {
    expect(renderSegments([])).toHaveLength(0);
  });
});
