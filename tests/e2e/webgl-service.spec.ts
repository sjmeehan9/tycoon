import { expect, test, type Locator, type Page } from '@playwright/test';

import type { VenueId } from '../../src/game';
import { SAVE_KEY, serializeEnvelope } from '../../src/persistence/saveStore';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

test.describe('snapshot-only WebGL cart service', () => {
  test('lazy-loads a bounded fixed-isometric world on desktop and mobile', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await activate(page.getByRole('button', { name: 'Start new campaign' }), touch);
    await dismissOnboarding(page, touch);
    expect(await hasServiceWorldResource(page)).toBe(false);

    await activate(page.getByRole('button', { name: 'Open the cart' }), touch);
    await activate(page.getByRole('button', { name: 'Pause' }), touch);
    const frame = page.locator('figure[data-renderer="webgl"]');
    const scene = page.getByRole('img', { name: /Coffee Cart in/ });
    await expect(frame).toHaveAttribute('data-snapshot-only', 'true');
    await expect(frame).toHaveAttribute('data-camera', 'orthographic-isometric');
    await expect(frame).toHaveAttribute('data-instanced-people', 'true');
    await expect(frame).toHaveAttribute('data-dpr-max', '1.5');
    await expect(frame).toHaveAttribute('data-animation', 'still');
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    const canvas = frame.locator('.webgl-stage canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-render-authority', 'snapshot-only');
    expect(
      await canvas.evaluate(
        (element) => (element as HTMLCanvasElement).getContext('webgl2') !== null,
      ),
    ).toBe(true);
    expect(await hasServiceWorldResource(page)).toBe(true);
    await dismissPwaPrompt(page, touch);

    const screenshot = await frame.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('webgl-cart-service.png'),
    });
    expect(screenshot.byteLength).toBeGreaterThan(5_000);
    const bounds = await frame.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bounds?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewportWidth,
    );

    await openSettings(page, touch);
    await activate(page.getByRole('checkbox', { name: 'Reduce motion' }), touch);
    await closeGameMenu(page, touch);
    await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    await expect(frame).toHaveAttribute('data-animation', 'still');
    await expect(frame.locator('.webgl-stage canvas')).toHaveCount(1);
  });

  test('preserves paused economy truth across context loss, remount, motion, and speed changes', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch);
    const frame = page.locator('figure[data-renderer="webgl"]');
    const scene = page.getByRole('img', { name: /12 customers waiting/ });
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    await expect(frame).toHaveAttribute('data-queue-count', '12');
    await expect(frame).toHaveAttribute('data-active-customer', 'd1-c1');
    await expect(frame).toHaveAttribute('data-last-event', 'd1-e6');
    await expect(page.getByText('QUEUE 12')).toBeVisible();
    await expect(page.getByText('SALE +$7.25')).toBeVisible();
    await expect(page.locator('.scene-hud-walkaway')).toHaveText('OUT OF STOCK');
    await expect(scene).toHaveAccessibleName(/At the counter: Enthusiast customer d1-c1/);
    await expect(scene).toHaveAccessibleName(/Latest walkaway: Commuter customer d1-c21/);
    await dismissPwaPrompt(page, touch);
    const denseScreenshot = await frame.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('webgl-dense-rush.png'),
    });
    expect(denseScreenshot.byteLength).toBeGreaterThan(5_000);
    const before = await persistedEconomicTruth(page);

    const canvas = frame.locator('.webgl-stage canvas');
    const prevented = await canvas.evaluate((element) => {
      const event = new Event('webglcontextlost', { cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(true);
    await expect(page.getByRole('alert')).toContainText('3D context was interrupted');
    await expect(page.locator('[data-renderer-bridge]')).toHaveCount(0);
    expect(await persistedEconomicTruth(page)).toEqual(before);

    await activate(page.getByRole('button', { name: 'Retry 3D scene' }), touch);
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    await expect(frame.locator('.webgl-stage canvas')).toHaveCount(1);
    expect(await persistedEconomicTruth(page)).toEqual(before);

    for (const speed of [1, 2, 4] as const) {
      await activate(page.getByRole('button', { name: `${speed}×` }), touch);
      await expect(frame).toHaveAttribute('data-speed', String(speed));
      expect(await persistedEconomicTruth(page)).toEqual(before);
    }

    await openSettings(page, touch);
    await activate(page.getByRole('checkbox', { name: 'Reduce motion' }), touch);
    await closeGameMenu(page, touch);
    await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    await expect(frame.locator('.webgl-stage canvas')).toHaveCount(1);
    expect(await persistedEconomicTruth(page)).toEqual(before);
  });

  test('shows save-safe WebGL2 guidance and never falls back to the Canvas renderer', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value: () => null,
      });
    });
    await page.goto('./');
    await activate(page.getByRole('button', { name: 'Start new campaign' }), touch);
    await dismissOnboarding(page, touch);
    await activate(page.getByRole('button', { name: 'Open the cart' }), touch);
    await activate(page.getByRole('button', { name: 'Pause' }), touch);

    const scene = page.getByRole('img', { name: /Coffee Cart in/ });
    await expect(scene).toHaveAttribute('data-webgl-status', 'unsupported');
    await expect(page.getByRole('alert')).toContainText('3D service needs WebGL 2');
    await expect(page.getByRole('alert')).toContainText('campaign remains autosaved');
    await expect(page.getByRole('button', { name: 'Reload saved game' })).toBeVisible();
    await expect(page.locator('.webgl-stage canvas')).toHaveCount(0);
    await expect(page.locator('[data-renderer-bridge]')).toHaveCount(0);
    await activate(page.getByRole('button', { name: 'Retry 3D scene' }), touch);
    await expect(scene).toHaveAttribute('data-webgl-status', 'unsupported');
  });

  test('keeps the explicit kiosk and cafe service bridge runnable only on this branch', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    for (const venueId of ['kiosk', 'cafe'] as const) {
      await importLivingRush(page, touch, venueId);
      const bridge = page.locator('[data-renderer-bridge="temporary-kiosk-cafe"]');
      await expect(bridge).toHaveCount(1);
      await expect(bridge.getByRole('img')).toHaveAttribute('data-venue', venueId);
      await expect(page.locator('figure[data-renderer="webgl"]')).toHaveCount(0);
      expect(await hasServiceWorldResource(page)).toBe(false);
    }
  });
});

