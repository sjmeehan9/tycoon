import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

import { serializeEnvelope } from '../../src/persistence/saveStore';
import { denseDepartmentRushEnvelope } from '../fixtures/campaignFixtures';

test.describe('dense department-store heritage hall', () => {
  test('renders exact canonical entities, all hall registries, and settled bounded WebGL', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await importDenseRush(page);
    const frame = page.locator('figure[data-venue="departmentStore"]');
    const scene = frame.getByRole('img');
    const canvas = frame.locator('canvas');

    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    await expect(frame).toHaveAttribute('data-queue-count', '30');
    await expect(frame).toHaveAttribute('data-queue-normal', '12');
    await expect(frame).toHaveAttribute('data-queue-express', '18');
    await expect(frame).toHaveAttribute('data-queue-overflow', '18');
    await expect(frame).toHaveAttribute('data-visible-customers', '18');
    await expect(frame).toHaveAttribute('data-staff-count', '10');
    await expect(frame).toHaveAttribute('data-active-job-ids', 'd3-j0,d3-j1,d3-j2');
    await expect(frame).toHaveAttribute('data-bay-registry', 'espressoBar,brewBar,coldBar');
    await expect(frame).toHaveAttribute(
      'data-motif-registry',
      'patterned-heritage-tiles,timber-panelling-counters,brass-rails-details,visible-escalators,three-distinct-service-bays',
    );
    await expect(frame).toHaveAttribute(
      'data-equipment-registry',
      'grinder,espressoMachine,batchBrewer,refrigeration,pos,serviceCounter',
    );
    await expect(frame).toHaveAttribute(
      'data-upgrade-anchor-registry',
      'hallEntry,espressoBay,brewBay,coldBay',
    );
    await expect(frame).toHaveAttribute(
      'data-equipment',
      'grinder:3,espressoMachine:3,batchBrewer:3,refrigeration:3,pos:3,serviceCounter:3',
    );
    const entityEvidence = await frame.evaluate((element) => ({
      customers: (element.getAttribute('data-customer-entity-ids') ?? '').split(','),
      staff: (element.getAttribute('data-staff-entity-ids') ?? '').split(','),
      statuses: element.getAttribute('data-customer-statuses') ?? '',
    }));
    expect(entityEvidence.customers).toHaveLength(18);
    expect(new Set(entityEvidence.customers).size).toBe(18);
    expect(entityEvidence.staff).toHaveLength(10);
    expect(new Set(entityEvidence.staff).size).toBe(10);
    expect(entityEvidence.statuses).toContain('customer:d3-c40:handoff');
    expect(entityEvidence.statuses).toContain('customer:d3-c41:payment');
    expect(entityEvidence.statuses).toContain('customer:d3-c42:stockout');
    for (const bayId of ['espressoBar', 'brewBar', 'coldBar']) {
      await expect(frame.locator(`[data-bay-id="${bayId}"]`)).toBeVisible();
    }

    await expect(frame).toHaveAttribute('data-performance-settled', 'true');
    await expect(canvas).toHaveAttribute('data-performance-settled', 'true');
    const performance = await frame.evaluate((element) => ({
      actualCalls: Number(element.getAttribute('data-actual-draw-calls')),
      actualTriangles: Number(element.getAttribute('data-actual-triangles')),
      callBudget: Number(element.getAttribute('data-draw-call-budget')),
      triangleBudget: Number(element.getAttribute('data-triangle-budget')),
    }));
    await testInfo.attach('renderer-metrics.json', {
      body: Buffer.from(JSON.stringify(performance, null, 2)),
      contentType: 'application/json',
    });
    expect(performance.actualCalls).toBeGreaterThan(0);
    expect(performance.actualTriangles).toBeGreaterThan(0);
    expect(performance.actualCalls, JSON.stringify(performance)).toBeLessThanOrEqual(
      performance.callBudget,
    );
    expect(performance.actualTriangles).toBeLessThanOrEqual(performance.triangleBudget);
    await expect(frame).toHaveAttribute('data-budget-status', 'pass');

    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(frame).toHaveAttribute('data-animation', 'active');
    await expect(frame).toHaveAttribute('data-frame-sample-status', 'complete', {
      timeout: 20_000,
    });
    const framePerformance = await frame.evaluate((element) => {
      const canvas = element.querySelector('canvas');
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Department canvas is missing.');
      const context = canvas.getContext('webgl2');
      if (!context) throw new Error('Department WebGL2 context is missing.');
      const rendererInfo = context.getExtension('WEBGL_debug_renderer_info');
      return {
        antialias: element.getAttribute('data-antialias'),
        browserDevicePixelRatio: window.devicePixelRatio,
        canvasDevicePixelRatio: canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : null,
        colourUpdatePolicy: element.getAttribute('data-colour-update-policy'),
        frameSampleCount: Number(element.getAttribute('data-frame-sample-count')),
        frameWarmupCount: Number(element.getAttribute('data-frame-warmup-count')),
        measuredFramesPerSecond: Number(element.getAttribute('data-measured-fps')),
        medianFrameTimeMs: Number(element.getAttribute('data-median-frame-time-ms')),
        maximumP95FrameTimeMs: Number(element.getAttribute('data-maximum-p95-frame-time-ms')),
        minimumFramesPerSecond: Number(element.getAttribute('data-minimum-fps')),
        p95FrameTimeMs: Number(element.getAttribute('data-p95-frame-time-ms')),
        renderScale: Number(element.getAttribute('data-render-scale')),
        rendererDevicePixelRatioCap: Number(element.getAttribute('data-dpr-max')),
        sampleDurationMs: Number(element.getAttribute('data-sample-duration-ms')),
        userAgent: navigator.userAgent,
        viewport: { height: window.innerHeight, width: window.innerWidth },
        webglRenderer: rendererInfo
          ? String(context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL))
          : String(context.getParameter(context.RENDERER)),
      };
    });
    const frameEvidence = {
      ...framePerformance,
      browserName: testInfo.project.use.browserName ?? 'chromium',
      browserVersion: page.context().browser()?.version() ?? 'unknown',
      method:
        '30 React Three Fiber rendered-frame callbacks discarded, followed by 120 callback deltas in the foreground dense animated scene; BasicShadowMap and static instance colours refreshed on immutable snapshot changes; full LOD uses deliberate pixel-art upscaling from 0.9 internal scale',
      physicalDeviceClaimed: false,
      project: testInfo.project.name,
    };
    const frameEvidencePath = testInfo.outputPath('renderer-frame-cadence.json');
    writeFileSync(frameEvidencePath, JSON.stringify(frameEvidence, null, 2), 'utf8');
    await testInfo.attach('renderer-frame-cadence.json', {
      path: frameEvidencePath,
      contentType: 'application/json',
    });
    expect(frameEvidence.frameSampleCount).toBe(120);
    expect(frameEvidence.frameWarmupCount).toBe(30);
    expect(frameEvidence.antialias).toBe('false');
    expect(frameEvidence.colourUpdatePolicy).toBe('snapshot');
    expect(frameEvidence.renderScale).toBe(testInfo.project.name === 'touch-mobile' ? 1 : 0.9);
    expect(frameEvidence.canvasDevicePixelRatio).toBeCloseTo(
      Math.min(frameEvidence.browserDevicePixelRatio, frameEvidence.rendererDevicePixelRatioCap) *
        frameEvidence.renderScale,
      2,
    );
    expect(
      frameEvidence.measuredFramesPerSecond,
      JSON.stringify(frameEvidence),
    ).toBeGreaterThanOrEqual(frameEvidence.minimumFramesPerSecond);
    expect(frameEvidence.p95FrameTimeMs, JSON.stringify(frameEvidence)).toBeLessThanOrEqual(
      frameEvidence.maximumP95FrameTimeMs,
    );
    await expect(frame).toHaveAttribute('data-frame-budget-status', 'pass');

    const screenshot = await frame.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('dense-department-hall.png'),
    });
    expect(screenshot.byteLength).toBeGreaterThan(8_000);
  });

  test('retains snapshot identity and semantic truth through context recovery and reload', async ({
    page,
  }) => {
    await page.goto('./');
    await importDenseRush(page);
    const frame = page.locator('figure[data-venue="departmentStore"]');
    const scene = frame.getByRole('img');
    const before = await frame.evaluate((element) => ({
      customerIds: element.getAttribute('data-customer-entity-ids'),
      name: element.querySelector('[role="img"]')?.getAttribute('aria-label'),
      snapshotId: element.getAttribute('data-snapshot-id'),
      staffIds: element.getAttribute('data-staff-entity-ids'),
    }));
    const prevented = await frame.locator('canvas').evaluate((element) => {
      const event = new Event('webglcontextlost', { cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(true);
    await expect(page.getByRole('alert')).toContainText('3D context was interrupted');
    await page.getByRole('button', { name: 'Retry 3D scene' }).click();
    await expect(scene).toHaveAttribute('data-webgl-status', 'ready');
    await expect(frame).toHaveAttribute('data-performance-settled', 'true');
    expect(
      await frame.evaluate((element) => ({
        customerIds: element.getAttribute('data-customer-entity-ids'),
        name: element.querySelector('[role="img"]')?.getAttribute('aria-label'),
        snapshotId: element.getAttribute('data-snapshot-id'),
        staffIds: element.getAttribute('data-staff-entity-ids'),
      })),
    ).toEqual(before);

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    const restored = page.locator('figure[data-venue="departmentStore"]');
    await expect(restored.getByRole('img')).toHaveAttribute('data-webgl-status', 'ready');
    expect(
      await restored.evaluate((element) => ({
        customerIds: element.getAttribute('data-customer-entity-ids'),
        name: element.querySelector('[role="img"]')?.getAttribute('aria-label'),
        snapshotId: element.getAttribute('data-snapshot-id'),
        staffIds: element.getAttribute('data-staff-entity-ids'),
      })),
    ).toEqual(before);
  });

  test('keeps the dense scene and complete dashboard inside the initial 360 by 780 viewport', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'touch-mobile', 'Compact geometry is mobile-specific.');
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('./');
    await importDenseRush(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const frame = page.locator('figure[data-venue="departmentStore"]');
    await expect(frame).toHaveAttribute('data-lod', 'compact');
    await expect(frame).toHaveAttribute('data-dpr-max', '1.25');
    await expect(frame).toHaveAttribute('data-shadow-map-size', '512');
    await expect(frame).toHaveAttribute('data-draw-call-budget', '52');
    await expect(frame).toHaveAttribute('data-triangle-budget', '30000');
    await expect(frame).toHaveAttribute('data-visible-customers', '18');
    await expect(frame).toHaveAttribute('data-staff-count', '10');
    await expect(frame).toHaveAttribute('data-performance-settled', 'true');

    const geometry = await page.evaluate(() => {
      const bounds = (selector: string): DOMRect => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}.`);
        return element.getBoundingClientRect();
      };
      const header = bounds('.app-shell.is-service .game-header');
      const scene = bounds('[data-service-section="scene"]');
      const dashboard = bounds('[data-service-section="dashboard"]');
      return {
        dashboardBottom: dashboard.bottom,
        dashboardHeight: dashboard.height,
        gap: dashboard.top - scene.bottom,
        headerHeight: header.height,
        sceneHeight: scene.height,
        topPadding: scene.top - header.bottom,
        scrollY: window.scrollY,
      };
    });
    const renderer = await frame.evaluate((element) => ({
      actualCalls: Number(element.getAttribute('data-actual-draw-calls')),
      actualTriangles: Number(element.getAttribute('data-actual-triangles')),
      callBudget: Number(element.getAttribute('data-draw-call-budget')),
      triangleBudget: Number(element.getAttribute('data-triangle-budget')),
    }));
    await testInfo.attach('compact-geometry-and-renderer.json', {
      body: Buffer.from(JSON.stringify({ geometry, renderer }, null, 2)),
      contentType: 'application/json',
    });
    expect(geometry.scrollY).toBe(0);
    expect(geometry.headerHeight).toBeLessThanOrEqual(60);
    expect(geometry.topPadding, JSON.stringify({ geometry, renderer })).toBeLessThanOrEqual(6);
    expect(geometry.sceneHeight).toBeGreaterThanOrEqual(150);
    expect(geometry.sceneHeight).toBeLessThanOrEqual(180);
    expect(geometry.gap).toBeLessThanOrEqual(7);
    expect(geometry.dashboardHeight).toBeLessThanOrEqual(500);
    expect(geometry.dashboardBottom).toBeLessThanOrEqual(760);
    await expect(frame).toHaveAttribute('data-budget-status', 'pass');
    for (const field of [
      'time',
      'cash',
      'revenue',
      'served',
      'lost',
      'queue',
      'normalQueue',
      'expressQueue',
      'activeJobs',
      'satisfaction',
      'reputation',
      'event',
      'pause',
      'speed',
    ]) {
      const fieldBounds = await page.locator(`[data-dashboard-field="${field}"]`).boundingBox();
      expect(fieldBounds).not.toBeNull();
      expect((fieldBounds?.y ?? 0) + (fieldBounds?.height ?? 781)).toBeLessThanOrEqual(780);
    }
  });
});

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
  const dismissPwa = page.getByRole('button', { name: 'Got it' });
  if (await dismissPwa.isVisible()) await dismissPwa.click();
  const dismissMessage = page.getByRole('button', { name: 'Dismiss message' });
  if (await dismissMessage.isVisible()) await dismissMessage.click();
}
