import { expect, test, type Locator, type Page } from '@playwright/test';

import { DRINK_MAP } from '../../src/content/gameContent';
import { formatMoney, type SaveEnvelope } from '../../src/game';
import { SAVE_KEY, serializeEnvelope } from '../../src/persistence/saveStore';
import { currentReportEnvelope, reportHistoryEnvelope } from '../fixtures/campaignFixtures';

test.describe('compact completion and report history', () => {
  test('settles a compact current report once across repeated activation and reload', async ({
    page,
  }) => {
    const source = currentReportEnvelope();
    const report = source.activeRun?.report;
    if (!report?.chargeGroups)
      throw new Error('Current report fixture requires canonical charges.');
    await installSave(page, source);

    await expect(page.getByRole('heading', { name: 'How the cart traded' })).toBeVisible();
    await expect(page.getByLabel(`Day ${report.day} result summary`)).toBeVisible();
    await expect(page.getByRole('table', { name: 'Cash reconciliation' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Settle & reinvest' })).toHaveCount(1);
    const settleBox = await page.getByRole('button', { name: 'Settle & reinvest' }).boundingBox();
    expect(settleBox?.height).toBeGreaterThanOrEqual(44);
    await page.getByText(`View full Day ${report.day} report`).click();
    await expect(page.getByRole('list', { name: 'Canonical sale charges' })).toBeVisible();

    await page.getByRole('button', { name: 'Settle & reinvest' }).evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect(page.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    expect(await persistedSettlement(page)).toEqual({
      day: report.day,
      historyLength: 1,
      quantity: report.served,
      revenueCents: report.revenueCents,
      schemaVersion: 4,
    });

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('heading', { name: 'Reinvest or call it a night' })).toBeVisible();
    expect((await persistedSettlement(page)).historyLength).toBe(1);
    const menuTrigger = page.getByRole('button', { name: 'Game menu', exact: true });
    await menuTrigger.click();
    const dialog = page.getByRole('dialog', { name: 'Game menu' });
    await dialog.getByRole('tab', { name: 'Reports' }).click();
    await expect(
      dialog.getByRole('heading', { name: `Day ${report.day} trading report` }),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Settle & reinvest' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Close game menu' }).click();
    await expect(menuTrigger).toBeFocused();
  });

  test('keeps old and canonical history read-only through keyboard, touch, export, and import', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    const source = reportHistoryEnvelope();
    source.preferences.reducedMotion = true;
    const activeSale = source.activeRun?.rush?.recentActivity.find(
      (event) => event.type === 'sale',
    );
    if (activeSale?.type === 'sale') activeSale.priceCents = 9_999;
    if (source.activeRun) {
      source.activeRun.plan = {
        ...source.activeRun.plan,
        dialIn: 'speed',
        pricesCents: {
          ...source.activeRun.plan.pricesCents,
          ...Object.fromEntries(
            source.activeRun.plan.activeMenu.map((drinkId) => [drinkId, 1_200]),
          ),
        },
      };
    }
    const oldReport = source.activeRun?.history[0];
    const canonicalReport = source.activeRun?.history[1];
    const canonicalCauses = canonicalReport?.causeSnapshot;
    if (!oldReport || !canonicalReport?.chargeGroups || !canonicalCauses) {
      throw new Error('History fixture requires old and canonical reports with causes.');
    }
    expect(oldReport.chargeGroups).toBeUndefined();
    await installSave(page, source);

    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
    const menuTrigger = page.getByRole('button', { name: 'Game menu', exact: true });
    await menuTrigger.click();
    let dialog = page.getByRole('dialog', { name: 'Game menu' });
    await dialog.getByRole('tab', { name: 'Reports' }).click();
    await expect(dialog.getByRole('button', { name: /Day / })).toHaveCount(2);
    for (const reportButton of await dialog.getByRole('button', { name: /Day / }).all()) {
      expect((await reportButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    await expect(
      dialog.getByRole('heading', { name: `Day ${canonicalReport.day} trading report` }),
    ).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Actual charges' })).toBeHidden();
    await activate(
      dialog.getByText(`View full Day ${canonicalReport.day} report`),
      testInfo.project.name,
    );
    await expect(dialog.getByRole('list', { name: 'Canonical sale charges' })).toBeVisible();
    await expect(dialog.getByText(/matching sales revenue/i)).toContainText(
      formatMoney(canonicalReport.revenueCents),
    );
    await expect(dialog.locator('[data-report-mode="historical"]')).not.toContainText('$99.99');
    const capturedMenu = dialog.getByRole('list', { name: 'Captured menu prices' });
    await expect(capturedMenu).not.toContainText('$12.00');
    for (const { drinkId, priceCents } of canonicalCauses.plan.menu) {
      const drinkName = DRINK_MAP.get(drinkId)?.name;
      if (!drinkName) throw new Error(`Missing configured drink ${drinkId}.`);
      await expect(capturedMenu.getByText(drinkName).locator('..')).toContainText(
        formatMoney(priceCents),
      );
    }
    for (const event of canonicalCauses.events) {
      const effects = dialog.getByLabel(`${event.title} resolved effect values`);
      await expect(effects).toContainText(`Cash${signedMoney(event.effect.cashCents ?? 0)}`);
      await expect(effects).toContainText(
        `Arrivals${signedNumber(event.effect.addCustomers ?? 0)}`,
      );
      await expect(effects).toContainText(`Demand×${String(event.effect.demandMultiplier ?? 1)}`);
      await expect(effects).toContainText(`Quality${signedNumber(event.effect.qualityBonus ?? 0)}`);
      await expect(effects).toContainText(
        `Reputation${signedNumber(event.effect.reputation ?? 0)}`,
      );
    }

    await activate(
      dialog.getByRole('button', { name: new RegExp(`Day ${oldReport.day}`) }),
      testInfo.project.name,
    );
    await expect(
      dialog.getByRole('heading', { name: `Day ${oldReport.day} trading report` }),
    ).toBeVisible();
    await expect(
      dialog.getByText('Charge breakdown unavailable for this older report.'),
    ).toBeHidden();
    await activate(
      dialog.getByText(`View full Day ${oldReport.day} report`),
      testInfo.project.name,
    );
    await expect(
      dialog.getByText('Charge breakdown unavailable for this older report.'),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Settle & reinvest' })).toHaveCount(0);
    const overflow = await dialog.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await dialog.getByRole('tab', { name: 'Save transfer' }).click();
    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Export save JSON' }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Exported report history was unavailable.');
    await dialog.getByText('Start clean (keep settings and unlocks)').click();
    await page.getByRole('button', { name: 'Game menu', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Game menu' });
    await dialog.getByRole('tab', { name: 'Save transfer' }).click();
    await dialog.getByLabel('Import save JSON file').setInputFiles(downloadPath);
    await expect(page.getByText('Imported Day 1 safely.')).toBeVisible();
    await page.getByRole('button', { name: 'Game menu', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Game menu' });
    await dialog.getByRole('tab', { name: 'Reports' }).click();
    await expect(dialog.getByRole('button', { name: /Day / })).toHaveCount(2);

    await dialog.getByRole('button', { name: 'Close game menu' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await menuTrigger.click();
    dialog = page.getByRole('dialog', { name: 'Game menu' });
    await dialog.getByRole('tab', { name: 'Reports' }).click();
    await activate(
      dialog.getByRole('button', { name: new RegExp(`Day ${oldReport.day}`) }),
      testInfo.project.name,
    );
    await activate(
      dialog.getByText(`View full Day ${oldReport.day} report`),
      testInfo.project.name,
    );
    await expect(
      dialog.getByText('Charge breakdown unavailable for this older report.'),
    ).toBeVisible();
    expect((await persistedSettlement(page)).schemaVersion).toBe(4);
    await dialog.getByRole('button', { name: 'Close game menu' }).click();
    await expect(menuTrigger).toBeFocused();
  });
});

async function installSave(page: Page, envelope: SaveEnvelope): Promise<void> {
  await page.goto('./');
  await page.evaluate(({ key, serialized }) => window.localStorage.setItem(key, serialized), {
    key: SAVE_KEY,
    serialized: serializeEnvelope(envelope),
  });
  await page.reload();
  await page.getByRole('button', { name: 'Continue autosave' }).click();
}

async function activate(locator: Locator, projectName: string): Promise<void> {
  if (projectName === 'touch-mobile') {
    await locator.tap();
  } else {
    await locator.focus();
    await locator.press('Enter');
  }
}

function signedMoney(cents: number): string {
  return `${cents >= 0 ? '+' : '−'}${formatMoney(Math.abs(cents))}`;
}

function signedNumber(value: number): string {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
}

async function persistedSettlement(page: Page): Promise<{
  day: number | undefined;
  historyLength: number;
  quantity: number | undefined;
  revenueCents: number | undefined;
  schemaVersion: number | undefined;
}> {
  return page.evaluate((key) => {
    const envelope = JSON.parse(window.localStorage.getItem(key) ?? '{}') as {
      activeRun?: {
        history?: Array<{
          chargeGroups?: Array<{ quantity: number; revenueCents: number }>;
          day: number;
        }>;
      };
      schemaVersion?: number;
    };
    const history = envelope.activeRun?.history ?? [];
    const report = history.at(-1);
    return {
      day: report?.day,
      historyLength: history.length,
      quantity: report?.chargeGroups?.reduce((total, group) => total + group.quantity, 0),
      revenueCents: report?.chargeGroups?.reduce((total, group) => total + group.revenueCents, 0),
      schemaVersion: envelope.schemaVersion,
    };
  }, SAVE_KEY);
}
