import { expect, test, type Locator, type Page } from '@playwright/test';

import { formatMoney } from '../../src/game';
import { serializeEnvelope } from '../../src/persistence/saveStore';
import { departmentWorkforceEnvelope } from '../fixtures/campaignFixtures';

test.describe('department workforce and operational roles', () => {
  test('hires, rotates, reloads, pays, and explains a twelve-person department roster', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const touch = testInfo.project.name === 'touch-mobile';
    const envelope = departmentWorkforceEnvelope();
    const expectedPayroll = envelope.activeRun?.staff.reduce(
      (total, member) => total + member.wageCents,
      0,
    );
    if (expectedPayroll === undefined) throw new Error('Department fixture needs an active run.');

    await page.goto('./');
    await importSave(page, touch, serializeEnvelope(envelope));
    await openTeam(page, touch);

    await expect(page.getByText(/10\/10 scheduled/)).toBeVisible();
    await expect(page.getByText(/Roster · 10\/12 employed/)).toBeVisible();
    await expect(page.getByText(`${formatMoney(expectedPayroll)} payroll at close`)).toBeVisible();
    await expect(page.locator('#schedule-capacity-note')).toContainText('Daily schedule full');
    await expect(
      page.getByRole('list', { name: 'Applied department workforce effects' }),
    ).toContainText('coordination/reliability ticks remain');
    await expect(
      page.getByRole('list', { name: 'Applied department workforce effects' }),
    ).toContainText('replenishment/handoff ticks remain');

    let hireButtons = page.getByRole('button', { name: /^Hire / });
    await expect(hireButtons).toHaveCount(2);
    await expect(hireButtons.nth(0)).toBeEnabled();
    await expect(hireButtons.nth(1)).toBeEnabled();
    await activate(hireButtons.nth(0), touch);
    hireButtons = page.getByRole('button', { name: /^Hire / });
    await activate(hireButtons.nth(0), touch);

    await expect(page.getByText(/Roster · 12\/12 employed/)).toBeVisible();
    await expect(page.getByText(/candidate list is empty/)).toBeVisible();
    const overflow = page.locator('.staff-card input[type="checkbox"]:not(:checked)');
    await expect(overflow).toHaveCount(2);
    for (const checkbox of await overflow.all()) {
      await expect(checkbox).toBeDisabled();
      await expect(checkbox).toHaveAttribute('aria-describedby', 'schedule-capacity-note');
    }
    const rosterNames = await page.locator('.staff-card strong').allTextContents();
    expect(new Set(rosterNames).size).toBe(12);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.reload();
    await activate(page.getByRole('button', { name: 'Continue autosave' }), touch);
    await openTeam(page, touch);
    await expect(page.getByText(/10\/10 scheduled/)).toBeVisible();
    await expect(page.getByText(/Roster · 12\/12 employed/)).toBeVisible();
    expect(await page.locator('.staff-card strong').allTextContents()).toEqual(rosterNames);
    await expect(page.getByText(`${formatMoney(expectedPayroll)} payroll at close`)).toBeVisible();

    await activate(
      page.getByRole('button', { name: 'Open the department-store coffee hall' }),
      touch,
    );
    await activate(page.getByRole('button', { name: '4×' }), touch);
    await finishRush(page, touch);
    await activate(page.getByText('View full Day 3 report'), touch);
    await expect(page.getByRole('row', { name: /Staff wages/ })).toContainText(
      formatMoney(expectedPayroll),
    );
    await expect(page.getByText(/Manager coverage: 2 scheduled/)).toBeVisible();
    await expect(page.getByText(/Runner coverage: 2 scheduled/)).toBeVisible();
    await expect(page.getByText(/equipment-reliability ticks/)).toBeVisible();
    await expect(page.getByText(/replenishment and handoff delay fell/)).toBeVisible();
  });
});

async function importSave(page: Page, touch: boolean, contents: string): Promise<void> {
  await activate(page.getByRole('button', { name: 'Game menu', exact: true }), touch);
  await activate(page.getByRole('tab', { name: 'Save transfer' }), touch);
  await page.getByLabel('Import save JSON file').setInputFiles({
    name: 'department-workforce.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  });
  await expect(page.getByText('Imported Day 3 safely.')).toBeVisible();
  const close = page.getByRole('button', { name: 'Close game menu' });
  if (await close.isVisible()) await activate(close, touch);
  const prompt = page.getByRole('button', { name: 'Got it' });
  if (await prompt.isVisible()) await activate(prompt, touch);
}

async function openTeam(page: Page, touch: boolean): Promise<void> {
  const tab = page.getByRole('tab', { name: 'Team' });
  if (await tab.isVisible()) await activate(tab, touch);
}

async function finishRush(page: Page, touch: boolean): Promise<void> {
  const report = page.getByRole('heading', { name: 'How the cart traded' });
  while ((await report.count()) === 0) {
    const event = page.getByRole('dialog');
    if (await event.isVisible().catch(() => false)) {
      await activate(event.getByRole('button').first(), touch);
    } else {
      await page.waitForTimeout(200);
    }
  }
}

async function activate(locator: Locator, touch: boolean): Promise<void> {
  if (touch) await locator.tap();
  else await locator.click();
}
