import { expect, test, type Locator, type Page } from '@playwright/test';

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

  test('persists an amended one-drink price and reconciles actual charges to settled cash', async ({
    page,
  }, testInfo) => {
    test.setTimeout(100_000);
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await activate(page.getByRole('button', { name: 'Start new campaign' }), touch);
    await dismissPlanningOverlays(page, touch);

    await activate(page.getByRole('checkbox', { name: /Long Black/ }), touch);
    await expect(page.getByRole('checkbox', { name: /Long Black/ })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: /Flat White/ })).toBeChecked();
    const price = page.getByRole('group', { name: 'Flat White price' });
    const increasePrice = price.getByRole('button', { name: /^Increase/ });
    for (let index = 0; index < 10; index += 1) await activate(increasePrice, touch);
    await expect(price.locator('output')).toContainText('$6.50');

    await showPlannerTab(page, 'Supplies', touch);
    for (const [label, activations] of [
      ['House blend · 500 g package quantity', 2],
      ['Dairy milk · 2 L package quantity', 2],
      ['Oat milk · 1 L package quantity', 3],
      ['Soy milk · 1 L package quantity', 3],
    ] as const) {
      const increase = page
        .getByRole('group', { name: label })
        .getByRole('button', { name: /^Increase/ });
      for (let index = 0; index < activations; index += 1) await activate(increase, touch);
    }
    await showPlannerTab(page, 'Dial-in', touch);
    await activate(page.getByRole('radio', { name: /Quality/ }), touch);

    await page.reload();
    await dismissOfflineReady(page, touch);
    await activate(page.getByRole('button', { name: 'Continue autosave' }), touch);
    await dismissPlanningOverlays(page, touch);
    await showPlannerTab(page, 'Menu', touch);
    await expect(page.getByRole('checkbox', { name: /Long Black/ })).not.toBeChecked();
    await expect(
      page.getByRole('group', { name: 'Flat White price' }).locator('output'),
    ).toContainText('$6.50');

    await activate(page.getByRole('button', { name: 'Open the cart' }), touch);
    await activate(page.getByRole('button', { name: '4×' }), touch);
    await waitForFirstSale(page, touch);
    await expect(page.locator('.last-sale-note')).toContainText('Flat White');
    await expect(page.locator('.last-sale-note')).toContainText('actual charge');
    await finishRush(page, touch);

    const chargeList = page.getByRole('list', { name: 'Recent actual sale charges' });
    await expect(chargeList).toBeVisible();
    const equations = await chargeList.locator('strong').allTextContents();
    expect(equations.length).toBeGreaterThan(0);
    const validCharges = new Set([650, 710, 730, 740, 800, 820]);
    for (const equation of equations) {
      const unitCharge = moneyMatches(equation)[0];
      expect(validCharges.has(unitCharge ?? -1)).toBe(true);
    }

    const salesRevenue = await reportRowCents(page, 'Sales revenue');
    const observedTotal = parseMoney(await page.locator('.sale-observation-total').textContent());
    expect(observedTotal).toBe(salesRevenue);
    await expect(page.locator('.sale-observation-summary')).toContainText('matching sales revenue');
    if (touch) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => window.innerWidth),
      );
      const chargeBounds = await chargeList.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, viewport: window.innerWidth };
      });
      expect(chargeBounds.left).toBeGreaterThanOrEqual(0);
      expect(chargeBounds.right).toBeLessThanOrEqual(chargeBounds.viewport);
    }
    const openingCash = await reportRowCents(page, 'Opening cash');
    const purchaseCost = await reportRowCents(page, 'Supply purchases');
    const eventCash = await reportRowCents(page, 'Event cash adjustments');
    const wageCost = await reportRowCents(page, 'Staff wages');
    const operatingCost = await reportRowCents(page, 'Venue and equipment costs');
    const closingCash = await reportRowCents(page, 'Closing cash');
    expect(closingCash).toBe(
      openingCash + salesRevenue + eventCash + purchaseCost + wageCost + operatingCost,
    );

    await activate(page.getByRole('button', { name: 'Settle the day' }), touch);
    expect(parseMoney(await page.locator('.status-strip dd').first().textContent())).toBe(
      closingCash,
    );
  });
});

async function dismissPlanningOverlays(page: Page, touch: boolean): Promise<void> {
  const showStep = page.getByRole('button', { name: 'Show current step' });
  if (touch) await showStep.tap();
  else await showStep.click();

  await dismissOfflineReady(page, touch);
}

async function dismissOfflineReady(page: Page, touch: boolean): Promise<void> {
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

async function activate(locator: Locator, touch: boolean): Promise<void> {
  if (touch) await locator.tap();
  else await locator.click();
}

async function showPlannerTab(page: Page, name: string, touch: boolean): Promise<void> {
  const tab = page.getByRole('tab', { name });
  if (await tab.isVisible()) await activate(tab, touch);
}

async function waitForFirstSale(page: Page, touch: boolean): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (
      await page
        .locator('.last-sale-note')
        .isVisible()
        .catch(() => false)
    )
      return;
    await resolveVisibleEvent(page, touch);
    await page.waitForTimeout(250);
  }
  throw new Error('No completed sale became visible during the rush.');
}

async function finishRush(page: Page, touch: boolean): Promise<void> {
  while ((await page.getByRole('heading', { name: 'How the cart traded' }).count()) === 0) {
    await resolveVisibleEvent(page, touch);
    await page.waitForTimeout(250);
  }
}

async function resolveVisibleEvent(page: Page, touch: boolean): Promise<void> {
  const event = page.locator('.event-dialog');
  if ((await event.count()) > 0 && (await event.isVisible())) {
    await activate(event.getByRole('button').first(), touch);
  }
}

async function reportRowCents(page: Page, label: string): Promise<number> {
  const value = await page
    .getByRole('row', { name: new RegExp(`^${label}`) })
    .locator('td')
    .textContent();
  return parseMoney(value);
}

function moneyMatches(value: string): number[] {
  return [...value.matchAll(/\$([\d,]+\.\d{2})/g)].map((match) =>
    Math.round(Number((match[1] ?? '0').replaceAll(',', '')) * 100),
  );
}

function parseMoney(value: string | null): number {
  const cents = moneyMatches(value ?? '')[0];
  if (cents === undefined) throw new Error(`Expected a money value in ${String(value)}.`);
  return /[−-]/.test(value ?? '') ? -cents : cents;
}
