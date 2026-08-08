import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import type { VenueId } from '../../src/game';
import { SAVE_KEY, serializeEnvelope } from '../../src/persistence/saveStore';
import { livingRushEnvelope, type LivingRushOptions } from '../fixtures/campaignFixtures';

test.describe('snapshot-only WebGL service worlds', () => {
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
    await expect(frame).toHaveAttribute('data-max-visible-customers', '12');
    await expect(frame).toHaveAttribute('data-max-visible-staff', '10');
    await expect(frame).toHaveAttribute('data-animation', 'still');
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    const canvas = frame.locator('.webgl-stage canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-render-authority', 'snapshot-only');
    const capability = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const context = canvasElement.getContext('webgl2');
      if (!context) return null;
      const bounds = canvasElement.getBoundingClientRect();
      return {
        drawingBufferRatio: Math.max(
          canvasElement.width / Math.max(1, bounds.width),
          canvasElement.height / Math.max(1, bounds.height),
        ),
        renderer: String(context.getParameter(context.RENDERER)),
        version: String(context.getParameter(context.VERSION)),
      };
    });
    expect(capability).not.toBeNull();
    expect(capability?.version).toMatch(/^WebGL 2\.0/);
    expect(capability?.renderer.length).toBeGreaterThan(0);
    expect(capability?.drawingBufferRatio ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(1.51);
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
    expect(await hasCanvasSceneResource(page)).toBe(false);
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
    await dismissPwaPrompt(page, touch);
    await activate(page.getByRole('button', { name: 'Retry 3D scene' }), touch);
    await expect(scene).toHaveAttribute('data-webgl-status', 'unsupported');
  });

  test('imports, recovers, and reloads complete kiosk and cafe worlds without Canvas', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    const fixtures = [
      {
        venueId: 'kiosk' as const,
        staffCount: 3,
        weather: 'rainy' as const,
        world: 'sheltered-coffee-kiosk',
      },
      {
        venueId: 'cafe' as const,
        staffCount: 5,
        weather: 'coldSnap' as const,
        world: 'laneway-specialty-cafe',
      },
    ];
    for (const fixture of fixtures) {
      const importedDay = await importLivingRush(page, touch, fixture.venueId, {
        equipment: {
          grinder: 2,
          espressoMachine: 2,
          batchBrewer: 2,
          refrigeration: 2,
          pos: 2,
          serviceCounter: 2,
        },
        queueCount: 16,
        scheduledStaffCount: fixture.staffCount,
        weather: fixture.weather,
      });
      const frame = page.locator('figure[data-renderer="webgl"]');
      const scene = frame.getByRole('img');
      await expect(frame).toHaveAttribute('data-venue', fixture.venueId);
      await expect(frame).toHaveAttribute('data-world', fixture.world);
      await expect(frame).toHaveAttribute('data-weather', fixture.weather);
      await expect(frame).toHaveAttribute('data-staff-count', String(fixture.staffCount));
      await expect(frame).toHaveAttribute('data-queue-count', '16');
      await expect(frame).toHaveAttribute('data-queue-overflow', '4');
      await expect(frame).toHaveAttribute('data-light-count', '2');
      await expect(frame).toHaveAttribute('data-shadow-light-count', '1');
      await expect(frame).toHaveAttribute('data-visible-customers', '12');
      await expect(frame).toHaveAttribute('data-max-visible-customers', '12');
      await expect(frame).toHaveAttribute('data-max-visible-staff', '10');
      await expect(frame).toHaveAttribute(
        'data-equipment',
        'grinder:2,espressoMachine:2,batchBrewer:2,refrigeration:2,pos:2,serviceCounter:2',
      );
      await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
      await expect(scene).toHaveAccessibleName(/16 customers waiting/);
      await expect(scene).toHaveAccessibleName(new RegExp(`${fixture.staffCount} staff scheduled`));
      await expect(scene).toHaveAccessibleName(
        new RegExp(`Latest walkaway: Commuter customer d${importedDay}-c21`),
      );
      await expect(frame.locator('figcaption')).toContainText('Stock warning:');
      await expect(page.getByText('+4 beyond view')).toBeVisible();
      await expect(page.locator('[data-renderer-bridge]')).toHaveCount(0);
      await expect(page.locator('canvas[width="320"]')).toHaveCount(0);
      expect(await hasCanvasSceneResource(page)).toBe(false);
      await dismissPwaPrompt(page, touch);
      const canvas = frame.locator('.webgl-stage canvas');
      await expect(canvas).toBeVisible();
      expect(
        await canvas.evaluate(
          (element) => (element as HTMLCanvasElement).getContext('webgl2') !== null,
        ),
      ).toBe(true);
      const screenshot = await frame.screenshot({
        animations: 'disabled',
        path: testInfo.outputPath(`webgl-${fixture.venueId}-service.png`),
      });
      expect(screenshot.byteLength).toBeGreaterThan(5_000);
      const bounds = await frame.boundingBox();
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bounds?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(viewportWidth);

      const before = await persistedEconomicTruth(page);
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

      await activate(page.getByRole('button', { name: '2×' }), touch);
      await expect(frame).toHaveAttribute('data-speed', '2');
      await openSettings(page, touch);
      await activate(page.getByRole('checkbox', { name: 'Reduce motion' }), touch);
      await closeGameMenu(page, touch);
      await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
      await expect(frame).toHaveAttribute('data-animation', 'still');
      expect(await persistedEconomicTruth(page)).toEqual(before);

      await page.reload();
      await activate(page.getByRole('button', { name: 'Continue autosave' }), touch);
      const restored = page.locator('figure[data-renderer="webgl"]');
      await expect(restored).toHaveAttribute('data-venue', fixture.venueId);
      await expect(restored).toHaveAttribute('data-world', fixture.world);
      await expect(restored).toHaveAttribute('data-reduced-motion', 'true');
      await expect(restored.getByRole('img')).toHaveAttribute('data-webgl-status', 'ready');
      await expect(page.locator('[data-renderer-bridge]')).toHaveCount(0);
      expect(await persistedEconomicTruth(page)).toEqual(before);
    }
  });

  test('keeps the production service graph lazy and every emitted cache file below one megabyte', () => {
    const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<
      string,
      {
        readonly dynamicImports?: readonly string[];
        readonly file: string;
        readonly imports?: readonly string[];
        readonly isDynamicEntry?: boolean;
      }
    >;
    const service = manifest['src/scene/three/ServiceWorld.tsx'];
    const index = manifest['index.html'];
    expect(service?.isDynamicEntry).toBe(true);
    expect(manifest['src/scene/CanvasScene.tsx']).toBeUndefined();
    expect(index?.dynamicImports).toContain('src/scene/three/ServiceWorld.tsx');
    expect(index?.dynamicImports).not.toContain('src/scene/CanvasScene.tsx');
    expect(service?.imports?.some((entry) => entry.includes('CanvasScene'))).toBe(false);
    expect(readFileSync('dist/index.html', 'utf8')).not.toMatch(
      /ServiceWorld|CanvasScene|three-webgl/,
    );
    const emittedFiles = walkFiles('dist');
    expect(emittedFiles.length).toBeGreaterThan(10);
    for (const file of emittedFiles) {
      expect(statSync(file).size, `${file} exceeds the Workbox ceiling`).toBeLessThan(1_000_000);
    }
    const serviceWorker = readFileSync('dist/sw.js', 'utf8');
    expect(serviceWorker).toContain(service?.file ?? 'missing-service-world');
    expect(serviceWorker).not.toMatch(/CanvasScene-/);
    expect(readFileSync('src/App.tsx', 'utf8')).not.toContain('CanvasScene');
  });
});

