import { expect, test, type Page } from '@playwright/test';

import { LEGACY_STAFF_NAMES } from '../../src/game';
import { serializeEnvelope } from '../../src/persistence/saveStore';
import { duplicateStaffNamesEnvelope, endlessDay9_999Envelope } from '../fixtures/campaignFixtures';

test.describe('campaign-unique staff names', () => {
  test('repairs a compatible import, hires once, and reloads exact unique identities', async ({
    page,
  }) => {
    await page.goto('./');
    await importSave(page, JSON.stringify(duplicateStaffNamesEnvelope()), 'duplicate-staff.json');
    await expect(page.getByText('Imported Day 10000 safely.')).toBeVisible();
    await openTeam(page);

    const importedNames = await visibleTeamNames(page);
    expect(importedNames).toHaveLength(6);
    expect(new Set(importedNames).size).toBe(6);
    expect(importedNames[0]).toBe(LEGACY_STAFF_NAMES[0]);
    await page
      .getByRole('button', { name: /^Hire / })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /^Hire / })).toHaveCount(3);
    const hiredNames = await visibleTeamNames(page);
    expect(new Set(hiredNames).size).toBe(6);

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await openTeam(page);
    expect(await visibleTeamNames(page)).toEqual(hiredNames);
  });

  test('generates a unique final endless pool at Day 10,000 and restores it', async ({ page }) => {
    await page.goto('./');
    await importSave(page, serializeEnvelope(endlessDay9_999Envelope()), 'day-9999.json');
    await page.getByRole('button', { name: 'Plan Day 10000' }).click();
    await expect(page.getByRole('heading', { name: /Day 10000 · Endless/ })).toBeVisible();
    await openTeam(page);

    const day10_000Names = await visibleTeamNames(page);
    const candidates = await page.locator('.candidate-card strong').allTextContents();
    expect(candidates).toHaveLength(4);
    expect(candidates.every((name) => / [A-Z]\. /.test(name))).toBe(true);
    expect(
      candidates.every((name) => !LEGACY_STAFF_NAMES.some((legacyName) => legacyName === name)),
    ).toBe(true);
    expect(new Set(day10_000Names).size).toBe(day10_000Names.length);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await openTeam(page);
    expect(await visibleTeamNames(page)).toEqual(day10_000Names);
  });
});

async function importSave(page: Page, contents: string, filename: string): Promise<void> {
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('tab', { name: 'Save transfer' }).click();
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: filename,
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
}

async function visibleTeamNames(page: Page): Promise<string[]> {
  return page.locator('.staff-card strong, .candidate-card strong').allTextContents();
}

async function openTeam(page: Page): Promise<void> {
  const teamTab = page.getByRole('tab', { name: 'Team' });
  if (await teamTab.isVisible()) await teamTab.click();
}
