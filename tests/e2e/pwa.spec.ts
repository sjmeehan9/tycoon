import { expect, test, type Page } from '@playwright/test';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

import { SAVE_KEY, serializeEnvelope } from '../../src/persistence/saveStore';
import { denseDepartmentRushEnvelope } from '../fixtures/campaignFixtures';

const DIST_DIRECTORY = resolve('dist');
const MAXIMUM_PRECACHE_FILE_BYTES = 1_000_000;
const SERVICE_WORKER_PATH = join(DIST_DIRECTORY, 'sw.js');
const ORIGINAL_SERVICE_WORKER = readFileSync(SERVICE_WORKER_PATH, 'utf8');
const PRECACHE_URLS = precacheUrls(ORIGINAL_SERVICE_WORKER);
const EXPECTED_RUNTIME_FILES = releaseRuntimeFiles(DIST_DIRECTORY);

test.describe('offline-safe production release', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(({ browserName }) => browserName !== 'chromium', 'Service worker proof uses Chromium.');

  test.afterEach(() => {
    writeFileSync(SERVICE_WORKER_PATH, ORIGINAL_SERVICE_WORKER, 'utf8');
  });

  test('precache is canonical and supports warm, cold, and complete offline service', async ({
    context,
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Runs once in the desktop profile.');
    test.setTimeout(120_000);
    const runtimeRequests = new Set<string>();
    context.on('request', (request) => {
      if (/^https?:/.test(request.url())) runtimeRequests.add(request.url());
    });

    expect(new Set(PRECACHE_URLS).size).toBe(PRECACHE_URLS.length);
    expect([...PRECACHE_URLS].sort()).toEqual(EXPECTED_RUNTIME_FILES);
    const inventory = PRECACHE_URLS.map((url) => ({
      bytes: statSync(join(DIST_DIRECTORY, url)).size,
      url,
    }));
    for (const entry of inventory) {
      expect(entry.bytes, JSON.stringify(entry)).toBeLessThan(MAXIMUM_PRECACHE_FILE_BYTES);
    }
    expect(statSync(SERVICE_WORKER_PATH).size).toBeLessThan(MAXIMUM_PRECACHE_FILE_BYTES);

    await openControlledRelease(page);
    await expect(page).toHaveURL(/\/tycoon\/$/);
    const cdp = await context.newCDPSession(page);
    const [browserManifest, installability] = await Promise.all([
      cdp.send('Page.getAppManifest'),
      cdp.send('Page.getInstallabilityErrors'),
    ]);
    await cdp.detach();
    expect(browserManifest.errors).toEqual([]);
    expect(browserManifest.url).toMatch(/\/tycoon\/manifest\.webmanifest$/);
    expect(installability.installabilityErrors).toEqual([]);

    const release = await page.evaluate(async () => {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!manifestLink) throw new Error('Release manifest link is missing.');
      const manifestResponse = await fetch(manifestLink.href);
      const manifest = (await manifestResponse.json()) as {
        id: string;
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
        assetResponses,
        controlled: Boolean(navigator.serviceWorker.controller),
        id: manifest.id,
        manifestStatus: manifestResponse.status,
        scope: manifest.scope,
        startUrl: manifest.start_url,
      };
    });
    expect(release).toEqual({
      assetResponses: [200, 200, 200, 200, 200],
      controlled: true,
      id: '/tycoon/',
      manifestStatus: 200,
      scope: '/tycoon/',
      startUrl: '/tycoon/',
    });
    await importDenseRush(page);
    await expect(page.locator('figure[data-venue="departmentStore"] canvas')).toBeVisible();
    const onlineCheckpoint = await rawSave(page);

    await context.setOffline(true);
    try {
      const offlineResponses = await page.evaluate(async (urls) => {
        return Promise.all(
          urls.map(async (url) => {
            try {
              const response = await fetch(new URL(url, document.baseURI));
              return { ok: response.ok, status: response.status, url };
            } catch (error) {
              return {
                error: error instanceof Error ? error.message : String(error),
                ok: false,
                status: 0,
                url,
              };
            }
          }),
        );
      }, PRECACHE_URLS);
      expect(offlineResponses.filter(({ ok }) => !ok)).toEqual([]);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('.title-art')).toHaveJSProperty('complete', true);
      expect(await rawSave(page)).toBe(onlineCheckpoint);
      await page.getByRole('button', { name: 'Continue autosave' }).click();
      await expect(page.locator('figure[data-venue="departmentStore"] canvas')).toBeVisible();
      await page.getByRole('button', { name: 'Resume' }).click();
      await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible({
        timeout: 60_000,
      });
      const reportSave = JSON.parse(await rawSave(page)) as {
        activeRun?: { phase?: string; report?: { day?: number } };
        schemaVersion?: number;
      };
      expect(reportSave.schemaVersion).toBe(4);
      expect(reportSave.activeRun?.phase).toBe('report');
      expect(reportSave.activeRun?.report?.day).toBe(3);

      await page.getByRole('button', { name: 'Settle & reinvest' }).click();
      await expect(
        page.getByRole('heading', { name: 'Reinvest or call it a night' }),
      ).toBeVisible();
      await page.getByRole('button', { name: /^Plan Day / }).click();
      await expect(
        page.getByRole('heading', { name: 'Set up the department-store coffee hall' }),
      ).toBeVisible();
      const settledCheckpoint = await rawSave(page);

      await page.close();
      const coldPage = await context.newPage();
      await coldPage.goto('./', { waitUntil: 'domcontentloaded' });
      await expect(coldPage.locator('.title-art')).toHaveJSProperty('complete', true);
      expect(await rawSave(coldPage)).toBe(settledCheckpoint);
      await coldPage.getByRole('button', { name: 'Continue autosave' }).click();
      await expect(
        coldPage.getByRole('heading', { name: 'Set up the department-store coffee hall' }),
      ).toBeVisible();
    } finally {
      await context.setOffline(false);
    }

    const origin = new URL([...runtimeRequests][0] ?? 'http://127.0.0.1:4173').origin;
    const requestAudit = [...runtimeRequests].map((requestUrl) => {
      const url = new URL(requestUrl);
      return { origin: url.origin, pathname: url.pathname, url: requestUrl };
    });
    const releaseEvidencePath = testInfo.outputPath('release-cache-and-network-inventory.json');
    writeFileSync(
      releaseEvidencePath,
      JSON.stringify(
        {
          installabilityErrors: installability.installabilityErrors,
          maximumPrecacheFileBytes: MAXIMUM_PRECACHE_FILE_BYTES,
          precache: inventory,
          precacheBytes: inventory.reduce((total, entry) => total + entry.bytes, 0),
          requests: requestAudit,
          runtimeFileCount: EXPECTED_RUNTIME_FILES.length,
          serviceWorkerBytes: statSync(SERVICE_WORKER_PATH).size,
        },
        null,
        2,
      ),
      'utf8',
    );
    await testInfo.attach('release-cache-and-network-inventory.json', {
      path: releaseEvidencePath,
      contentType: 'application/json',
    });
    expect(requestAudit.length).toBeGreaterThan(0);
    expect(requestAudit.every((request) => request.origin === origin)).toBe(true);
    expect(requestAudit.every((request) => request.pathname.startsWith('/tycoon/'))).toBe(true);
  });

  test('Keep playing never queues activation after active service', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Runs once in the desktop profile.');
    test.setTimeout(90_000);
    await openControlledRelease(page);
    await importDenseRush(page);
    const controllerBefore = await activeWorkerUrl(page);
    await watchControllerChanges(page);
    publishTestUpdate('defer-active');
    await requestServiceWorkerUpdate(page);

    await expect(page.getByRole('alertdialog', { name: 'A fresh batch is ready' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finish service to update' })).toBeDisabled();
    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(page.getByRole('alertdialog', { name: 'A fresh batch is ready' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible({
      timeout: 60_000,
    });

    expect(await controllerChangeCount(page)).toBe(0);
    expect(await activeWorkerUrl(page)).toBe(controllerBefore);
    expect(
      await page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    ).toBe(true);
  });

  test('activates only after safe consent and restores exact v4 gameplay content', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Runs once in the desktop profile.');
    test.setTimeout(90_000);
    await openControlledRelease(page);
    await importDenseRush(page);
    await watchControllerChanges(page);
    publishTestUpdate('accept-safe');
    await requestServiceWorkerUpdate(page);

    await expect(page.getByRole('button', { name: 'Finish service to update' })).toBeDisabled();
    expect(await controllerChangeCount(page)).toBe(0);
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible({
      timeout: 60_000,
    });
    const update = page.getByRole('button', { name: 'Save and update' });
    await expect(update).toBeEnabled();
    const checkpoint = await rawSave(page);
    const parsedCheckpoint = JSON.parse(checkpoint) as {
      activeRun?: { day?: number; phase?: string; stateVersion?: number };
      schemaVersion?: number;
    };
    expect(parsedCheckpoint.schemaVersion).toBe(4);
    expect(parsedCheckpoint.activeRun).toMatchObject({ day: 3, phase: 'report', stateVersion: 4 });

    const navigated = page.waitForEvent('framenavigated');
    await update.click();
    await navigated;
    const restored = JSON.parse(await rawSave(page)) as Record<string, unknown> & {
      savedAt?: string;
    };
    const expected = JSON.parse(checkpoint) as Record<string, unknown> & { savedAt?: string };
    const { savedAt: restoredSavedAt, ...restoredPayload } = restored;
    const { savedAt: expectedSavedAt, ...expectedPayload } = expected;
    expect(restoredPayload).toEqual(expectedPayload);
    expect(Date.parse(restoredSavedAt ?? '')).toBeGreaterThanOrEqual(
      Date.parse(expectedSavedAt ?? ''),
    );
    const workerState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        active: registration?.active?.state ?? null,
        controlled: Boolean(navigator.serviceWorker.controller),
        waiting: registration?.waiting?.state ?? null,
      };
    });
    expect(workerState).toEqual({ active: 'activated', controlled: true, waiting: null });
    expect(await page.evaluate(async () => (await fetch('./sw.js')).text())).toContain(
      'Playwright accept-safe update',
    );
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
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
  await dismissPwaNotice(page);
}

async function importDenseRush(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Game menu', exact: true }).click();
  await page.getByRole('tab', { name: 'Save transfer' }).click();
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'dense-department-rush.json',
    mimeType: 'application/json',
    buffer: Buffer.from(serializeEnvelope(denseDepartmentRushEnvelope())),
  });
  await expect(page.getByText('Imported Day 3 safely.')).toBeVisible();
  const close = page.getByRole('button', { name: 'Close game menu' });
  if (await close.isVisible()) await close.click();
  await dismissPwaNotice(page);
  const dismissMessage = page.getByRole('button', { name: 'Dismiss message' });
  if (await dismissMessage.isVisible()) await dismissMessage.click();
}

