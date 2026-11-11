import { describe, it, expect } from 'vitest';
import swaggerSpec, { publicSwaggerSpec } from '../config/swagger';

const operationTags = (spec: { paths: Record<string, Record<string, { tags?: string[] }>> }) =>
  new Set(Object.values(spec.paths).flatMap((ops) => Object.values(ops).flatMap((op) => op.tags ?? [])));

describe('publicSwaggerSpec', () => {
  it('omits admin, test, sitemap, and mobile operations', () => {
    const tags = operationTags(publicSwaggerSpec);
    for (const internal of ['Admin', 'Test', 'Sitemap', 'Mobile']) {
      expect(tags.has(internal)).toBe(false);
    }
    expect(Object.keys(publicSwaggerSpec.paths).some((path) => path.startsWith('/admin'))).toBe(false);
  });

  it('keeps the user-facing operations', () => {
    const tags = operationTags(publicSwaggerSpec);
    expect(tags).toContain('LogEntries');
    expect(tags).toContain('PassageNotes');
    expect(tags).toContain('Authentication');
    expect(operationTags(swaggerSpec)).toContain('Admin');
  });
});
