import { expect, test } from '@playwright/test';

test.describe('autosaved continuation', () => {
  test('restores planning, service controls, report, and exact-once settlement', async ({
    page,
  }) => {
    test.setTimeout(100_000);
    await page.goto('./');
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();

    await page.getByRole('button', { name: 'Open the cart' }).click();
    await page.getByRole('button', { name: '4×' }).click();
    await page.waitForTimeout(1_600);
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
    const progress = page.getByRole('progressbar');
    expect(Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(0);

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Protect the queue/ }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible({
      timeout: 30_000,
    });
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();

    await page.getByRole('button', { name: 'Settle the day' }).click();
    const settledCash = await page.locator('.status-strip dd').first().textContent();
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    await expect(page.locator('.status-strip dd').first()).toHaveText(settledCash ?? '');
    await expect(page.getByRole('button', { name: 'Settle the day' })).toHaveCount(0);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
