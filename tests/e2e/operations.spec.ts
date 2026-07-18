import { expect, test } from '@playwright/test';

test.describe('staff and investment operations', () => {
  test('hires both roles, schedules service, settles payroll, and reaches equipment growth', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start new campaign' }).click();

    const teamTab = page.getByRole('tab', { name: 'Team' });
    if (await teamTab.isVisible()) await teamTab.click();
    await page
      .getByRole('button', { name: /^Hire / })
      .first()
      .click();
    await page
      .getByRole('button', { name: /^Hire / })
      .first()
      .click();
    await page.getByRole('checkbox', { name: /Barista · speed/ }).check();
    await page.getByRole('checkbox', { name: /Front of house · speed/ }).check();
    await expect(page.getByText(/2\/2 scheduled/)).toBeVisible();
    await expect(page.getByText(/payroll at close/)).toBeVisible();

    await page.getByRole('button', { name: 'Open the cart' }).click();
    await page.getByRole('button', { name: '4×' }).click();
    while ((await page.getByRole('heading', { name: 'How the cart traded' }).count()) === 0) {
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.getByRole('button').first().click();
      } else {
        await page.waitForTimeout(250);
      }
    }
    await expect(page.getByRole('row', { name: /Staff wages/ })).toBeVisible();
    await expect(page.getByText(/scheduled team members cost/i)).toBeVisible();
    await page.getByRole('button', { name: 'Settle the day' }).click();
    await expect(page.getByRole('heading', { name: 'Equipment workshop' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Promote to Coffee Kiosk' })).toBeDisabled();
    const grinder = page.getByRole('button', { name: /Buy Grinder level 1/ });
    await expect(grinder).toBeEnabled();
    await grinder.click();
    await expect(page.getByText('Current: +2 cup quality')).toBeVisible();
  });
});
