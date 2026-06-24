import { describe, it, expect } from 'vitest';
import { parseSemver, isSemverLessThan } from '../http/helpers/semver';

describe('semver helper (unit)', () => {
  describe('parseSemver', () => {
    it('parses a valid X.Y.Z version', () => {
      const parsed = parseSemver('1.2.3');
      expect(parsed).not.toBeNull();
      expect(parsed?.major).toBe(1);
      expect(parsed?.minor).toBe(2);
      expect(parsed?.patch).toBe(3);
    });

    it('returns null for an invalid version', () => {
      expect(parseSemver('not-a-version')).toBeNull();
      expect(parseSemver('1.2')).toBeNull();
      expect(parseSemver('')).toBeNull();
    });

    it('rejects a prerelease/build suffix (only strict X.Y.Z is supported)', () => {
      expect(parseSemver('1.2.3-beta.1')).toBeNull();
      expect(parseSemver('1.2.3+build')).toBeNull();
    });
  });

  describe('isSemverLessThan', () => {
    it('is true when a is lower than b', () => {
      expect(isSemverLessThan('1.0.0', '1.0.1')).toBe(true);
      expect(isSemverLessThan('1.0.0', '2.0.0')).toBe(true);
      expect(isSemverLessThan('1.2.3', '1.3.0')).toBe(true);
    });

    it('is false when a equals b', () => {
      expect(isSemverLessThan('1.2.3', '1.2.3')).toBe(false);
    });

    it('is false when a is greater than b', () => {
      expect(isSemverLessThan('2.0.0', '1.9.9')).toBe(false);
    });

    it('is false (rather than throwing) when either input is invalid', () => {
      expect(isSemverLessThan('garbage', '1.0.0')).toBe(false);
      expect(isSemverLessThan('1.0.0', 'garbage')).toBe(false);
    });
  });
});
