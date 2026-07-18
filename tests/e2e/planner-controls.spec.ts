import { expect, test, type Page } from '@playwright/test';

test.describe('exact accessible planner controls', () => {
  test('uses keyboard increments and disables desktop controls at price bounds', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop keyboard journey');
    await page.goto('./');
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await dismissPlanningOverlays(page, false);
    await expect(page.getByRole('spinbutton')).toHaveCount(0);

    const price = page.getByRole('group', { name: 'Flat White price' });
    const increase = price.getByRole('button', { name: 'Increase Flat White price by $0.10' });
    await increase.focus();
    await page.keyboard.press('Enter');
    await expect(price.locator('output')).toContainText('$5.60');
    await page.keyboard.press('Space');
    await expect(price.locator('output')).toContainText('$5.70');

    for (let index = 0; index < 63; index += 1) await page.keyboard.press('Enter');
    await expect(price.locator('output')).toContainText('$12.00');
    await expect(increase).toBeDisabled();
    await expect(price.getByRole('button', { name: /^Decrease/ })).toBeEnabled();
  });

  test('uses 44px touch controls at 360px and honors package bounds without overflow', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'touch-mobile', 'Touch-mobile journey');
    await page.goto('./');
    await page.getByRole('button', { name: 'Start new campaign' }).tap();
    await dismissPlanningOverlays(page, true);
    const price = page.getByRole('group', { name: 'Flat White price' });
    await price.getByRole('button', { name: /^Increase/ }).tap();
    await expect(price.locator('output')).toContainText('$5.60');

    await page.getByRole('tab', { name: 'Supplies' }).tap();
    const ice = page.getByRole('group', { name: 'Ice · 20 serves package quantity' });
    const decrement = ice.getByRole('button', { name: /^Decrease/ });
    const increment = ice.getByRole('button', { name: /^Increase/ });
    await expect(decrement).toBeDisabled();
    for (let index = 0; index < 20; index += 1) await increment.tap();
    await expect(ice.locator('output')).toContainText('20');
    await expect(increment).toBeDisabled();

    const targetSizes = await page.locator('.stepper button:visible').evaluateAll((buttons) =>
      buttons.map((button) => {
        const bounds = button.getBoundingClientRect();
        return { height: bounds.height, width: bounds.width };
      }),
    );
    expect(targetSizes.every(({ height, width }) => height >= 44 && width >= 44)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
  });
});

async function dismissPlanningOverlays(page: Page, touch: boolean): Promise<void> {
  const showStep = page.getByRole('button', { name: 'Show current step' });
  if (touch) await showStep.tap();
  else await showStep.click();

  const offlineReady = page.getByRole('button', { name: 'Got it' });
  const appeared = await offlineReady
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    if (touch) await offlineReady.tap();
    else await offlineReady.click();
  }
}
