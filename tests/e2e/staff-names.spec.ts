import { expect, test, type Page } from '@playwright/test';

import { LEGACY_STAFF_NAMES } from '../../src/game';
import { serializeEnvelope } from '../../src/persistence/saveStore';
import { duplicateStaffNamesEnvelope, endlessDay9_999Envelope } from '../fixtures/campaignFixtures';

test.describe('campaign-unique staff names', () => {
  test('resets legacy duplicate-name progress, then hires and reloads unique identities', async ({
    page,
  }) => {
    await page.goto('./');
    await importSave(page, JSON.stringify(duplicateStaffNamesEnvelope()), 'duplicate-staff.json');
    await expect(page.getByText(/game has evolved/i)).toBeVisible();
    await expect(page.getByText(/campaign progress was reset/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue autosave' })).toHaveCount(0);
    await dismissOptionalPwaPrompt(page);
    await page.getByRole('button', { name: 'Close game menu' }).click();
    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await page.getByRole('button', { name: 'Skip onboarding' }).click();
    await openTeam(page);

    const freshCandidateNames = await visibleTeamNames(page);
    expect(freshCandidateNames).toHaveLength(4);
    expect(new Set(freshCandidateNames).size).toBe(4);
    expect(
      freshCandidateNames.every(
        (name) => !LEGACY_STAFF_NAMES.some((legacyName) => legacyName === name),
      ),
    ).toBe(true);
    await page
      .getByRole('button', { name: /^Hire / })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /^Hire / })).toHaveCount(3);
    const hiredNames = await visibleTeamNames(page);
    expect(new Set(hiredNames).size).toBe(4);

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

async function dismissOptionalPwaPrompt(page: Page): Promise<void> {
  const prompt = page.getByRole('button', { name: 'Got it' });
  const appeared = await prompt
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) await prompt.click();
}
