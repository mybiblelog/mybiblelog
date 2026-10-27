import { SegmentBar, type SegmentBarSegment } from "./SegmentBar";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

async function renderSegments(segments: SegmentBarSegment[]) {
  const tree = (await renderWithProviders(<SegmentBar segments={segments} />)).toJSON();
  // Unwrap provider wrappers (the gesture root View, then SafeAreaProvider)
  // down to the bar View; its children are the rendered segments.
  let node = Array.isArray(tree) ? tree[0] : tree;
  let insideProviders = false;
  while (node && !(insideProviders && node.type === "View")) {
    if (node.type === "RNCSafeAreaProvider") insideProviders = true;
    const next = node.children?.[0];
    if (!next || typeof next === "string") break;
    node = next;
  }
  const children = node?.children ?? [];
  return Array.isArray(children) ? children : [children];
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
