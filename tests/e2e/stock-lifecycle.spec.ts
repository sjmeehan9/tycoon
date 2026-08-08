import { expect, test, type Locator, type Page } from '@playwright/test';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { stockLifecyclePlanningEnvelope } from '../fixtures/campaignFixtures';

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

  test('reconciles planning, live depletion, reload, LIFO expiry, and actual charges', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await dismissOfflineReady(page, touch);
    await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
    await activate(page.getByRole('tab', { name: 'Save transfer' }), touch);
    await page.getByLabel('Import save JSON file').setInputFiles({
      name: 'stock-lifecycle-day-3.json',
      mimeType: 'application/json',
      buffer: Buffer.from(serializeEnvelope(stockLifecyclePlanningEnvelope())),
    });
    await expect(page.getByText('Imported Day 3 safely.')).toBeVisible();
    const closeMenu = page.getByRole('button', { name: 'Close game menu' });
    if ((await closeMenu.count()) > 0 && (await closeMenu.isVisible())) {
      await activate(closeMenu, touch);
    }
    await showPlannerTab(page, 'Supplies', touch);

    const dairyCapacity = page.getByLabel(
      'Dairy milk usable stock and weighted serves after selected purchase',
    );
    await expect(dairyCapacity).toContainText('8,500 ml usable after order');
    await expect(dairyCapacity).toContainText('500 ml carried + 8,000 ml pending');
    await expect(dairyCapacity).toContainText('500 ml expires after Day 3 rush');

    await activate(page.getByRole('button', { name: 'Open the cart' }), touch);
    const stockGrid = page.getByRole('list', { name: 'Live rush stock' });
    await expect(stockGrid.getByRole('listitem')).toHaveCount(9);
    expect(
      (await stockGrid.locator('.rush-stock-name strong').allTextContents()).slice(0, 4),
    ).toEqual(['House blend', 'Dairy milk', 'Oat milk', 'Soy milk']);
    const dairyLive = stockGrid.locator('[data-ingredient="dairyMilk"]');
    await expect(dairyLive).toContainText('8,500 ml remaining');
    await expect(dairyLive).toContainText(/~\d+ serves/);
    await expect(dairyLive).toContainText('500 ml expires after this Day 3 rush');
    const chocolateLive = stockGrid.locator('[data-ingredient="chocolate"]');
    await expect(chocolateLive).toContainText('0 g remaining');
    await expect(chocolateLive).toContainText('Out of stock');
    await expect(chocolateLive).toContainText('Not used today');
    await expect(stockGrid.locator('[aria-live]')).toHaveCount(0);

    await activate(page.getByRole('button', { name: '4×' }), touch);
    const beansLive = stockGrid.locator('[data-ingredient="houseBeans"]');
    await expect
      .poll(async () => ingredientQuantity(beansLive), { timeout: 20_000 })
      .toBeLessThan(1_000);
    await activate(page.getByRole('button', { name: 'Pause' }), touch);
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    const pausedSnapshot = await stockGrid.locator('.rush-stock-quantity strong').allTextContents();

    await page.reload();
    await dismissOfflineReady(page, touch);
    await activate(page.getByRole('button', { name: 'Continue autosave' }), touch);
    const restoredGrid = page.getByRole('list', { name: 'Live rush stock' });
    await expect(restoredGrid.getByRole('listitem')).toHaveCount(9);
    expect(await restoredGrid.locator('.rush-stock-quantity strong').allTextContents()).toEqual(
      pausedSnapshot,
    );
    if (touch) await expectWithinViewport(restoredGrid);
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'true');
    await activate(page.getByRole('button', { name: 'Resume' }), touch);
    await finishRush(page, touch);
    await activate(page.getByText('View full Day 3 report'), touch);

    const lifecycle = page.getByRole('table', { name: 'Inventory lifecycle reconciliation' });
    await expect(lifecycle).toBeVisible();
    const dairyRow = lifecycle.getByRole('row', { name: /^Dairy milk/ });
    const cells = dairyRow.getByRole('cell');
    const opening = ingredientTextQuantity(await cells.nth(0).textContent());
    const purchased = ingredientTextQuantity(await cells.nth(1).textContent());
    const consumed = ingredientTextQuantity(await cells.nth(2).textContent());
    const expired = ingredientTextQuantity(await cells.nth(3).textContent());
    const rolled = ingredientTextQuantity(await cells.nth(4).textContent());
    expect({ opening, purchased, expired }).toEqual({
      opening: 500,
      purchased: 8_000,
      expired: 500,
    });
    expect(consumed).toBeGreaterThan(0);
    expect(opening + purchased - consumed - expired).toBe(rolled);
    await expect(cells.nth(5)).toContainText(
      `${numberLabel(opening)} ml + ${numberLabel(purchased)} ml − ${numberLabel(consumed)} ml − ${numberLabel(expired)} ml = ${numberLabel(rolled)} ml`,
    );
    await expect(page.locator('.expiry-cause')).toContainText(
      'after the Day 3 rush, Dairy milk 500 ml reached the inclusive last usable day',
    );
    await expect(page.getByRole('heading', { name: 'Actual charges' })).toBeVisible();
    await expect(page.getByText(/matching sales revenue/i)).toBeVisible();

    if (touch) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => window.innerWidth),
      );
      await expectWithinViewport(page.locator('.lifecycle-table-scroll'));
      const scrollPosition = await page.locator('.lifecycle-table-scroll').evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        return element.scrollLeft;
      });
      expect(scrollPosition).toBeGreaterThan(0);
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

async function dismissOfflineReady(page: Page, touch: boolean): Promise<void> {
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

async function finishRush(page: Page, touch: boolean): Promise<void> {
  while ((await page.getByRole('heading', { name: 'How the cart traded' }).count()) === 0) {
    const event = page.locator('.event-dialog');
    if ((await event.count()) > 0 && (await event.isVisible())) {
      await expect(
        page.getByRole('list', { name: 'Live rush stock' }).getByRole('listitem'),
      ).toHaveCount(9);
      await activate(event.getByRole('button').first(), touch);
    } else {
      await page.waitForTimeout(250);
    }
  }
}

async function ingredientQuantity(row: Locator): Promise<number> {
  return ingredientTextQuantity(await row.locator('.rush-stock-quantity strong').textContent());
}

function ingredientTextQuantity(text: string | null): number {
  const match = text?.match(/[\d,]+(?:\.\d+)?/);
  if (!match) throw new Error(`Expected an ingredient quantity in ${String(text)}.`);
  return Number(match[0].replaceAll(',', ''));
}

function numberLabel(quantity: number): string {
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 }).format(quantity);
}

async function expectWithinViewport(locator: Locator): Promise<void> {
  const bounds = await locator.evaluate((element) => {
    const rectangle = element.getBoundingClientRect();
    return { left: rectangle.left, right: rectangle.right, viewport: window.innerWidth };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
}
