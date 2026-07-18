import { expect, test, type Locator, type Page } from '@playwright/test';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

test.describe('living rush scene', () => {
  test('renders and reloads exact paused reduced-motion truth within fixed bounds', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch, true, true);

    const scene = page.getByRole('img', { name: /12 customers waiting/ });
    await expect(scene).toHaveAttribute('width', '320');
    await expect(scene).toHaveAttribute('height', '180');
    await expect(scene).toHaveAttribute('data-animation', 'still');
    await expect(scene).toHaveAttribute('data-queue-count', '12');
    await expect(scene).toHaveAttribute('data-queue-overflow', '4');
    await expect(scene).toHaveAttribute('data-active-customer', 'd1-c1');
    await expect(scene).toHaveAttribute('data-last-event', 'd1-e6');
    await expect(page.getByText('QUEUE 12')).toBeVisible();
    await expect(page.getByText('+4 beyond view')).toBeVisible();
    await expect(page.getByText('SALE +$7.25')).toBeVisible();
    await expect(page.locator('.scene-hud-walkaway')).toHaveText('OUT OF STOCK');
    await expect(page.locator('.last-walkaway-note')).toContainText(/out of stock/i);

    const capture = await scene.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('living-rush-static.png'),
    });
    expect(capture.byteLength).toBeGreaterThan(1_000);
    const bounds = await scene.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bounds?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewportWidth,
    );

    await page.reload();
    await activate(page.getByRole('button', { name: 'Continue autosave' }), touch);
    const restored = page.getByRole('img', { name: /12 customers waiting/ });
    await expect(restored).toHaveAttribute('data-last-event', 'd1-e6');
    await expect(restored).toHaveAttribute('data-animation', 'still');
    await expect(page.getByText('SALE +$7.25')).toBeVisible();
  });

  test('animates bounded 4× playback within budget and freezes immediately on pause', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch, false, false);
    const scene = page.getByRole('img', { name: /customers waiting/ });
    await expect(scene).toHaveAttribute('data-animation', 'active');
    await expect(scene).toHaveAttribute('data-speed', '4');
    const elapsed = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let frames = 0;
          const started = performance.now();
          const next = (time: number): void => {
            frames += 1;
            if (frames === 30) resolve(time - started);
            else requestAnimationFrame(next);
          };
          requestAnimationFrame(next);
        }),
    );
    expect(elapsed).toBeLessThan(2_000);
    await activate(page.getByRole('button', { name: 'Pause' }), touch);
    await expect(scene).toHaveAttribute('data-animation', 'still');
    await expect(scene.locator('xpath=..')).toHaveAttribute('data-paused', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
  });

  test('finishes only bounded rush-end departures and then stops the report RAF', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await importLivingRush(page, touch, false, false, true);
    const scene = page.locator('canvas[role="img"]');
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect
      .poll(async () => Number(await scene.getAttribute('data-transient-count')))
      .toBeGreaterThan(0);
    await expect(scene).toHaveAttribute('data-animation', 'still', { timeout: 4_000 });
    await expect(scene).toHaveAttribute('data-transient-count', '0');
    await expect(scene).toHaveAccessibleName(/left when the rush ended/);
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
