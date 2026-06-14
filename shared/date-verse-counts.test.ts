import { expect, test } from 'vitest';
import Bible from './bible';
import { computeDateVerseCounts } from './date-verse-counts';

test('returns empty counts when no log entries are provided', () => {
  const counts = computeDateVerseCounts([], '2026-06-10', '2026-06-12');
  expect(counts).toEqual({
    '2026-06-10': { total: 0, unique: 0 },
    '2026-06-11': { total: 0, unique: 0 },
    '2026-06-12': { total: 0, unique: 0 },
  });
});

test('returns zero counts for dates with no entries', () => {
  const logEntries = [
    {
      date: '2026-06-09',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-12');
  expect(counts).toEqual({
    '2026-06-10': { total: 0, unique: 0 },
    '2026-06-11': { total: 0, unique: 0 },
    '2026-06-12': { total: 0, unique: 0 },
  });
});

test('returns correct counts for a single log entry within the date range', () => {
  const logEntries = [
    {
      date: '2026-06-11',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-12');
  expect(counts).toEqual({
    '2026-06-10': { total: 0, unique: 0 },
    '2026-06-11': { total: 5, unique: 5 },
    '2026-06-12': { total: 0, unique: 0 },
  });
});

test('returns correct counts for multiple log entries on the same date', () => {
  const logEntries = [
    {
      date: '2026-06-11',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 3),
    },
    {
      date: '2026-06-11',
      startVerseId: Bible.makeVerseId(1, 1, 4),
      endVerseId: Bible.makeVerseId(1, 1, 6),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-12');
  expect(counts).toEqual({
    '2026-06-10': { total: 0, unique: 0 },
    '2026-06-11': { total: 6, unique: 6 },
    '2026-06-12': { total: 0, unique: 0 },
  });
});

test('returns correct counts for multiple log entries across multiple dates', () => {
  const logEntries = [
    {
      date: '2026-06-10',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
    {
      date: '2026-06-11',
      startVerseId: Bible.makeVerseId(1, 1, 3),
      endVerseId: Bible.makeVerseId(1, 1, 10),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-12');
  expect(counts).toEqual({
    '2026-06-10': { total: 5, unique: 5 },
    '2026-06-11': { total: 8, unique: 5 },
    '2026-06-12': { total: 0, unique: 0 },
  });
});

test('handles non-consecutive dates correctly', () => {
  const logEntries = [
    {
      date: '2026-06-10',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
    {
      date: '2026-06-12',
      startVerseId: Bible.makeVerseId(1, 1, 11),
      endVerseId: Bible.makeVerseId(1, 1, 15),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-13');
  expect(counts).toEqual({
    '2026-06-10': { total: 5, unique: 5 },
    '2026-06-11': { total: 0, unique: 0 },
    '2026-06-12': { total: 5, unique: 5 },
    '2026-06-13': { total: 0, unique: 0 },
  });
});

test('handles overlapping log entries on the same date correctly', () => {
  const logEntries = [
    {
      date: '2026-06-10',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
    {
      date: '2026-06-10',
      startVerseId: Bible.makeVerseId(1, 1, 4),
      endVerseId: Bible.makeVerseId(1, 1, 7),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-11');
  expect(counts).toEqual({
    '2026-06-10': { total: 7, unique: 7 },
    '2026-06-11': { total: 0, unique: 0 },
  });
});

test('handles overlapping log entries across multiple dates correctly', () => {
  const logEntries = [
    {
      date: '2026-06-10',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
    {
      date: '2026-06-11',
      startVerseId: Bible.makeVerseId(1, 1, 3),
      endVerseId: Bible.makeVerseId(1, 1, 10),
    },
  ];

  const counts = computeDateVerseCounts(logEntries, '2026-06-10', '2026-06-11');
  expect(counts).toEqual({
    '2026-06-10': { total: 5, unique: 5 },
    '2026-06-11': { total: 8, unique: 5 },
  });
});

test('counts pre-tracker log entries in total only when trackerStartDate is later than the date range start', () => {
  const logEntries = [
    {
      date: '2026-06-10',
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
    {
      date: '2026-06-11',
      startVerseId: Bible.makeVerseId(1, 1, 3),
      endVerseId: Bible.makeVerseId(1, 1, 10),
    },
  ];

  const counts = computeDateVerseCounts(
    logEntries,
    '2026-06-10',
    '2026-06-11',
    '2026-06-11',
  );

  expect(counts).toEqual({
    '2026-06-10': { total: 5, unique: 0 },
    '2026-06-11': { total: 8, unique: 8 },
  });
});
