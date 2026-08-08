import { expect, test, type Locator, type Page } from '@playwright/test';

import { SAVE_KEY, serializeEnvelope } from '../../src/persistence/saveStore';
import { departmentWorkforceEnvelope, parallelServiceEnvelope } from '../fixtures/campaignFixtures';

test.describe('parallel department service', () => {
  test('configures role-compatible stations and the bounded express menu accessibly', async ({
    page,
  }) => {
    await page.goto('./');
    await importSave(
      page,
      serializeEnvelope(departmentWorkforceEnvelope()),
      'department-plan.json',
    );
    await showPlannerTab(page, 'Team');

    const stationSelectors = page.getByRole('combobox', { name: /service station/ });
    await expect(stationSelectors).toHaveCount(10);
    const fixture = departmentWorkforceEnvelope().activeRun;
    const manager = fixture?.staff.find((member) => member.role === 'manager');
    const barista = fixture?.staff.find((member) => member.role === 'barista');
    if (!manager || !barista) throw new Error('Expected department role fixtures.');
    await expect(
      page
        .getByRole('combobox', { name: `${manager.name} service station` })
        .getByRole('option', { name: 'Cold bar' }),
    ).toHaveAttribute('disabled', '');
    await page
      .getByRole('combobox', { name: `${barista.name} service station` })
      .selectOption('coldBar');

    await showPlannerTab(page, 'Menu');
    const cards = ['Espresso', 'Batch Brew', 'Cold Brew', 'Long Black'].map((name) =>
      menuCard(page, name),
    );
    for (const card of cards) {
      const menuChoice = card.locator('.check-row input');
      if (!(await menuChoice.isChecked())) await menuChoice.check();
    }
    for (const card of cards.slice(0, 3)) await card.locator('.express-option input').check();
    await expect(cards[0]!.locator('.express-option input')).toBeChecked();
    await expect(cards[3]!.locator('.express-option input')).toBeDisabled();
    await expect(cards[3]!).toContainText('Maximum 3 express drinks selected.');

    const savedPlan = await page.evaluate((saveKey) => {
      const serialized = localStorage.getItem(saveKey);
      if (!serialized) return null;
      const envelope = JSON.parse(serialized) as {
        activeRun?: {
          plan?: {
            expressDrinkIds?: string[];
            stationAssignments?: Record<string, string[]>;
          };
        };
      };
      return envelope.activeRun?.plan ?? null;
    }, SAVE_KEY);
    expect(savedPlan?.expressDrinkIds).toEqual(['espresso', 'batchBrew', 'coldBrew']);
    expect(savedPlan?.stationAssignments?.coldBar).toContain(barista.id);
  });

  test('shows three authoritative jobs, both lanes, compact mobile truth, and exact reload', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await importSave(page, serializeEnvelope(parallelServiceEnvelope()), 'parallel-rush.json');

    const sections = await page
      .locator('[data-service-section]')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-service-section')),
      );
    expect(sections).toEqual(['scene', 'dashboard', 'activity', 'stock']);
    await expect(page.locator('[data-dashboard-field="queue"]')).toContainText('1');
    await expect(page.locator('[data-dashboard-field="normalQueue"]')).toContainText('1');
    await expect(page.locator('[data-dashboard-field="expressQueue"]')).toContainText('0');
    await expect(page.locator('[data-dashboard-field="activeJobs"]')).toContainText('3');
    await expect(page.getByRole('button', { name: 'Resume' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const stations = page.getByRole('list', { name: 'Live station service' });
    await expect(stations.locator('[data-station-id="espressoBar"]')).toContainText(
      'Express job d3-j0',
    );
    await expect(stations.locator('[data-station-id="brewBar"]')).toContainText(
      'Express job d3-j1',
    );
    await expect(stations.locator('[data-station-id="coldBar"]')).toContainText(
      'Express job d3-j2',
    );
    const activity = page.getByRole('list', { name: 'Recent rush activity' });
    await expect(activity).toContainText('job d3-j0');
    await expect(activity).toContainText('job d3-j1');
    await expect(activity).toContainText('job d3-j2');

    if (testInfo.project.name === 'touch-mobile') {
      const sceneBounds = await page.locator('[data-service-section="scene"]').boundingBox();
      const dashboardBounds = await page
        .locator('[data-service-section="dashboard"]')
        .boundingBox();
      expect(sceneBounds).not.toBeNull();
      expect(dashboardBounds).not.toBeNull();
      expect(sceneBounds?.height ?? 181).toBeGreaterThanOrEqual(150);
      expect(sceneBounds?.height ?? 181).toBeLessThanOrEqual(180);
      expect((dashboardBounds?.y ?? 0) + (dashboardBounds?.height ?? 761)).toBeLessThanOrEqual(760);
      await expect(page.locator('[data-service-section="scene"]')).toHaveAttribute(
        'data-lod',
        'compact',
      );
    }

    const beforeReload = await savedServiceTruth(page);
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.locator('[data-dashboard-field="activeJobs"]')).toContainText('3');
    expect(await savedServiceTruth(page)).toEqual(beforeReload);
  });
});

function menuCard(page: Page, name: string): Locator {
  return page.locator('.menu-card').filter({
    has: page.locator('.check-row strong', { hasText: name }),
  });
}

async function showPlannerTab(page: Page, name: 'Menu' | 'Team'): Promise<void> {
  const tab = page.getByRole('tab', { name });
  if (await tab.isVisible()) await tab.click();
}

async function importSave(page: Page, contents: string, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('tab', { name: 'Save transfer' }).click();
  await page.getByLabel('Import save JSON file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
}

async function savedServiceTruth(page: Page): Promise<unknown> {
  return page.evaluate((saveKey) => {
    const serialized = localStorage.getItem(saveKey);
    if (!serialized) return null;
    const envelope = JSON.parse(serialized) as {
      activeRun?: {
        inventory?: unknown;
        rush?: {
          normalQueue?: unknown;
          expressQueue?: unknown;
          serviceJobsByStation?: unknown;
          nextServiceJobSequence?: unknown;
          recentActivity?: unknown;
          stats?: unknown;
        };
      };
    };
    return {
      inventory: envelope.activeRun?.inventory,
      normalQueue: envelope.activeRun?.rush?.normalQueue,
      expressQueue: envelope.activeRun?.rush?.expressQueue,
      serviceJobsByStation: envelope.activeRun?.rush?.serviceJobsByStation,
      nextServiceJobSequence: envelope.activeRun?.rush?.nextServiceJobSequence,
      recentActivity: envelope.activeRun?.rush?.recentActivity,
      stats: envelope.activeRun?.rush?.stats,
    };
  }, SAVE_KEY);
}
