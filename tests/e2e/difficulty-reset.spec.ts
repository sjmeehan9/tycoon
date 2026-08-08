import { expect, test } from '@playwright/test';

import {
  LEGACY_V3_BACKUP_SAVE_KEY,
  LEGACY_V3_SAVE_KEY,
  SAVE_KEY,
  createDefaultMeta,
  createDefaultPreferences,
  createSaveEnvelope,
  serializeEnvelope,
} from '../../src/persistence/saveStore';
import { nearVictoryEnvelope } from '../fixtures/campaignFixtures';

test.describe('v4 reset and immutable difficulty', () => {
  test('resets a legacy recovery candidate once and quarantines every v3 fallback', async ({
    page,
  }) => {
    const legacy = JSON.parse(JSON.stringify(nearVictoryEnvelope())) as Record<string, unknown>;
    legacy.schemaVersion = 3;
    legacy.preferences = {
      ...createDefaultPreferences(),
      soundEnabled: true,
      reducedMotion: true,
      onboardingComplete: true,
      activeTab: 'team',
    };

    await page.goto('./');
    await page.evaluate(
      ({ backupKey, primaryKey, value }) => {
        window.localStorage.setItem(primaryKey, '{corrupt');
        window.localStorage.setItem(backupKey, value);
      },
      {
        backupKey: LEGACY_V3_BACKUP_SAVE_KEY,
        primaryKey: LEGACY_V3_SAVE_KEY,
        value: JSON.stringify(legacy),
      },
    );
    await page.reload();

    await expect(page.getByText(/game has evolved/i)).toBeVisible();
    await expect(page.getByText(/campaign progress was reset/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue autosave' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /Standard/ })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');

    const persisted = await page.evaluate(
      ({ backupKey, primaryKey, saveKey }) => ({
        save: JSON.parse(window.localStorage.getItem(saveKey) ?? '{}') as {
          schemaVersion?: number;
          activeRun?: unknown;
          preferences?: Record<string, unknown>;
          meta?: Record<string, unknown>;
        },
        legacyPrimary: window.localStorage.getItem(primaryKey),
        legacyBackup: window.localStorage.getItem(backupKey),
      }),
      {
        backupKey: LEGACY_V3_BACKUP_SAVE_KEY,
        primaryKey: LEGACY_V3_SAVE_KEY,
        saveKey: SAVE_KEY,
      },
    );
    expect(persisted.save).toMatchObject({
      schemaVersion: 4,
      activeRun: null,
      preferences: {
        soundEnabled: true,
        ambienceEnabled: false,
        reducedMotion: true,
        onboardingComplete: false,
        activeTab: 'plan',
        evolutionNoticeSeen: true,
      },
      meta: createDefaultMeta(),
    });
    expect(persisted.legacyPrimary).toBeNull();
    expect(persisted.legacyBackup).toBeNull();

    await page.reload();
    await expect(page.getByText(/game has evolved/i)).toHaveCount(0);
  });

  test('keeps Standard preselected and scenario independent before locking Hard', async ({
    page,
  }) => {
    const meta = { ...createDefaultMeta(), scenarios: ['lanewayClassic', 'rainySeason'] as const };
    const envelope = createSaveEnvelope(null, createDefaultPreferences(), {
      ...meta,
      scenarios: [...meta.scenarios],
    });
    await page.goto('./');
    await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), {
      key: SAVE_KEY,
      value: serializeEnvelope(envelope),
    });
    await page.reload();

    const standard = page.getByRole('radio', { name: /Standard/ });
    const hard = page.getByRole('radio', { name: /Hard/ });
    const scenario = page.getByRole('combobox', { name: 'Scenario' });
    await expect(standard).toBeChecked();
    await expect(hard).not.toBeChecked();
    await scenario.selectOption('rainySeason');
    await hard.check();
    await expect(scenario).toHaveValue('rainySeason');
    await scenario.selectOption('lanewayClassic');
    await expect(hard).toBeChecked();
    await scenario.selectOption('rainySeason');

    await page.getByRole('button', { name: 'Start new campaign' }).click();
    await expect(page.getByRole('dialog', { name: 'Welcome to your laneway' })).toContainText(
      'Hard difficulty is locked for this run',
    );
    await expect(page.getByRole('radio', { name: /Hard/ })).toHaveCount(0);
    const saved = await page.evaluate((key) => {
      const envelope = JSON.parse(window.localStorage.getItem(key) ?? '{}') as {
        activeRun?: { difficulty?: string; scenarioId?: string };
      };
      return envelope.activeRun;
    }, SAVE_KEY);
    expect(saved).toMatchObject({ difficulty: 'hard', scenarioId: 'rainySeason' });

    await page.reload();
    await page.getByRole('button', { name: 'Continue autosave' }).click();
    await expect(page.getByRole('dialog', { name: 'Welcome to your laneway' })).toContainText(
      'Hard difficulty is locked for this run',
    );
  });
});
