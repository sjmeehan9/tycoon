import { expect, test, type Page } from '@playwright/test';

import {
  CAMPAIGN_RULES,
  DEPARTMENT_EVENT_TEMPLATE_IDS,
  DRINK_MAP,
} from '../../src/content/gameContent';
import { formatMoney, recordCampaignOutcome, type SaveEnvelope } from '../../src/game';
import {
  SAVE_KEY,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { simulateBalanceCampaign } from '../fixtures/balanceStrategies';

test.describe('complete forty-day campaigns', () => {
  for (const difficulty of ['standard', 'hard'] as const) {
    test(`${difficulty} reaches a department-store victory with forty immutable reports`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const result = simulateBalanceCampaign(101, difficulty, 'premium-quality');
      const { final } = result;
      expect(final.outcome?.type).toBe('victory');
      expect(final.day).toBe(CAMPAIGN_RULES.durationDays);
      expect(final.venueId).toBe('departmentStore');
      expect(final.history).toHaveLength(CAMPAIGN_RULES.durationDays);
      expect(final.history.every((report) => report.causeSnapshot !== null)).toBe(true);
      const departmentEventReport = final.history.find((report) =>
        report.causeSnapshot?.events.some((event) =>
          DEPARTMENT_EVENT_TEMPLATE_IDS.includes(
            event.eventId as (typeof DEPARTMENT_EVENT_TEMPLATE_IDS)[number],
          ),
        ),
      );
      if (!departmentEventReport?.causeSnapshot) {
        throw new Error('Expected at least one resolved department event in the completed run.');
      }
      const meta = recordCampaignOutcome(createDefaultMeta(), final);
      await installSave(page, createSaveEnvelope(final, createDefaultPreferences(), meta));

      const ending = page.locator('.ending-panel');
      await expect(ending.getByText('Campaign complete', { exact: true })).toBeVisible();
      await expect(ending.getByText('Department Store Coffee Hall', { exact: true })).toBeVisible();
      await expect(ending.getByText('Day', { exact: true })).toBeVisible();
      await expect(
        ending.getByText(String(CAMPAIGN_RULES.durationDays), { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue in endless mode' })).toBeVisible();

      await page.getByRole('button', { name: 'Game menu', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Game menu' });
      await dialog.getByRole('tab', { name: 'Reports' }).click();
      await expect(dialog.getByRole('button', { name: /Day \d+/ })).toHaveCount(
        CAMPAIGN_RULES.durationDays,
      );
      await dialog
        .getByRole('button', { name: new RegExp(`Day ${departmentEventReport.day}\\b`) })
        .click();
      await dialog.getByText(`View full Day ${departmentEventReport.day} report`).click();
      await expect(
        dialog.getByText(
          `Day ${departmentEventReport.day} report · ${difficulty === 'hard' ? 'Hard' : 'Standard'}`,
        ),
      ).toBeVisible();

      const causes = departmentEventReport.causeSnapshot;
      const capturedMenu = dialog.getByRole('list', { name: 'Captured menu prices' });
      for (const { drinkId, priceCents } of causes.plan.menu) {
        const drinkName = DRINK_MAP.get(drinkId)?.name;
        if (!drinkName) throw new Error(`Missing configured drink ${drinkId}.`);
        await expect(capturedMenu.getByText(drinkName).locator('..')).toContainText(
          formatMoney(priceCents),
        );
      }
      const departmentEvent = causes.events.find((event) =>
        DEPARTMENT_EVENT_TEMPLATE_IDS.includes(
          event.eventId as (typeof DEPARTMENT_EVENT_TEMPLATE_IDS)[number],
        ),
      );
      if (!departmentEvent) throw new Error('Expected captured department event evidence.');
      await expect(
        dialog.getByLabel(`${departmentEvent.title} resolved effect values`),
      ).toBeVisible();
    });
  }
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
