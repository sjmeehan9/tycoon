import { expect, test, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const serviceWorkerPath = resolve('dist/sw.js');
const originalServiceWorker = readFileSync(serviceWorkerPath, 'utf8');

test.describe('offline-safe production release', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Service worker proof uses Chromium.');

  test.afterEach(() => {
    writeFileSync(serviceWorkerPath, originalServiceWorker, 'utf8');
  });

  test('caches the complete subpath build and continues its autosave offline', async ({
    context,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Runs once in the desktop profile.');
    await openControlledRelease(page);
    await expect(page).toHaveURL(/\/tycoon\/$/);

    const cdp = await context.newCDPSession(page);
    const [browserManifest, installability] = await Promise.all([
      cdp.send('Page.getAppManifest'),
      cdp.send('Page.getInstallabilityErrors'),
    ]);
    expect(browserManifest.errors).toEqual([]);
    expect(browserManifest.url).toMatch(/\/tycoon\/manifest\.webmanifest$/);
    expect(installability.installabilityErrors).toEqual([]);
    await cdp.detach();

    const release = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!manifestLink) throw new Error('Release manifest link is missing.');
      const manifestResponse = await fetch(manifestLink.href);
      const manifest = (await manifestResponse.json()) as {
        scope: string;
        start_url: string;
        icons: { src: string }[];
      };
      const assetResponses = await Promise.all(
        [
          'assets/art/laneway-title.webp',
          'assets/audio/laneway-ambience.wav',
          ...manifest.icons.map((icon) => icon.src),
        ].map(async (asset) => (await fetch(new URL(asset, manifestLink.href))).status),
      );
      return {
        manifestStatus: manifestResponse.status,
        scope: manifest.scope,
        startUrl: manifest.start_url,
        assetResponses,
        controlled: Boolean(navigator.serviceWorker.controller),
      };
    });
    expect(release).toEqual({
      manifestStatus: 200,
      scope: '/tycoon/',
      startUrl: '/tycoon/',
      assetResponses: [200, 200, 200, 200, 200],
      controlled: true,
    });

    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('.title-art')).toHaveJSProperty('complete', true);
      await page.getByRole('button', { name: 'Continue autosave' }).click();
      await page.getByRole('button', { name: 'Show current step' }).click();
      await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('defers a real waiting worker without interrupting active play', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Runs once in the desktop profile.');
    await openControlledRelease(page);
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    publishTestUpdate('defer');
    await requestServiceWorkerUpdate(page);

    await expect(page.getByRole('alertdialog', { name: 'A fresh batch is ready' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(page.getByRole('alertdialog', { name: 'A fresh batch is ready' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
  });

  test('checkpoints, accepts a real update, and restores the same run', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Runs once in the desktop profile.');
    await openControlledRelease(page);
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    publishTestUpdate('accept');
    await requestServiceWorkerUpdate(page);
    await expect(page.getByRole('alertdialog', { name: 'A fresh batch is ready' })).toBeVisible();

    const navigated = page.waitForEvent('framenavigated');
    await page.getByRole('button', { name: 'Save and update' }).click();
    await navigated;
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await page.getByRole('button', { name: 'Show current step' }).click();
    await expect(page.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
  });
});

async function openControlledRelease(page: Page): Promise<void> {
  await page.goto('./');
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable.');
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

function publishTestUpdate(marker: string): void {
  writeFileSync(
    serviceWorkerPath,
    `${originalServiceWorker}\n// Playwright ${marker} update ${Date.now()}\n`,
    'utf8',
  );
}

async function requestServiceWorkerUpdate(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error('Release service worker is not registered.');
    await registration.update();
  });
}
