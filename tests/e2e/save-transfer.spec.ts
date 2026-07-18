import { expect, test } from '@playwright/test';

import { BACKUP_SAVE_KEY, SAVE_KEY, serializeEnvelope } from '../../src/persistence/saveStore';
import {
  nearBankruptcyEnvelope,
  nearVictoryEnvelope,
  versionOneVictorySave,
} from '../fixtures/campaignFixtures';

test.describe('portable save controls', () => {
  test('exports a safe JSON filename and reimports through the production UI', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Save transfer' }).click();
    await page.getByLabel('Import save JSON file').setInputFiles({
      name: 'active-campaign.json',
      mimeType: 'application/json',
      buffer: Buffer.from(serializeEnvelope(nearVictoryEnvelope())),
    });
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByRole('checkbox', { name: 'Reduce motion' }).check();
    await page.getByRole('tab', { name: 'Save transfer' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export save JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^laneway-tycoon-save-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    if (!path) throw new Error('Exported save did not reach a temporary file.');

    await page.getByText('Start clean (keep settings and unlocks)').click();
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Save transfer' }).click();
    await page.getByLabel('Import save JSON file').setInputFiles(path);
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Day 30/30 · Specialty Cafe' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  });

  test('rejects a future schema without replacing the current campaign', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Save transfer' }).click();
    await page.getByLabel('Import save JSON file').setInputFiles({
      name: 'future.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"schemaVersion":99}'),
    });
    await expect(page.getByText('Import rejected; current data is unchanged.')).toBeVisible();
    await page.getByRole('button', { name: 'Close game menu' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
  });

  test('migrates a supported version-1 file and rejects malformed JSON safely', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Save transfer' }).click();
    const fileInput = page.getByLabel('Import save JSON file');
    await fileInput.setInputFiles({
      name: 'version-one.json',
      mimeType: 'application/json',
      buffer: Buffer.from(versionOneVictorySave()),
    });
    await expect(page.getByRole('heading', { name: 'Day 30/30 · Specialty Cafe' })).toBeVisible();

    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Save transfer' }).click();
    await page.getByLabel('Import save JSON file').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{broken'),
    });
    await expect(page.getByText('Import rejected; current data is unchanged.')).toBeVisible();
    await page.getByRole('button', { name: 'Close game menu' }).click();
    await expect(page.getByRole('heading', { name: 'Day 30/30 · Specialty Cafe' })).toBeVisible();
  });

  test('offers and restores a validated last-known-good browser save', async ({ page }) => {
    const backup = serializeEnvelope(nearBankruptcyEnvelope());
    await page.goto('/');
    await page.evaluate(
      ({ backupKey, backupValue, primaryKey }) => {
        window.localStorage.setItem(primaryKey, '{corrupt');
        window.localStorage.setItem(backupKey, backupValue);
      },
      { backupKey: BACKUP_SAVE_KEY, backupValue: backup, primaryKey: SAVE_KEY },
    );
    await page.reload();
    await expect(page.getByText(/last-known-good save was restored/)).toBeVisible();
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Save transfer' }).click();
    await page.getByRole('button', { name: 'Restore last-known-good save' }).click();

    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
  });
});