async function importLivingRush(
  page: Page,
  touch: boolean,
  venueId: VenueId = 'cart',
  options: Omit<LivingRushOptions, 'paused' | 'reducedMotion' | 'venueId'> = {},
): Promise<number> {
  const envelope = livingRushEnvelope({
    ...options,
    paused: true,
    reducedMotion: false,
    venueId,
  });
  const importedDay = envelope.activeRun?.day;
  if (!importedDay) throw new Error('Living-rush import requires an active day.');
  await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
  await activate(page.getByRole('tab', { name: 'Save transfer' }), touch);
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'webgl-living-rush.json',
    mimeType: 'application/json',
    buffer: Buffer.from(serializeEnvelope(envelope)),
  });
  await expect(page.getByText(`Imported Day ${importedDay} safely.`)).toBeVisible();
  await closeGameMenu(page, touch);
  return importedDay;
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

async function hasCanvasSceneResource(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .some(({ name }) => name.includes('/assets/CanvasScene-')),
  );
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
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
          expressQueue: unknown[];
          normalQueue: unknown[];
          recentActivity: unknown;
          serviceJobsByStation: Record<string, unknown>;
          stats: unknown;
          tick: number;
        } | null;
      };
    } | null;
    const run = envelope?.activeRun;
    if (!run) return null;
    const firstActiveJob = run.rush
      ? (run.rush.serviceJobsByStation.espressoBar ??
        run.rush.serviceJobsByStation.brewBar ??
        run.rush.serviceJobsByStation.coldBar)
      : undefined;
    return {
      firstActiveJob,
      cashCents: run.cashCents,
      day: run.day,
      equipment: run.equipment,
      inventory: run.inventory,
      phase: run.phase,
      waitingCustomers: run.rush ? [...run.rush.normalQueue, ...run.rush.expressQueue] : undefined,
      recentActivity: run.rush?.recentActivity,
      reputation: run.reputation,
      stats: run.rush?.stats,
      tick: run.rush?.tick,
    };
  }, SAVE_KEY);
}
