import { expect, test } from '@playwright/test';

test.describe('pixel presentation and local audio', () => {
  test('loads original art, keeps the scene crisp and fitted, and persists audio consent', async ({
    page,
  }) => {
    await page.goto('/');
    const titleArt = page.locator('.title-art');
    await expect(titleArt).toBeVisible();
    expect(
      await titleArt.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth === 1_600,
      ),
    ).toBe(true);

    await page.getByRole('button', { name: 'Start new campaign' }).click();
    const scene = page.getByRole('img', { name: /Coffee Cart in/ });
    await expect(scene).toHaveAttribute('width', '320');
    await expect(scene).toHaveAttribute('height', '180');
    expect(await scene.evaluate((canvas) => getComputedStyle(canvas).imageRendering)).toBe(
      'pixelated',
    );
    const dimensions = await scene.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(dimensions?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewportWidth,
    );

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
