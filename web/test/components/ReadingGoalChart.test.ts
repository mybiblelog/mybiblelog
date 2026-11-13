// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Bible, bookToPassage, computeGoalChartSeries } from '@mybiblelog/shared';
import ReadingGoalChart from '~/components/goals/ReadingGoalChart.vue';

const JUDE = 65;
// Jude (25 verses) from Jan 1 to Jan 5.
const goal = { passages: [bookToPassage(JUDE)], startDate: '2026-01-01', endDate: '2026-01-05' };
const read = (date: string, to: number) => ({
  date,
  startVerseId: Bible.makeVerseId(JUDE, 1, 1),
  endVerseId: Bible.makeVerseId(JUDE, 1, to),
});

const mountChart = (today: string, entries: ReturnType<typeof read>[], props: Record<string, unknown> = {}) => mount(ReadingGoalChart, {
  props: {
    series: computeGoalChartSeries(goal, entries, today),
    totalVerses: 25,
    endDate: goal.endDate,
    averagePerDay: 5,
    ...props,
  },
  global: { mocks: { $n: (value: number) => String(value) } },
});

const find = (wrapper: ReturnType<typeof mountChart>, id: string) => wrapper.find(`[data-testid="reading-goal-chart-${id}"]`);
const points = (wrapper: ReturnType<typeof mountChart>, id: string) =>
  find(wrapper, id).attributes('points')!.split(' ').map(pair => pair.split(',').map(Number));

describe('ReadingGoalChart', () => {
  it('draws reading through today only, starting from zero', () => {
    const wrapper = mountChart('2026-01-02', [read('2026-01-01', 5), read('2026-01-02', 10)]);
    const line = points(wrapper, 'line');
    // Origin, then the end of day 1 and day 2 of a five-day chart.
    expect(line.map(([x]) => x)).toEqual([0, 20, 40]);
    expect(line[0]![1]).toBeGreaterThan(line[2]![1]!);
  });

  it('the plan line reaches the total at the end of the goal date', () => {
    const wrapper = mountChart('2026-01-02', []);
    const target = points(wrapper, 'target');
    expect(target[1]![0]).toBe(100);
  });

  it('once past the goal date the plan line flattens where the goal date fell', () => {
    const wrapper = mountChart('2026-01-10', []);
    const target = points(wrapper, 'target');
    expect(target[1]![0]).toBe(50);
    expect(target[2]).toEqual([100, target[1]![1]]);
  });

  it('projects from today at the average pace, stopping at the chart edge', () => {
    const wrapper = mountChart('2026-01-02', [read('2026-01-01', 5), read('2026-01-02', 10)]);
    const projection = find(wrapper, 'projection');
    expect(Number(projection.attributes('x1'))).toBe(40);
    expect(Number(projection.attributes('x2'))).toBe(100);
  });

  it('has no projection without reading pace, on the last day, or once complete', () => {
    expect(find(mountChart('2026-01-02', [], { averagePerDay: 0 }), 'projection').exists()).toBe(false);
    expect(find(mountChart('2026-01-05', [read('2026-01-01', 5)]), 'projection').exists()).toBe(false);
    expect(find(mountChart('2026-01-02', [read('2026-01-01', 25)], { complete: true }), 'projection').exists()).toBe(false);
  });
});
