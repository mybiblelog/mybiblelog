import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import type { PlanTracker } from '@mybiblelog/shared';
import { usePlanTrackersStore } from '~/stores/plan-trackers';

beforeEach(() => setActivePinia(createPinia()));

const makeTracker = (id: string, planId: string, completedDate: string | null = null): PlanTracker => ({
  id,
  planId,
  startDate: '2024-01-01',
  completedDate,
});

describe('plan-trackers store', () => {
  it('activeTrackers excludes completed trackers', () => {
    const store = usePlanTrackersStore();
    store.trackers = [
      makeTracker('a', 'p1'),
      makeTracker('b', 'p2', '2024-02-01'),
    ];
    expect(store.activeTrackers.map(t => t.id)).toEqual(['a']);
  });

  it('activeTrackerForPlan matches by plan id and ignores completed ones', () => {
    const store = usePlanTrackersStore();
    store.trackers = [
      makeTracker('a', 'p1'),
      makeTracker('b', 'p2', '2024-02-01'),
    ];
    expect(store.activeTrackerForPlan('p1')?.id).toBe('a');
    expect(store.activeTrackerForPlan('p2')).toBeUndefined();
  });

  it('createPlanTracker posts and appends the tracker', async () => {
    const created = makeTracker('new', 'p1');
    const post = vi.fn().mockResolvedValue({ data: created });
    vi.stubGlobal('useNuxtApp', () => ({ $http: { post } }));
    const store = usePlanTrackersStore();

    const result = await store.createPlanTracker({ planId: 'p1', startDate: '2024-01-01' });

    expect(post).toHaveBeenCalledWith('/api/plan-trackers', { planId: 'p1', startDate: '2024-01-01' });
    expect(result).toEqual(created);
    expect(store.trackers).toHaveLength(1);
  });

  it('completePlanTracker updates the tracker in place with a completed date', async () => {
    const store = usePlanTrackersStore();
    store.trackers = [makeTracker('a', 'p1')];
    const completed = makeTracker('a', 'p1', '2024-03-03');
    const patch = vi.fn().mockResolvedValue({ data: completed });
    vi.stubGlobal('useNuxtApp', () => ({ $http: { patch } }));

    await store.completePlanTracker('a', '2024-03-03');

    expect(patch).toHaveBeenCalledWith('/api/plan-trackers/a', { completedDate: '2024-03-03' });
    expect(store.trackers[0]!.completedDate).toBe('2024-03-03');
    expect(store.activeTrackers).toHaveLength(0);
  });

  it('deletePlanTracker removes the tracker on success', async () => {
    const store = usePlanTrackersStore();
    store.trackers = [makeTracker('a', 'p1'), makeTracker('b', 'p2')];
    vi.stubGlobal('useNuxtApp', () => ({ $http: { delete: vi.fn().mockResolvedValue({ data: 1 }) } }));

    const ok = await store.deletePlanTracker('a');

    expect(ok).toBe(true);
    expect(store.trackers.map(t => t.id)).toEqual(['b']);
  });
});