async function importLivingRush(
  page: Page,
  touch: boolean,
  venueId: VenueId = 'cart',
): Promise<void> {
  await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
  await activate(page.getByRole('tab', { name: 'Save transfer' }), touch);
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'webgl-living-rush.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      serializeEnvelope(livingRushEnvelope({ paused: true, reducedMotion: false, venueId })),
    ),
  });
  await expect(page.getByText('Imported Day 1 safely.')).toBeVisible();
  await closeGameMenu(page, touch);
}

async function openSettings(page: Page, touch: boolean): Promise<void> {
  await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
  await activate(page.getByRole('tab', { name: 'Settings' }), touch);
}

async function closeGameMenu(page: Page, touch: boolean): Promise<void> {
  const close = page.getByRole('button', { name: 'Close game menu' });
  if (await close.isVisible()) await activate(close, touch);
}

async function dismissOnboarding(page: Page, touch: boolean): Promise<void> {
  const skip = page.getByRole('button', { name: 'Skip onboarding' });
  if (await skip.isVisible()) await activate(skip, touch);
}

async function dismissPwaPrompt(page: Page, touch: boolean): Promise<void> {
  const prompt = page.getByRole('button', { name: 'Got it' });
  if (await prompt.isVisible()) await activate(prompt, touch);
}

async function activate(locator: Locator, touch: boolean): Promise<void> {
  if (touch) await locator.tap();
  else await locator.click();
}

async function hasServiceWorldResource(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .some(({ name }) => name.includes('/assets/ServiceWorld-')),
  );
}

async function persistedEconomicTruth(page: Page): Promise<unknown> {
  return page.evaluate((saveKey) => {
    const envelope = JSON.parse(window.localStorage.getItem(saveKey) ?? 'null') as {
      activeRun?: {
        cashCents: number;
        day: number;
        equipment: unknown;
        inventory: unknown;
        phase: string;
        reputation: number;
        rush: {
          activeService: unknown;
          queue: unknown;
          recentActivity: unknown;
          stats: unknown;
          tick: number;
        } | null;
      };
    } | null;
    const run = envelope?.activeRun;
    if (!run) return null;
    return {
      activeService: run.rush?.activeService,
      cashCents: run.cashCents,
      day: run.day,
      equipment: run.equipment,
      inventory: run.inventory,
      phase: run.phase,
      queue: run.rush?.queue,
      recentActivity: run.rush?.recentActivity,
      reputation: run.reputation,
      stats: run.rush?.stats,
      tick: run.rush?.tick,
    };
  }, SAVE_KEY);
}
