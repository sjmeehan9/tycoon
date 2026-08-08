import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { SERVICE_DASHBOARD_FIELDS } from '../../src/components/RushPanel';

test.describe('accessible primary flow', () => {
  test('completes a reduced-motion day with keyboard focus and semantic dialogs', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop keyboard journey');
    test.setTimeout(90_000);
    await page.goto('./');
    await expectNoSeriousViolations(page);

    await activateWithKeyboard(page, page.getByRole('button', { name: 'Start new campaign' }));
    await expect(page.getByRole('button', { name: 'Show current step' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('First-day guide · step 1/4')).toBeVisible();

    const menuTrigger = page.getByRole('button', { name: 'Game menu' });
    await activateWithKeyboard(page, menuTrigger);
    await expect(page.getByRole('button', { name: 'Close game menu' })).toBeFocused();
    const settings = page.getByRole('tab', { name: 'Settings' });
    await settings.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Records' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(settings).toBeFocused();
    await activateWithKeyboard(
      page,
      page.getByRole('checkbox', { name: 'Reduce motion' }),
      'Space',
    );
    await expectNoSeriousViolations(page);
    await page.keyboard.press('Escape');
    await expect(menuTrigger).toBeFocused();

    await activateWithKeyboard(page, page.getByRole('button', { name: 'Open the cart' }));
    await expect(page.getByRole('img', { name: /Coffee Cart in/ })).toHaveAttribute(
      'data-animation',
      'still',
    );
    await expectCompleteServiceDashboard(page);
    await activateWithKeyboard(page, page.getByRole('button', { name: '4×' }));
    await finishRushWithKeyboard(page);

    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect(page.getByText(/Day 1 report\. Served/)).toBeAttached();
    await expectNoSeriousViolations(page);
    await activateWithKeyboard(page, page.getByRole('button', { name: 'Settle the day' }));
    await expect(page.getByText('First-day guide · step 4/4')).toBeVisible();
  });

  test('completes the primary flow by touch at 360px with reachable targets', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'touch-mobile', 'Touch-mobile journey');
    test.setTimeout(90_000);
    await page.goto('./');
    await page.getByRole('button', { name: 'Start new campaign' }).tap();
    const forecastBounds = await page.locator('.forecast-badge').evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(forecastBounds.left).toBeGreaterThanOrEqual(0);
    expect(forecastBounds.right).toBeLessThanOrEqual(forecastBounds.viewportWidth);
    await page.getByRole('button', { name: 'Show current step' }).tap();
    await page.getByRole('tab', { name: 'Supplies' }).tap();
    await expect(page.getByRole('tabpanel', { name: 'Supplies' })).toBeVisible();
    await assertVisibleTouchTargets(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );

    await page.getByRole('button', { name: 'Open the cart' }).tap();
    await expectCompleteServiceDashboard(page);
    await assertVisibleTouchTargets(page.locator('[data-service-section="dashboard"]'));
    await page.getByRole('button', { name: '4×' }).tap();
    await finishRushByTouch(page);
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect(page.getByText(/Day 1 report\. Served/)).toBeAttached();
    await page.getByRole('button', { name: 'Settle the day' }).tap();
    await expect(page.getByRole('heading', { name: 'Equipment workshop' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
  });
});

async function activateWithKeyboard(page: Page, locator: Locator, key = 'Enter'): Promise<void> {
  await locator.focus();
  await page.keyboard.press(key);
}

async function finishRushWithKeyboard(page: Page): Promise<void> {
  while ((await page.getByRole('heading', { name: 'How the cart traded' }).count()) === 0) {
    const event = page.locator('.event-dialog');
    if ((await event.count()) > 0 && (await event.isVisible())) {
      await expect(event.getByRole('button').first()).toBeFocused();
      await page.keyboard.press('Enter');
    } else {
      await page.waitForTimeout(250);
    }
  }
}

async function finishRushByTouch(page: Page): Promise<void> {
  while ((await page.getByRole('heading', { name: 'How the cart traded' }).count()) === 0) {
    const event = page.locator('.event-dialog');
    if ((await event.count()) > 0 && (await event.isVisible())) {
      await event.getByRole('button').first().tap();
    } else {
      await page.waitForTimeout(250);
    }
  }
}

async function assertVisibleTouchTargets(root: Page | Locator): Promise<void> {
  const undersized = await root
    .locator('button:visible, select:visible, input[type="number"]:visible')
    .evaluateAll((elements) =>
      elements
        .map((element) => {
          const rectangle = element.getBoundingClientRect();
          return {
            height: rectangle.height,
            label: element.getAttribute('aria-label') ?? element.textContent,
            width: rectangle.width,
          };
        })
        .filter(({ height, width }) => height < 44 || width < 44),
    );
  expect(undersized).toEqual([]);
}

async function expectCompleteServiceDashboard(page: Page): Promise<void> {
  for (const field of SERVICE_DASHBOARD_FIELDS) {
    await expect(page.locator(`[data-dashboard-field="${field}"]`)).toBeVisible();
  }
}

async function expectNoSeriousViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
  ).toEqual([]);
}
