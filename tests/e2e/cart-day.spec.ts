import { expect, test } from '@playwright/test';

test.describe('complete seeded cart day', () => {
  test('plans, controls service, resolves an event, reports, reinvests, and continues', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('./');
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();

    const suppliesTab = page.getByRole('tab', { name: 'Supplies' });
    if (await suppliesTab.isVisible()) await suppliesTab.click();
    await page
      .getByRole('group', { name: 'Ice · 20 serves package quantity' })
      .getByRole('button', { name: /^Increase/ })
      .click();
    const menuTab = page.getByRole('tab', { name: 'Menu' });
    if (await menuTab.isVisible()) await menuTab.click();
    await page.getByRole('checkbox', { name: /Iced Latte/ }).check();
    await page.getByRole('button', { name: 'Open the cart' }).click();

    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.getByRole('button', { name: '4×' }).click();
    await expect(page.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Protect the queue/ }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('table', { name: 'Cash reconciliation' })).toBeVisible();
    await expect(page.getByText('Bottleneck', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Settle the day' }).click();
    await expect(page.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    const buySign = page.getByRole('button', { name: 'Buy sign' });
    if (await buySign.isEnabled()) await buySign.click();
    await page.getByRole('button', { name: 'Plan Day 2' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Day 2/ })).toBeVisible();
  });
});
