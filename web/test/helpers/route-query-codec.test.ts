import { describe, it, expect } from 'vitest';
import { clamp, parseIntOr, pickEnum, MAX_PAGE_SIZE } from '~/helpers/route-query-codec';

describe('clamp', () => {
  it('clamps a value into the given range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 1, 10)).toBe(1);
    expect(clamp(999, 1, 10)).toBe(10);
  });
});

describe('parseIntOr', () => {
  it('parses numbers and numeric strings', () => {
    expect(parseIntOr(5, 0)).toBe(5);
    expect(parseIntOr('5', 0)).toBe(5);
  });

  it('falls back for invalid values', () => {
    expect(parseIntOr('abc', 7)).toBe(7);
    expect(parseIntOr(undefined, 7)).toBe(7);
  });
});

describe('pickEnum', () => {
  it('returns the value when allowed', () => {
    expect(pickEnum('b', ['a', 'b', 'c'] as const, 'a')).toBe('b');
  });

  it('falls back when not allowed', () => {
    expect(pickEnum('z', ['a', 'b', 'c'] as const, 'a')).toBe('a');
    expect(pickEnum(undefined, ['a', 'b', 'c'] as const, 'a')).toBe('a');
  });
});

describe('MAX_PAGE_SIZE', () => {
  it('is 50', () => {
    expect(MAX_PAGE_SIZE).toBe(50);
  });
});
