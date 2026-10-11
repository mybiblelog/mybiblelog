/**
 * Pure geometry helpers for rendering line/area charts as SVG. The data series
 * itself comes from `insights.computeDailyVerseSeries` (or any `{ count }`
 * series); this module only does the coordinate math, so the same output can
 * feed a Vue `<svg>`, a React component, or a snapshot test.
 *
 * `buildLineChartGeometry` plots one series against its own y-scale.
 * `buildMultiLineChartGeometry` plots several named series that share a
 * single y-scale (and therefore a single y-axis), for charts comparing
 * multiple metrics over the same date range.
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
  /** Smooth (monotone cubic) SVG path through the points, for an SVG <path>. */
  linePath: string;
  /** SVG path for a filled area below the smooth line. */
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

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Builds an SVG path ("M x y C ...") that passes through every point as a
 * smooth curve. Uses monotone cubic interpolation (Fritsch–Carlson), so the
 * curve never overshoots between points — important for counts, where an
 * overshoot would dip below zero or above the maximum. Points are assumed to
 * be ordered by increasing x.
 */
export const buildSmoothPath = (points: ReadonlyArray<{ x: number; y: number }>): string => {
  const n = points.length;
  if (n === 0) return '';
  const first = points[0]!;
  if (n === 1) return `M ${round(first.x)} ${round(first.y)}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    dx.push(b.x - a.x);
    slope.push(b.x === a.x ? 0 : (b.y - a.y) / (b.x - a.x));
  }

  // Tangent at each point: average of neighbouring slopes, zero at local
  // extremes, then limited so the curve stays monotone within each segment.
  const tangent: number[] = new Array(n).fill(0);
  tangent[0] = slope[0]!;
  tangent[n - 1] = slope[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    const s0 = slope[i - 1]!;
    const s1 = slope[i]!;
    tangent[i] = s0 * s1 <= 0 ? 0 : (s0 + s1) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    const s = slope[i]!;
    if (s === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i]! / s;
    const b = tangent[i + 1]! / s;
    const h = Math.hypot(a, b);
    if (h > 3) {
      tangent[i] = (3 * a / h) * s;
      tangent[i + 1] = (3 * b / h) * s;
    }
  }

  let d = `M ${round(first.x)} ${round(first.y)}`;
  for (let i = 0; i < n - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const third = dx[i]! / 3;
    d += ` C ${round(a.x + third)} ${round(a.y + tangent[i]! * third)}`
      + ` ${round(b.x - third)} ${round(b.y - tangent[i + 1]! * third)}`
      + ` ${round(b.x)} ${round(b.y)}`;
  }
  return d;
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
  // Rounded up so the tick ladder stays whole numbers when the series holds
  // fractional values (e.g. rolling averages).
  const maxCount = Math.max(1, Math.ceil(Math.max(0, ...series.map(p => p.count))));
  const n = series.length;

  const points: ChartPoint[] = series.map((p, i) => {
    const x = n <= 1 ? padLeft + innerW / 2 : padLeft + (i / (n - 1)) * innerW;
    const y = padTop + innerH - (p.count / maxCount) * innerH;
    return { date: p.date, count: p.count, x, y };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const linePath = buildSmoothPath(points);

  let areaPath = '';
  if (points.length > 0) {
    const baseY = height - padBottom;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    // Reuse the smooth line (minus its leading "M") so the fill hugs the curve.
    const curve = linePath.replace(/^M [\d.-]+ [\d.-]+/, '');
    areaPath = `M ${first.x} ${baseY} L ${first.x} ${first.y}${curve} L ${last.x} ${baseY} Z`;
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

  return { points, linePoints, linePath, areaPath, yTicks, maxCount };
};

export type NamedChartSeries = {
  key: string;
  points: ReadonlyArray<ChartSeriesPoint>;
};

export type MultiLineSeriesGeometry = {
  key: string;
  points: ChartPoint[];
  /** Space-separated "x,y" pairs for an SVG <polyline>. */
  linePoints: string;
};

export type MultiLineChartGeometry = {
  series: MultiLineSeriesGeometry[];
  yTicks: ChartYTick[];
  maxCount: number;
};

/**
 * Maps several named series onto one shared y-scale, so multiple metrics can
 * be compared on a single chart instead of each getting its own axis. Series
 * are assumed to share the same date axis (same length/order); x-positions
 * are spaced using the longest series. No area path is produced — overlapping
 * fills from several series muddy rather than clarify, so multi-line charts
 * render lines only.
 */
export const buildMultiLineChartGeometry = (
  seriesList: ReadonlyArray<NamedChartSeries>,
  dimensions: Partial<ChartDimensions> = {},
  yTickSteps = 4,
): MultiLineChartGeometry => {
  const { width, height, padLeft, padRight, padTop, padBottom } = {
    ...DEFAULT_CHART_DIMENSIONS,
    ...dimensions,
  };

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const maxCount = Math.max(1, ...seriesList.flatMap(s => s.points.map(p => p.count)));
  const n = Math.max(...seriesList.map(s => s.points.length), 0);

  const series: MultiLineSeriesGeometry[] = seriesList.map(({ key, points: seriesPoints }) => {
    const mapped: ChartPoint[] = seriesPoints.map((p, i) => {
      const x = n <= 1 ? padLeft + innerW / 2 : padLeft + (i / (n - 1)) * innerW;
      const y = padTop + innerH - (p.count / maxCount) * innerH;
      return { date: p.date, count: p.count, x, y };
    });
    const linePoints = mapped.map(p => `${p.x},${p.y}`).join(' ');
    return { key, points: mapped, linePoints };
  });

  // See buildLineChartGeometry: cap the tick ladder at maxCount so a small
  // shared maximum doesn't round to repeated labels on evenly spaced lines.
  const steps = Math.min(yTickSteps, maxCount);

  const yTicks: ChartYTick[] = [];
  for (let i = 0; i <= steps; i++) {
    yTicks.push({
      value: Math.round((maxCount / steps) * i),
      y: padTop + innerH - (i / steps) * innerH,
    });
  }

  return { series, yTicks, maxCount };
};