async function dismissPwaNotice(page: Page): Promise<void> {
  const dismiss = page.getByRole('button', { name: 'Got it' });
  if (await dismiss.isVisible()) await dismiss.click();
}

function publishTestUpdate(marker: string): void {
  writeFileSync(
    SERVICE_WORKER_PATH,
    `${ORIGINAL_SERVICE_WORKER}\n// Playwright ${marker} update ${Date.now()}\n`,
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

async function activeWorkerUrl(page: Page): Promise<string | null> {
  return page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null);
}

async function watchControllerChanges(page: Page): Promise<void> {
  await page.evaluate(() => {
    const state = window as Window & { __tycoonControllerChanges?: number };
    state.__tycoonControllerChanges = 0;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      state.__tycoonControllerChanges = (state.__tycoonControllerChanges ?? 0) + 1;
    });
  });
}

async function controllerChangeCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (window as Window & { __tycoonControllerChanges?: number }).__tycoonControllerChanges ?? 0,
  );
}

async function rawSave(page: Page): Promise<string> {
  return page.evaluate((saveKey) => {
    const value = window.localStorage.getItem(saveKey);
    if (value === null) throw new Error(`Missing local save ${saveKey}.`);
    return value;
  }, SAVE_KEY);
}

function precacheUrls(serviceWorker: string): string[] {
  const urls = [...serviceWorker.matchAll(/\{url:"([^"]+)",revision:/g)].map((match) => match[1]!);
  if (urls.length === 0) throw new Error('Generated service worker has no precache manifest.');
  return urls;
}

function releaseRuntimeFiles(directory: string): string[] {
  const runtimeExtensions = new Set([
    '.css',
    '.html',
    '.js',
    '.png',
    '.svg',
    '.wav',
    '.webmanifest',
    '.webp',
  ]);
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else {
        const runtimePath = relative(directory, absolute).split(sep).join('/');
        if (runtimePath !== 'sw.js' && runtimeExtensions.has(extname(runtimePath))) {
          files.push(runtimePath);
        }
      }
    }
  };
  walk(directory);
  return files.sort();
}
