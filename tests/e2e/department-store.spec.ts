import { expect, test, type Page } from '@playwright/test';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { growthReadyEnvelope } from '../fixtures/campaignFixtures';

test.describe('department-store progression and service shell', () => {
  test('promotes one saved business, unlocks every commercial tier, and opens the heritage hall', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await importSave(page, serializeEnvelope(growthReadyEnvelope()));

    await buy(page, 'Grinder', 1);
    await buy(page, 'Espresso machine', 1);
    await page.getByRole('button', { name: 'Promote to Coffee Kiosk' }).click();

    await buy(page, 'Grinder', 2);
    await buy(page, 'Espresso machine', 2);
    await buy(page, 'Refrigeration', 1);
    await buy(page, 'Point of sale', 1);
    await page.getByRole('button', { name: 'Promote to Specialty Cafe' }).click();
    await page.getByRole('button', { name: 'Promote to Department Store Coffee Hall' }).click();

    await buy(page, 'Grinder', 3);
    await buy(page, 'Espresso machine', 3);
    for (const level of [1, 2, 3]) await buy(page, 'Batch brewer', level);
    for (const level of [2, 3]) await buy(page, 'Refrigeration', level);
    for (const level of [2, 3]) await buy(page, 'Point of sale', level);
    for (const level of [1, 2, 3]) await buy(page, 'Service counter', level);

    await expect(
      page.getByRole('heading', { name: /Day 18\/40 · Department Store Coffee Hall/ }),
    ).toBeVisible();
    await expect(page.getByText('Flagship venue complete')).toBeVisible();
    await expect(page.getByText('Level 3/3')).toHaveCount(6);
    await expect(page.getByText(/99% reliability/).first()).toBeVisible();
    await expect(page.getByText(/maintenance/).first()).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(
      page.getByRole('heading', { name: /Day 18\/40 · Department Store Coffee Hall/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Plan Day 19' }).click();
    await expect(
      page.getByRole('heading', { name: 'Set up the department-store coffee hall' }),
    ).toBeVisible();
    await expect(page.getByText('Menu and prices · choose up to 10')).toBeVisible();

    for (const checkbox of await page.locator('.check-row input[type="checkbox"]').all()) {
      if (!(await checkbox.isChecked())) await checkbox.check();
    }
    await page.getByRole('button', { name: 'Open the department-store coffee hall' }).click();

    const world = page.locator('[data-service-section="scene"]');
    await expect(world).toHaveAttribute('data-venue', 'departmentStore');
    await expect(world).toHaveAttribute('data-world', 'heritage-department-store-coffee-hall');
    await expect(world).toHaveAttribute('data-queue-capacity', '32');
    await expect(world).toHaveAttribute(
      'data-equipment',
      'grinder:3,espressoMachine:3,batchBrewer:3,refrigeration:3,pos:3,serviceCounter:3',
    );
    await expect(world).toHaveAttribute('data-snapshot-only', 'true');
    await expect(page.locator('[data-station]')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /Department Store Coffee Hall/ })).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('department-store-service.png'),
    });
  });
});

async function buy(page: Page, equipment: string, level: number): Promise<void> {
  await page.getByRole('button', { name: `Buy ${equipment} level ${level}` }).click();
}

async function importSave(page: Page, contents: string): Promise<void> {
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('tab', { name: 'Save transfer' }).click();
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'department-growth-ready.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
}
