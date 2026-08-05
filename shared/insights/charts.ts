/**
 * Pure geometry helpers for rendering line/area charts as SVG. The data series
 * itself comes from `insights.computeDailyVerseSeries` (or any `{ count }`
 * series); this module only does the coordinate math, so the same output can
 * feed a Vue `<svg>`, a React component, or a snapshot test.
 */

export type ChartSeriesPoint = {
  date: string;
  count: number;
};

export type ChartDimensions = {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
};

export type ChartPoint = {
  date: string;
  count: number;
  x: number;
  y: number;
};

export type ChartYTick = {
  value: number;
  y: number;
};

export type LineChartGeometry = {
  points: ChartPoint[];
  /** Space-separated "x,y" pairs for an SVG <polyline>. */
  linePoints: string;
  /** SVG path for a filled area below the line. */
  areaPath: string;
  yTicks: ChartYTick[];
  maxCount: number;
};

export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 720,
  height: 240,
  padLeft: 34,
  padRight: 12,
  padTop: 12,
  padBottom: 22,
};

/**
 * Maps a series of counts to plotted coordinates, a polyline string, a filled
 * area path, and evenly spaced y-axis ticks. A single point is centered
 * horizontally; an empty series yields an empty area path.
 */
export const buildLineChartGeometry = (
  series: ReadonlyArray<ChartSeriesPoint>,
  dimensions: Partial<ChartDimensions> = {},
  yTickSteps = 4,
): LineChartGeometry => {
  const { width, height, padLeft, padRight, padTop, padBottom } = {
    ...DEFAULT_CHART_DIMENSIONS,
    ...dimensions,
  };

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const maxCount = Math.max(1, ...series.map(p => p.count));
  const n = series.length;

  const points: ChartPoint[] = series.map((p, i) => {
    const x = n <= 1 ? padLeft + innerW / 2 : padLeft + (i / (n - 1)) * innerW;
    const y = padTop + innerH - (p.count / maxCount) * innerH;
    return { date: p.date, count: p.count, x, y };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  let areaPath = '';
  if (points.length > 0) {
    const baseY = height - padBottom;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const segments = points.map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `M ${first.x} ${baseY} ${segments} L ${last.x} ${baseY} Z`;
  }

  // Tick labels are whole verse counts, so a small maximum can't be split into
  // `yTickSteps` distinct integers: 4 steps over a max of 1 round to 0,0,1,1,1 —
  // repeated labels stacked on evenly spaced gridlines, and duplicate keys for
  // renderers that key the tick list by value. Cap the ladder at the maximum;
  // from `maxCount >= yTickSteps` up, the rounded values are always distinct.
  const steps = Math.min(yTickSteps, maxCount);

  const yTicks: ChartYTick[] = [];
  for (let i = 0; i <= steps; i++) {
    yTicks.push({
      value: Math.round((maxCount / steps) * i),
      y: padTop + innerH - (i / steps) * innerH,
    });
  }

  return { points, linePoints, areaPath, yTicks, maxCount };
};
