import { expect, test, type Page } from '@playwright/test';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { growthReadyEnvelope } from '../fixtures/campaignFixtures';

test.describe('staff and investment operations', () => {
  test('hires both roles, schedules service, settles payroll, and reaches equipment growth', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('./');
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();

    const teamTab = page.getByRole('tab', { name: 'Team' });
    if (await teamTab.isVisible()) await teamTab.click();
    await page
      .getByRole('button', { name: /^Hire / })
      .first()
      .click();
    await page
      .getByRole('button', { name: /^Hire / })
      .first()
      .click();
    await page.getByRole('checkbox', { name: /Barista · speed/ }).check();
    await page.getByRole('checkbox', { name: /Front of house · speed/ }).check();
    await expect(page.getByText(/2\/2 scheduled/)).toBeVisible();
    await expect(page.getByText(/payroll at close/)).toBeVisible();

    await page.getByRole('button', { name: 'Open the cart' }).click();
    await page.getByRole('button', { name: '4×' }).click();
    while ((await page.getByRole('heading', { name: 'How the cart traded' }).count()) === 0) {
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.getByRole('button').first().click();
      } else {
        await page.waitForTimeout(250);
      }
    }
    await page.getByText('View full Day 1 report').click();
    await expect(page.getByRole('row', { name: /Staff wages/ })).toBeVisible();
    await expect(page.getByText(/scheduled team members cost/i)).toBeVisible();
    await page.getByRole('button', { name: 'Settle & reinvest' }).click();
    await expect(page.getByRole('heading', { name: 'Equipment workshop' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Promote to Coffee Kiosk' })).toBeDisabled();
    const grinder = page.getByRole('button', { name: /Buy Grinder level 1/ });
    await expect(grinder).toBeEnabled();
    await grinder.click();
    await expect(page.getByText('Current: +2 cup quality')).toBeVisible();
  });

  test('promotes the validated business from cart through kiosk to cafe', async ({ page }) => {
    await page.goto('./');
    await importSave(page, serializeEnvelope(growthReadyEnvelope()));
    await expect(page.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Day 18/30 · Coffee Cart' })).toBeVisible();
    await expect(page.locator('figure[data-renderer]')).toHaveCount(0);

    await page.getByRole('button', { name: /Buy Grinder level 1/ }).click();
    await page.getByRole('button', { name: /Buy Espresso machine level 1/ }).click();
    await page.getByRole('button', { name: 'Promote to Coffee Kiosk' }).click();
    await expect(page.getByRole('heading', { name: 'Day 18/30 · Coffee Kiosk' })).toBeVisible();
    await expect(page.locator('figure[data-renderer]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Promote to Specialty Cafe' })).toBeDisabled();

    await page.getByRole('button', { name: /Buy Grinder level 2/ }).click();
    await page.getByRole('button', { name: /Buy Espresso machine level 2/ }).click();
    await page.getByRole('button', { name: /Buy Refrigeration level 1/ }).click();
    await page.getByRole('button', { name: /Buy Point of sale level 1/ }).click();
    await page.getByRole('button', { name: 'Promote to Specialty Cafe' }).click();

    await expect(page.getByRole('heading', { name: 'Flagship venue complete' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Day 18/30 · Specialty Cafe' })).toBeVisible();
    await expect(page.locator('figure[data-renderer]')).toHaveCount(0);
  });
});

async function importSave(page: Page, contents: string): Promise<void> {
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('tab', { name: 'Save transfer' }).click();
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'growth-ready.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
}
