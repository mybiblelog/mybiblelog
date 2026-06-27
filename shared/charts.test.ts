import { describe, expect, it } from 'vitest';
import { DEFAULT_CHART_DIMENSIONS, buildLineChartGeometry } from './charts';

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
});
