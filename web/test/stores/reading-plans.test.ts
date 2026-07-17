import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { MAX_READING_PLANS_PER_USER, type ReadingPlan } from '@mybiblelog/shared';
import { useReadingPlansStore } from '~/stores/reading-plans';

beforeEach(() => setActivePinia(createPinia()));

const makePlan = (id: string, name = `Plan ${id}`): ReadingPlan => ({
  id,
  name,
  days: [{ passages: [{ startVerseId: 101001001, endVerseId: 101001005 }] }],
});

describe('reading-plans store', () => {
  it('atPlanLimit reflects the shared per-user limit', () => {
    const store = useReadingPlansStore();
    expect(store.planLimit).toBe(MAX_READING_PLANS_PER_USER);
    expect(store.atPlanLimit).toBe(false);

    store.plans = Array.from({ length: MAX_READING_PLANS_PER_USER }, (_, i) => makePlan(`${i}`));
    expect(store.atPlanLimit).toBe(true);
  });

  it('getPlanById finds a plan regardless of id type', () => {
    const store = useReadingPlansStore();
    store.plans = [makePlan('42')];
    expect(store.getPlanById('42')?.name).toBe('Plan 42');
    expect(store.getPlanById(42)?.name).toBe('Plan 42');
    expect(store.getPlanById('nope')).toBeUndefined();
  });

  it('createReadingPlan posts and appends the created plan', async () => {
    const created = makePlan('new', 'Gospel of John');
    const post = vi.fn().mockResolvedValue({ data: created });
    vi.stubGlobal('useNuxtApp', () => ({ $http: { post } }));
    const store = useReadingPlansStore();

    const result = await store.createReadingPlan({ name: 'Gospel of John', days: [] });

    expect(post).toHaveBeenCalledWith('/api/reading-plans', { name: 'Gospel of John', days: [] });
    expect(result).toEqual(created);
    expect(store.plans).toHaveLength(1);
  });

  it('updateReadingPlan replaces the matching plan in place', async () => {
    const store = useReadingPlansStore();
    store.plans = [makePlan('1', 'Original')];
    const updated = makePlan('1', 'Renamed');
    vi.stubGlobal('useNuxtApp', () => ({ $http: { patch: vi.fn().mockResolvedValue({ data: updated }) } }));

    await store.updateReadingPlan({ id: '1', name: 'Renamed', days: updated.days });

    expect(store.plans[0]!.name).toBe('Renamed');
    expect(store.plans).toHaveLength(1);
  });

  it('deleteReadingPlan removes the plan on success', async () => {
    const store = useReadingPlansStore();
    store.plans = [makePlan('1'), makePlan('2')];
    vi.stubGlobal('useNuxtApp', () => ({ $http: { delete: vi.fn().mockResolvedValue({ data: 1 }) } }));

    const ok = await store.deleteReadingPlan('1');

    expect(ok).toBe(true);
    expect(store.plans.map(p => p.id)).toEqual(['2']);
  });

  it('deleteReadingPlan keeps the plan when the API reports no deletion', async () => {
    const store = useReadingPlansStore();
    store.plans = [makePlan('1')];
    vi.stubGlobal('useNuxtApp', () => ({ $http: { delete: vi.fn().mockResolvedValue({ data: 0 }) } }));

    const ok = await store.deleteReadingPlan('1');

    expect(ok).toBe(false);
    expect(store.plans).toHaveLength(1);
  });
});
