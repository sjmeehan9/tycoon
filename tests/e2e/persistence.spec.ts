import { expect, test } from '@playwright/test';

import { SAVE_KEY } from '../../src/persistence/saveStore';

// Hosted CI can contend for CPU/GPU across browser workers. This bound awaits
// the settled report state and is not renderer or simulation performance proof.
const CONSTRAINED_RUNNER_REPORT_TIMEOUT_MS = 60_000;

test.describe('autosaved continuation', () => {
  test('restores planning, service controls, report, and exact-once settlement', async ({
    page,
  }) => {
    test.setTimeout(180_000);
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
    const activeProgress = page.getByRole('progressbar');
    await expect
      .poll(async () => Number(await activeProgress.getAttribute('aria-valuenow')), {
        // Four production WebGL contexts share the local phase-gate runner.
        // Keep the same autosave checkpoint outcome without treating wall time
        // under that contention as a renderer performance claim.
        timeout: 20_000,
      })
      .toBeGreaterThanOrEqual(20);
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
    const progress = page.getByRole('progressbar');
    expect(Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(0);

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Protect the queue/ }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible({
      timeout: CONSTRAINED_RUNNER_REPORT_TIMEOUT_MS,
    });
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Cash reconciliation' })).toBeHidden();
    await page.getByText('View full Day 1 report').click();
    await expect(page.getByRole('list', { name: 'Canonical sale charges' })).toBeVisible();

    await page.getByRole('button', { name: 'Settle & reinvest' }).click();
    const settledCash = await page.locator('.status-strip dd').first().textContent();
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    await expect(page.locator('.status-strip dd').first()).toHaveText(settledCash ?? '');
    await expect(page.getByRole('button', { name: 'Settle & reinvest' })).toHaveCount(0);
    const settlement = await page.evaluate((saveKey) => {
      const save = JSON.parse(window.localStorage.getItem(saveKey) ?? '{}') as {
        activeRun?: {
          history?: Array<{
            chargeGroups?: Array<{ quantity: number; revenueCents: number }>;
            revenueCents: number;
            served: number;
          }>;
        };
      };
      const history = save.activeRun?.history ?? [];
      const report = history[0];
      return {
        historyLength: history.length,
        quantity: report?.chargeGroups?.reduce((total, group) => total + group.quantity, 0),
        revenueCents: report?.chargeGroups?.reduce((total, group) => total + group.revenueCents, 0),
        reportRevenueCents: report?.revenueCents,
        served: report?.served,
      };
    }, SAVE_KEY);
    expect(settlement.historyLength).toBe(1);
    expect(settlement.served).toBeGreaterThan(0);
    expect(settlement.quantity).toBe(settlement.served);
    expect(settlement.revenueCents).toBe(settlement.reportRevenueCents);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
