import { expect, test, type Locator, type Page } from '@playwright/test';

import { SERVICE_DASHBOARD_FIELDS } from '../../src/components/RushPanel';
import {
  advanceTick,
  createCampaign,
  startRush,
  type GameState,
  type SaveEnvelope,
  type VenueId,
} from '../../src/game';
import {
  createDefaultPreferences,
  createSaveEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { livingRushEnvelope } from '../fixtures/campaignFixtures';

const VENUES: readonly VenueId[] = ['cart', 'kiosk', 'cafe'];

test.describe('immersive service information flow', () => {
  test('keeps every venue planning screen full width and entirely scene-free', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await dismissPwaPrompt(page, touch);

    for (const venueId of VENUES) {
      const state = { ...createCampaign({ seed: 7_400 + VENUES.indexOf(venueId) }), venueId };
      await importEnvelope(page, touch, completeOnboarding(createSaveEnvelope(state)), venueId);

      const management = page.locator('[data-game-layout="management"]');
      await expect(management).toBeVisible();
      await expect(page.getByRole('heading', { name: /Set up the/ })).toBeVisible();
      await expect(page.locator('[data-service-section]')).toHaveCount(0);
      await expect(page.locator('.scene-column, .scene-frame, .scene-loading, canvas')).toHaveCount(
        0,
      );
      await expect(page.getByText(/Preparing the venue overview/i)).toHaveCount(0);
      const widths = await management.evaluate((layout) => {
        const flow = layout.querySelector('.management-flow');
        if (!(flow instanceof HTMLElement)) throw new Error('Management flow is missing.');
        const styles = window.getComputedStyle(layout);
        return {
          content:
            layout.clientWidth -
            Number.parseFloat(styles.paddingLeft) -
            Number.parseFloat(styles.paddingRight),
          flow: flow.getBoundingClientRect().width,
        };
      });
      expect(widths.flow).toBeGreaterThanOrEqual(widths.content - 2);
    }
  });

  test('orders complete service truth for all venues and fits 360 by 780 without scrolling', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    if (touch) await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('./');
    await dismissPwaPrompt(page, touch);

    for (const venueId of VENUES) {
      await importEnvelope(
        page,
        touch,
        livingRushEnvelope({ paused: true, queueCount: 16, venueId }),
        `service-${venueId}`,
      );
      const scene = page.locator('[data-service-section="scene"]');
      await expect(scene).toHaveAttribute('data-venue', venueId);
      await expect(scene.getByRole('img')).toHaveAttribute('data-webgl-status', 'ready');
      await expectServiceOrder(page);
      await expectCompleteDashboard(page);
      await page.evaluate(() => window.scrollTo(0, 0));

      if (touch) {
        await expectMobileViewportComposition(page);
        await expectTouchTargets(page.locator('[data-service-section="dashboard"]'));
      } else {
        await expectNoHorizontalOverflow(page);
      }
    }

    const activity = page.locator('[data-service-section="activity"]');
    const stock = page.locator('[data-service-section="stock"]');
    await activity.scrollIntoViewIfNeeded();
    await expect(activity).toBeVisible();
    await stock.scrollIntoViewIfNeeded();
    await expect(stock.getByRole('list', { name: 'Live rush stock' })).toBeVisible();

    if (touch) {
      await page.setViewportSize({ width: 780, height: 360 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await expectNoHorizontalOverflow(page);
      await expectServiceOrder(page);
      const landscapeScene = await page
        .locator('[data-service-section="scene"]')
        .evaluate((element) => element.getBoundingClientRect().height);
      expect(landscapeScene).toBeLessThanOrEqual(205);

      await page.setViewportSize({ width: 360, height: 780 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await expectMobileViewportComposition(page);
    }
  });

  test('keeps event, reduced-motion, keyboard and touch operation in the same ordered flow', async ({
    page,
  }, testInfo) => {
    const touch = testInfo.project.name === 'touch-mobile';
    await page.goto('./');
    await dismissPwaPrompt(page, touch);
    await importEnvelope(
      page,
      touch,
      completeOnboarding(createSaveEnvelope(stateAtEvent())),
      'event',
    );

    await expectServiceOrder(page);
    await expectCompleteDashboard(page);
    await expect(page.locator('[data-dashboard-field="event"]')).toContainText('Decision open:');
    const dialog = page.getByRole('dialog', { name: /office coffee run/i });
    await expect(dialog).toBeVisible();
    const choice = dialog.getByRole('button').first();
    await expect(choice).toBeFocused();
    await activate(choice, touch, true);
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-dashboard-field="event"]')).toContainText(
      'Latest decision: The office coffee run arrives: Take the order',
    );

    const resume = page.getByRole('button', { name: 'Pause' });
    await activate(resume, touch, true);
    await expect(page.getByRole('button', { name: 'Resume' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await activate(page.getByRole('button', { name: '2×' }), touch, true);
    await expect(page.getByRole('button', { name: '2×' })).toHaveAttribute('aria-pressed', 'true');

    await openSettings(page, touch);
    await activate(page.getByRole('checkbox', { name: 'Reduce motion' }), touch);
    await closeGameMenu(page, touch);
    const frame = page.locator('[data-service-section="scene"]');
    await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    await expect(frame).toHaveAttribute('data-animation', 'still');
    await expectServiceOrder(page);
  });
});

function stateAtEvent(): GameState {
  let state = startRush(createCampaign({ seed: 222 }));
  let safety = 0;
  while (state.phase === 'rush' && safety < 1_000) {
    state = advanceTick(state);
    safety += 1;
  }
  if (state.phase !== 'event') throw new Error('Seed 222 did not produce a service event.');
  return state;
}

function completeOnboarding(envelope: SaveEnvelope): SaveEnvelope {
  return {
    ...envelope,
    preferences: { ...createDefaultPreferences(), onboardingComplete: true },
  };
}

async function importEnvelope(
  page: Page,
  touch: boolean,
  envelope: SaveEnvelope,
  name: string,
): Promise<void> {
  await openGameMenu(page, touch);
  await activate(page.getByRole('tab', { name: 'Save transfer' }), touch);
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: `${name}.json`,
    mimeType: 'application/json',
    buffer: Buffer.from(serializeEnvelope(envelope)),
  });
  await expect(
    page.getByText(`Imported Day ${String(envelope.activeRun?.day ?? 1)} safely.`),
  ).toBeVisible();
  await closeGameMenu(page, touch);
}

async function openGameMenu(page: Page, touch: boolean): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Game menu' });
  if (!(await dialog.isVisible())) {
    await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
  }
}

async function openSettings(page: Page, touch: boolean): Promise<void> {
  await openGameMenu(page, touch);
  await activate(page.getByRole('tab', { name: 'Settings' }), touch);
}

async function closeGameMenu(page: Page, touch: boolean): Promise<void> {
  const close = page.getByRole('button', { name: 'Close game menu' });
  if (await close.isVisible()) await activate(close, touch);
}

async function dismissPwaPrompt(page: Page, touch: boolean): Promise<void> {
  const prompt = page.getByRole('button', { name: 'Got it' });
  if (await prompt.isVisible()) await activate(prompt, touch);
}

async function activate(locator: Locator, touch: boolean, keyboard = false): Promise<void> {
  if (touch) {
    await locator.tap();
  } else if (keyboard) {
    await locator.focus();
    await locator.press('Enter');
  } else {
    await locator.click();
  }
}

async function expectServiceOrder(page: Page): Promise<void> {
  expect(
    await page
      .locator('.service-flow > [data-service-section]')
      .evaluateAll((sections) =>
        sections.map((section) => section.getAttribute('data-service-section')),
      ),
  ).toEqual(['scene', 'dashboard', 'activity', 'stock']);
}

async function expectCompleteDashboard(page: Page): Promise<void> {
  for (const field of SERVICE_DASHBOARD_FIELDS) {
    const value = page.locator(`[data-dashboard-field="${field}"]`);
    await expect(value).toBeVisible();
    await expect(value).not.toBeEmpty();
  }
}

async function expectMobileViewportComposition(page: Page): Promise<void> {
  const geometry = await page.evaluate((fields) => {
    const bounds = (selector: string): DOMRect => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}.`);
      return element.getBoundingClientRect();
    };
    const scene = bounds('[data-service-section="scene"]');
    const dashboard = bounds('[data-service-section="dashboard"]');
    const activity = bounds('[data-service-section="activity"]');
    const stock = bounds('[data-service-section="stock"]');
    return {
      activityTop: activity.top,
      dashboardBottom: dashboard.bottom,
      dashboardTop: dashboard.top,
      fieldBounds: fields.map((field) => {
        const fieldBounds = bounds(`[data-dashboard-field="${field}"]`);
        return {
          bottom: fieldBounds.bottom,
          field,
          height: fieldBounds.height,
          top: fieldBounds.top,
        };
      }),
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      sceneBottom: scene.bottom,
      sceneHeight: scene.height,
      sceneTop: scene.top,
      scrollY: window.scrollY,
      stockTop: stock.top,
    };
  }, SERVICE_DASHBOARD_FIELDS);

  expect(geometry.innerWidth).toBe(360);
  expect(geometry.innerHeight).toBe(780);
  expect(geometry.scrollY).toBe(0);
  expect(geometry.sceneTop).toBeGreaterThanOrEqual(0);
  expect(geometry.sceneHeight).toBeGreaterThanOrEqual(150);
  expect(geometry.sceneBottom).toBeLessThanOrEqual(geometry.dashboardTop + 8);
  expect(geometry.dashboardBottom).toBeLessThanOrEqual(geometry.innerHeight);
  expect(geometry.activityTop).toBeGreaterThanOrEqual(geometry.dashboardBottom);
  expect(geometry.stockTop).toBeGreaterThan(geometry.activityTop);
  for (const field of geometry.fieldBounds) {
    expect(field.height, `${field.field} has no rendered height`).toBeGreaterThan(0);
    expect(field.top, `${field.field} begins above the viewport`).toBeGreaterThanOrEqual(0);
    expect(field.bottom, `${field.field} ends below the viewport`).toBeLessThanOrEqual(
      geometry.innerHeight,
    );
  }
}

async function expectTouchTargets(root: Locator): Promise<void> {
  const undersized = await root.locator('button:visible').evaluateAll((buttons) =>
    buttons
      .map((button) => {
        const bounds = button.getBoundingClientRect();
        return { height: bounds.height, label: button.textContent?.trim(), width: bounds.width };
      })
      .filter(({ height, width }) => height < 44 || width < 44),
  );
  expect(undersized).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth);
}
