import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '../../fixtures';
import { seedLogEntries, seedNote, seedTag, getLogEntries } from '../../helpers/seed';
import { verseId, BOOK } from '../../helpers/passages';
import { today, daysAgo } from '../../helpers/dates';

const testDataPath = (name: string) => path.resolve(__dirname, '../../test-data', name);

const readDownload = async (download: import('@playwright/test').Download): Promise<string> => {
  const filePath = await download.path();
  return fs.readFile(filePath!, 'utf-8');
};

test.describe('Export', () => {
  test('reading log CSV download contains the seeded entries', async ({ page, api }) => {
    await seedLogEntries(api, [
      { date: today(), startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 10) },
      { date: daysAgo(1), startVerseId: verseId(BOOK.EXODUS, 1, 1), endVerseId: verseId(BOOK.EXODUS, 1, 5) },
    ]);

    await page.goto('/settings/export');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-log-csv-button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const content = await readDownload(download);
    const rows = content.trim().split('\n');
    expect(rows).toHaveLength(2);
    expect(content).toContain(`${today()},Genesis 1:1-10`);
    expect(content).toContain(`${daysAgo(1)},Exodus 1:1-5`);
  });

  test('notes text export contains note content and tags', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'ExportTag', color: '#456789' });
    await seedNote(api, {
      content: 'Exported note content',
      passages: [{ startVerseId: verseId(BOOK.GENESIS, 1, 1), endVerseId: verseId(BOOK.GENESIS, 1, 5) }],
      tags: [tag.id],
    });

    await page.goto('/settings/export');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-notes-text-button').click();
    const download = await downloadPromise;

    const content = await readDownload(download);
    expect(content).toContain('Exported note content');
    expect(content).toContain('ExportTag');
    expect(content).toContain('Genesis 1:1-5');
  });

  test('notes JSON export parses with notes and tags', async ({ page, api }) => {
    const tag = await seedTag(api, { label: 'JsonTag', color: '#987654' });
    await seedNote(api, { content: 'JSON note', passages: [], tags: [tag.id] });

    await page.goto('/settings/export');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-notes-json-button').click();
    const download = await downloadPromise;

    const parsed = JSON.parse(await readDownload(download));
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.notes[0].content).toBe('JSON note');
    expect(parsed.tags).toHaveLength(1);
    expect(parsed.tags[0].label).toBe('JsonTag');
  });
});

test.describe('Import', () => {
  test('valid CSV imports all rows and offers a look-back-date reset', async ({ page, api }) => {
    await page.goto('/settings/import');
    await page.getByTestId('import-file-input').setInputFiles(testDataPath('import-valid.csv'));

    const rows = page.getByTestId('import-row');
    await expect(rows).toHaveCount(3);
    await expect(page.getByTestId('import-row-status').filter({ hasText: 'Imported' })).toHaveCount(3);

    // The entries exist via the API
    const entries = await getLogEntries(api);
    expect(entries).toHaveLength(3);
    expect(entries.map((entry: { date: string }) => entry.date).sort()).toEqual([
      '2024-01-01', '2024-01-02', '2024-01-03',
    ]);

    // Imported dates predate the look-back date (defaults to signup day),
    // so the reset prompt appears; accepting it moves the look-back date
    await page.getByRole('button', { name: 'Update Look Back Date' }).click();
    await expect(async () => {
      const response = await api.get('/api/settings');
      const { data } = await response.json();
      expect(data.lookBackDate <= '2024-01-01').toBe(true);
    }).toPass();
  });

  test('re-importing the same CSV flags rows as already existing', async ({ page }) => {
    await page.goto('/settings/import');
    await page.getByTestId('import-file-input').setInputFiles(testDataPath('import-valid.csv'));
    await expect(page.getByTestId('import-row-status').filter({ hasText: 'Imported' })).toHaveCount(3);

    await page.goto('/settings/import');
    await page.getByTestId('import-file-input').setInputFiles(testDataPath('import-valid.csv'));
    await expect(page.getByTestId('import-row-status').filter({ hasText: 'Already Exists' })).toHaveCount(3);
  });

  test('mixed CSV imports valid rows and flags invalid passages', async ({ page, api }) => {
    await page.goto('/settings/import');
    await page.getByTestId('import-file-input').setInputFiles(testDataPath('import-mixed.csv'));

    const statuses = page.getByTestId('import-row-status');
    await expect(statuses.filter({ hasText: 'Imported' })).toHaveCount(2);
    await expect(statuses.filter({ hasText: 'Invalid' })).toHaveCount(1);

    const entries = await getLogEntries(api);
    expect(entries).toHaveLength(2);
  });
});
