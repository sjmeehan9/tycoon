import { expect, test, type Locator, type Page } from '@playwright/test';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

test.describe('living rush scene', () => {
  test('renders and reloads exact paused reduced-motion WebGL truth within fixed bounds', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch, true, true);

    const frame = page.locator('figure[data-renderer="webgl"]');
    const scene = frame.getByRole('img', { name: /12 customers waiting/ });
    await expect(frame).toHaveAttribute('data-animation', 'still');
    await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    await expect(frame).toHaveAttribute('data-paused', 'true');
    await expect(frame).toHaveAttribute('data-queue-count', '12');
    await expect(frame).toHaveAttribute('data-visible-customers', '12');
    await expect(frame).toHaveAttribute('data-max-visible-customers', '12');
    await expect(frame).toHaveAttribute('data-queue-overflow', '0');
    await expect(frame).toHaveAttribute('data-active-customer', 'd1-c1');
    await expect(frame).toHaveAttribute('data-last-event', 'd1-e6');
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    await expect(page.getByText('QUEUE 12')).toBeVisible();
    await expect(page.getByText(/beyond view/)).toHaveCount(0);
    await expect(page.getByText('SALE +$7.25')).toBeVisible();
    await expect(page.locator('.scene-hud-walkaway')).toHaveText('OUT OF STOCK');
    await expect(page.locator('.last-walkaway-note')).toContainText(/out of stock/i);

    const capture = await frame.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('living-rush-static.png'),
    });
    expect(capture.byteLength).toBeGreaterThan(5_000);
    const bounds = await frame.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bounds?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewportWidth,
    );

    await page.reload();
    await activate(page.getByRole('button', { name: 'Continue autosave' }), touch);
    const restored = page.locator('figure[data-renderer="webgl"]');
    await expect(restored).toHaveAttribute('data-last-event', 'd1-e6');
    await expect(restored).toHaveAttribute('data-animation', 'still');
    await expect(restored.getByRole('img')).toHaveAttribute('data-webgl-status', 'ready');
    await expect(page.getByText('SALE +$7.25')).toBeVisible();
  });

  test('animates bounded 4× playback and freezes immediately on pause', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch, false, false);
    const frame = page.locator('figure[data-renderer="webgl"]');
    await expect(frame.getByRole('img', { name: /customers waiting/ })).toHaveAttribute(
      'data-webgl-status',
      'ready',
    );
    await expect(frame).toHaveAttribute('data-animation', 'active');
    await expect(frame).toHaveAttribute('data-speed', '4');
    const frameTimes = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const observed: number[] = [];
          const next = (time: number): void => {
            observed.push(time);
            if (observed.length === 3) resolve(observed);
            else requestAnimationFrame(next);
          };
          requestAnimationFrame(next);
        }),
    );
    // Callback ordering proves browser-loop liveness without turning a
    // contended headless runner into a desktop or physical FPS claim.
    expect(frameTimes).toHaveLength(3);
    const [first = Number.NaN, second = Number.NaN, third = Number.NaN] = frameTimes;
    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);
    await activate(page.getByRole('button', { name: 'Pause' }), touch);
    await expect(frame).toHaveAttribute('data-animation', 'still');
    await expect(frame).toHaveAttribute('data-paused', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
  });

  test('stops WebGL rendering when the ending rush reaches the compact report', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch, false, false, true);
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect(page.getByLabel('Day 1 result summary')).toBeVisible();
    await expect(page.locator('figure[data-renderer="webgl"]')).toHaveCount(0);
    await expect(page.locator('.webgl-stage canvas')).toHaveCount(0);
    await expect(page.getByRole('table', { name: 'Cash reconciliation' })).toBeHidden();
  });
});

async function importLivingRush(
  page: Page,
  touch: boolean,
  paused: boolean,
  reducedMotion: boolean,
  endingSoon = false,
): Promise<void> {
  await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
  await activate(page.getByRole('tab', { name: 'Save transfer' }), touch);
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'living-rush.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      serializeEnvelope(livingRushEnvelope({ endingSoon, paused, reducedMotion })),
    ),
  });
  await expect(page.getByText('Imported Day 1 safely.')).toBeVisible();
  const close = page.getByRole('button', { name: 'Close game menu' });
  if (await close.isVisible()) await activate(close, touch);
}

async function activate(locator: Locator, touch: boolean): Promise<void> {
  if (touch) await locator.tap();
  else await locator.click();
}
