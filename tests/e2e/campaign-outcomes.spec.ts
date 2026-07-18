import { expect, test, type Page } from '@playwright/test';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { nearBankruptcyEnvelope, nearVictoryEnvelope } from '../fixtures/campaignFixtures';

test.describe('campaign outcomes through production import', () => {
  test('finishes Day 30, records victory, unlocks meta, and enters endless mode', async ({
    page,
  }) => {
    await page.goto('./');
    await importSave(page, serializeEnvelope(nearVictoryEnvelope()), 'near-victory.json');
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await page.getByRole('button', { name: 'Settle the day' }).click();
    await expect(page.getByRole('heading', { name: /local institution/ })).toBeVisible();
    await expect(page.getByText(/Unlocked: endless mode/)).toBeVisible();
    await page.getByRole('button', { name: 'Continue in endless mode' }).click();
    await expect(
      page.getByRole('heading', { name: /Day 31 · Endless · Specialty Cafe/ }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Records' }).click();
    await expect(page.getByText('Cafe Founder')).toBeVisible();
    await expect(page.getByText(/victory/i).first()).toBeVisible();
  });

  test('settles below the floor into bankruptcy with no endless action', async ({ page }) => {
    await page.goto('./');
    await importSave(page, serializeEnvelope(nearBankruptcyEnvelope()), 'near-bankruptcy.json');
    await page.getByRole('button', { name: 'Settle the day' }).click();
    await expect(page.getByRole('heading', { name: /till can’t stretch/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start fresh campaign' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue in endless mode' })).toHaveCount(0);
  });
});

async function importSave(page: Page, contents: string, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('tab', { name: 'Save transfer' }).click();
  await page.getByLabel('Import save JSON file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
}
