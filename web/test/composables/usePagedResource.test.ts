import { describe, it, expect, vi } from 'vitest';
import { usePagedResource } from '~/composables/usePagedResource';

describe('usePagedResource', () => {
  it('derives totalPages and offset from size and page', () => {
    const paged = usePagedResource({ limit: 10, load: vi.fn() });
    paged.applyServerMeta({ offset: 0, size: 25 }, 10);
    expect(paged.totalPages.value).toBe(3);
    expect(paged.offset.value).toBe(0);
  });

  it('syncs the current page from the server offset', () => {
    const paged = usePagedResource({ limit: 10, load: vi.fn() });
    paged.applyServerMeta({ offset: 20, size: 25 }, 5);
    expect(paged.page.value).toBe(3);
    expect(paged.offset.value).toBe(20);
    expect(paged.summary.value).toEqual({ kind: 'range', first: 21, last: 25, total: 25 });
  });

  it('loads a new page and clamps out-of-range requests', () => {
    const load = vi.fn();
    const paged = usePagedResource({ limit: 10, load });
    paged.applyServerMeta({ offset: 0, size: 25 }, 10);
    paged.goToPage(2);
    expect(paged.page.value).toBe(2);
    expect(load).toHaveBeenCalledTimes(1);

    paged.goToPage(99);
    expect(paged.page.value).toBe(3);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not reload when the target page is already current', () => {
    const load = vi.fn();
    const paged = usePagedResource({ limit: 10, load });
    paged.applyServerMeta({ offset: 0, size: 25 }, 10);
    paged.goToPage(1);
    expect(load).not.toHaveBeenCalled();
  });

  it('resets to the first page', () => {
    const paged = usePagedResource({ limit: 10, load: vi.fn() });
    paged.applyServerMeta({ offset: 20, size: 25 }, 5);
    paged.reset();
    expect(paged.page.value).toBe(1);
  });
});
