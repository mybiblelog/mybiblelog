import type { Segment } from './core/encoding';

/**
 * A reading `Segment` annotated with the share of a total it represents,
 * expressed as a percentage. This is the shape a segmented progress bar wants:
 * the widths of all segments over the same total sum to 100.
 */
export type SegmentWithPercentage = Segment & { percentage: number };

/**
 * Annotates each segment with its width as a percentage of `totalVerses`.
 * The Bible/book/chapter report views all render the same `generate*Segments`
 * output this way, so the arithmetic lives here rather than duplicated per view.
 */
export const withSegmentPercentages = (
  segments: ReadonlyArray<Readonly<Segment>>,
  totalVerses: number,
): SegmentWithPercentage[] =>
  segments.map(segment => ({
    ...segment,
    percentage: totalVerses ? segment.verseCount * 100 / totalVerses : 0,
  }));
