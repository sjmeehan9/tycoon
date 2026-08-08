import { expect, test } from '@playwright/test';

test.describe('original presentation and local audio', () => {
  test('loads original art, fits the WebGL service scene, and persists audio consent', async ({
    page,
  }) => {
    await page.goto('./');
    const titleArt = page.locator('.title-art');
    await expect(titleArt).toBeVisible();
    expect(
      await titleArt.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth === 1_600,
      ),
    ).toBe(true);
    await page.waitForLoadState('networkidle');
    expect(
      await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .map(({ name }) => new URL(name).pathname)
          .filter((pathname) => pathname.includes('/assets/audio/')),
      ),
    ).toEqual([]);

    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    await expect(page.locator('figure[data-renderer]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Open the cart' }).click();
    const serviceWorld = page.locator('figure[data-renderer="webgl"]');
    const scene = serviceWorld.getByRole('img', { name: /Coffee Cart in/ });
    await expect(serviceWorld).toHaveAttribute('data-venue', 'cart');
    await expect(serviceWorld).toHaveAttribute('data-camera', 'orthographic-isometric');
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    const canvas = serviceWorld.locator('.webgl-stage canvas');
    await expect(canvas).toHaveAttribute('data-render-authority', 'snapshot-only');
    expect(await canvas.evaluate((element) => getComputedStyle(element).imageRendering)).toBe(
      'auto',
    );
    const dimensions = await serviceWorld.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(dimensions?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewportWidth,
    );
    await expect(page.locator('canvas[width="320"]')).toHaveCount(0);
    await expect(page.locator('[data-renderer-bridge]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Settings' }).click();
    const sounds = page.getByRole('checkbox', { name: 'Interface sounds' });
    const ambience = page.getByRole('checkbox', { name: 'Cafe ambience' });
    await expect(sounds).not.toBeChecked();
    await expect(ambience).not.toBeChecked();
    await sounds.check();
    await ambience.check();

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('tab', { name: 'Settings' }).click();
    await expect(page.getByRole('checkbox', { name: 'Interface sounds' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Cafe ambience' })).toBeChecked();
  });
});
