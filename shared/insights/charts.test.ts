import { describe, expect, it } from 'vitest';
import { DEFAULT_CHART_DIMENSIONS, buildLineChartGeometry, buildMultiLineChartGeometry } from './charts';

const series = [
  { date: '2024-06-01', count: 0 },
  { date: '2024-06-02', count: 5 },
  { date: '2024-06-03', count: 10 },
];

describe('buildLineChartGeometry', () => {
  it('plots a point per series entry within the padded bounds', () => {
    const { points, maxCount } = buildLineChartGeometry(series);
    const { width, padLeft, padRight, padTop } = DEFAULT_CHART_DIMENSIONS;
    expect(points).toHaveLength(3);
    expect(maxCount).toBe(10);
    expect(points[0].x).toBeCloseTo(padLeft);
    expect(points[2].x).toBeCloseTo(width - padRight);
    // The peak count sits at the top padding line.
    expect(points[2].y).toBeCloseTo(padTop);
  });

  it('centers a single point horizontally', () => {
    const { points } = buildLineChartGeometry([{ date: '2024-06-01', count: 3 }]);
    const { width, padLeft, padRight } = DEFAULT_CHART_DIMENSIONS;
    expect(points[0].x).toBeCloseTo(padLeft + (width - padLeft - padRight) / 2);
  });

  it('produces an empty area path for an empty series', () => {
    const geometry = buildLineChartGeometry([]);
    expect(geometry.areaPath).toBe('');
    expect(geometry.linePoints).toBe('');
    expect(geometry.maxCount).toBe(1);
  });

  it('builds a closed area path and tick ladder', () => {
    const { areaPath, yTicks } = buildLineChartGeometry(series);
    expect(areaPath.startsWith('M ')).toBe(true);
    expect(areaPath.endsWith('Z')).toBe(true);
    expect(yTicks).toHaveLength(5); // 0..4 steps
    expect(yTicks[0].value).toBe(0);
    expect(yTicks[4].value).toBe(10);
  });

  it('shortens the tick ladder rather than repeating a rounded label', () => {
    for (const max of [1, 2, 3, 4, 10]) {
      const { yTicks } = buildLineChartGeometry([{ date: '2024-06-01', count: max }]);
      const values = yTicks.map(t => t.value);
      expect(yTicks).toHaveLength(Math.min(4, max) + 1);
      expect(new Set(values).size).toBe(values.length);
      expect(values[0]).toBe(0);
      expect(values[values.length - 1]).toBe(max);
    }
  });
});

describe('buildMultiLineChartGeometry', () => {
  const dates = ['2024-06-01', '2024-06-02', '2024-06-03'];

  it('shares one y-scale across all series, driven by the combined max', () => {
    const { series, maxCount, yTicks } = buildMultiLineChartGeometry([
      { key: 'a', points: dates.map((date, i) => ({ date, count: [0, 5, 10][i] })) },
      { key: 'b', points: dates.map((date, i) => ({ date, count: [0, 1, 2][i] })) },
    ]);
    const { padTop } = DEFAULT_CHART_DIMENSIONS;

    expect(maxCount).toBe(10);
    expect(yTicks[yTicks.length - 1]!.value).toBe(10);
    // Series 'a' peaks at the shared max, so it reaches the top padding line...
    expect(series[0]!.points[2]!.y).toBeCloseTo(padTop);
    // ...while series 'b' peaks well below it, since it's scaled to the shared max, not its own.
    expect(series[1]!.points[2]!.y).toBeGreaterThan(padTop);
  });

  it('passes through series keys and per-series points', () => {
    const { series } = buildMultiLineChartGeometry([
      { key: 'total', points: dates.map((date, i) => ({ date, count: [1, 2, 3][i] })) },
      { key: 'web', points: dates.map((date, i) => ({ date, count: [1, 1, 1][i] })) },
    ]);
    expect(series.map(s => s.key)).toEqual(['total', 'web']);
    expect(series[0]!.points).toHaveLength(3);
    expect(series[0]!.linePoints.split(' ')).toHaveLength(3);
  });

  it('caps the tick ladder at a small shared maximum', () => {
    const { yTicks } = buildMultiLineChartGeometry([
      { key: 'a', points: [{ date: dates[0]!, count: 2 }] },
      { key: 'b', points: [{ date: dates[0]!, count: 1 }] },
    ]);
    const values = yTicks.map(t => t.value);
    expect(yTicks).toHaveLength(3); // min(4, maxCount=2) + 1
    expect(new Set(values).size).toBe(values.length);
  });

  it('returns no area path field and an empty series list for no input', () => {
    const geometry = buildMultiLineChartGeometry([]);
    expect(geometry.series).toEqual([]);
    expect(geometry.maxCount).toBe(1);
  });
});
