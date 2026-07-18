import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('stock lifecycle and capacity intelligence', () => {
  test('updates honest weighted planning capacity on desktop and 360px touch', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await activate(page.getByRole('button', { name: 'Start new campaign' }), touch);
    await dismissPlanningOverlays(page, touch);
    await showPlannerTab(page, 'Supplies', touch);

    const beansCapacity = page.getByLabel(
      'House blend usable stock and weighted serves after selected purchase',
    );
    await expect(beansCapacity).toContainText('500 g usable after order');
    await expect(beansCapacity).toContainText(/~\d+ serves/);
    await expect(beansCapacity).toContainText('500 g expires after Day 3 rush');
    const beans = page.getByRole('group', {
      name: 'House blend · 500 g package quantity',
    });
    await activate(beans.getByRole('button', { name: /^Increase/ }), touch);
    await expect(beansCapacity).toContainText('1,000 g usable after order');
    await expect(beansCapacity).toContainText('1,000 g pending');

    const chocolateCapacity = page.getByLabel(
      'Chocolate usable stock and weighted serves after selected purchase',
    );
    await expect(chocolateCapacity).toContainText('Not used today');
    const chocolate = page.getByRole('group', {
      name: 'Chocolate · 500 g package quantity',
    });
    await activate(chocolate.getByRole('button', { name: /^Increase/ }), touch);
    await expect(chocolateCapacity).toContainText('500 g usable after order');
    await expect(chocolateCapacity).toContainText('Not used today');

    await showPlannerTab(page, 'Menu', touch);
    await activate(page.getByRole('checkbox', { name: /Mocha/ }), touch);
    await showPlannerTab(page, 'Supplies', touch);
    await expect(chocolateCapacity).toContainText(/~\d+ serves/);
    await expect(chocolateCapacity).not.toContainText('Not used today');

    const estimates = await page.locator('.supply-capacity .capacity-estimate').allTextContents();
    expect(estimates.every((value) => value.startsWith('~') || value === 'Not used today')).toBe(
      true,
    );
    if (touch) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => window.innerWidth),
      );
      const bounds = await beansCapacity.evaluate((element) => {
        const rectangle = element.getBoundingClientRect();
        return { left: rectangle.left, right: rectangle.right, viewport: window.innerWidth };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
    }
  });
});

async function dismissPlanningOverlays(page: Page, touch: boolean): Promise<void> {
  await activate(page.getByRole('button', { name: 'Show current step' }), touch);
  const offlineReady = page.getByRole('button', { name: 'Got it' });
  const appeared = await offlineReady
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) await activate(offlineReady, touch);
}

async function showPlannerTab(page: Page, name: string, touch: boolean): Promise<void> {
  const tab = page.getByRole('tab', { name });
  if (await tab.isVisible()) await activate(tab, touch);
}

async function activate(locator: Locator, touch: boolean): Promise<void> {
  if (touch) await locator.tap();
  else await locator.click();
}
