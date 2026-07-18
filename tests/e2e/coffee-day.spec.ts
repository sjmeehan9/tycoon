import { expect, test } from '@playwright/test';

test.describe('complete specialty coffee trading day', () => {
  test('uses full menu content, supplies, beans, weather, segments, and causal reporting', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();

    const menuTab = page.getByRole('tab', { name: 'Menu' });
    if (await menuTab.isVisible()) await menuTab.click();
    await page.getByRole('checkbox', { name: /Mocha/ }).check();
    await expect(page.getByText('Cold Brew', { exact: true })).toBeAttached();

    const suppliesTab = page.getByRole('tab', { name: 'Supplies' });
    if (await suppliesTab.isVisible()) await suppliesTab.click();
    await page.getByLabel('Single origin · 500 g package quantity').fill('1');
    await page.getByLabel('Chocolate · 500 g package quantity').fill('1');
    await page.getByLabel('Soy milk · 1 L package quantity').fill('1');

    const dialTab = page.getByRole('tab', { name: 'Dial-in' });
    if (await dialTab.isVisible()) await dialTab.click();
    await page
      .getByRole('combobox', { name: 'Beans for espresso and filter' })
      .selectOption('singleOriginBeans');
    await page.getByRole('radio', { name: /Quality/ }).check();
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
    await expect(page.getByRole('heading', { name: 'Customers served' })).toBeVisible();
    await expect(page.getByText(/single origin changed shot quality/i)).toBeVisible();
    await expect(page.getByText(/weather:/i)).toBeVisible();
  });
});
