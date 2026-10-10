import { describe, it, expect } from 'vitest';
import { toFtsQuery } from '../repositories/sqlite/passage-note.repository';

describe('toFtsQuery (Mongo $text search string -> FTS5 MATCH)', () => {
  it('ORs plain terms, quoting each', () => {
    expect(toFtsQuery('grace faith')).toBe('("grace" OR "faith")');
  });

  it('drops English stop words, as a Mongo text index does', () => {
    expect(toFtsQuery('the grace of God')).toBe('("grace" OR "God")');
  });

  it('requires every quoted phrase and ignores plain terms alongside them', () => {
    expect(toFtsQuery('"living water" "bread of life" well')).toBe('("living water" AND "bread of life")');
  });

  it('turns -term into an exclusion', () => {
    expect(toFtsQuery('grace -law')).toBe('("grace") NOT "law"');
  });

  it('matches nothing for negations or stop words alone', () => {
    expect(toFtsQuery('-law')).toBeNull();
    expect(toFtsQuery('the and')).toBeNull();
    expect(toFtsQuery('   ')).toBeNull();
  });

  it('neutralizes FTS5 syntax inside terms', () => {
    expect(toFtsQuery('NEAR(a* b) NOT')).toBe('("NEAR(a*" OR "b)" OR "NOT")');
    expect(toFtsQuery('say"hi')).toBe('("say""hi")');
  });
});
