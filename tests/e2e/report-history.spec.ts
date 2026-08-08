import { expect, test, type Locator, type Page } from '@playwright/test';

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
      schemaVersion: 3,
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
    const oldReport = source.activeRun?.history[0];
    const canonicalReport = source.activeRun?.history[1];
    if (!oldReport || !canonicalReport?.chargeGroups) {
      throw new Error('History fixture requires old and canonical reports.');
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
    expect((await persistedSettlement(page)).schemaVersion).toBe(3);
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
