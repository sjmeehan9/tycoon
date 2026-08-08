import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { advanceTick, createCampaign, startRush, type SaveEnvelope } from '../../src/game';
import { SAVE_KEY, createSaveEnvelope, serializeEnvelope } from '../../src/persistence/saveStore';
import { denseDepartmentRushEnvelope } from '../fixtures/campaignFixtures';

const serviceWorker = vi.hoisted(() => ({
  setNeedRefresh: vi.fn(),
  setOfflineReady: vi.fn(),
  update: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, serviceWorker.setNeedRefresh],
    offlineReady: [false, serviceWorker.setOfflineReady],
    updateServiceWorker: serviceWorker.update,
  }),
}));

describe('safe PWA update prompt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defers without refreshing the active campaign', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(screen.getByRole('button', { name: 'Show current step' }));
    await user.click(screen.getByRole('button', { name: 'Keep playing' }));

    expect(serviceWorker.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(serviceWorker.update).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Set up the cart' })).toBeVisible();
  });

  it('writes a verified checkpoint before accepting the waiting worker', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    await user.click(screen.getByRole('button', { name: 'Show current step' }));
    setItem.mockClear();
    serviceWorker.update.mockClear();

    await user.click(screen.getByRole('button', { name: 'Save and update' }));

    expect(setItem).toHaveBeenCalled();
    expect(serviceWorker.update).toHaveBeenCalledWith(true);
    expect(setItem.mock.invocationCallOrder[0]).toBeLessThan(
      serviceWorker.update.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it.each([
    ['rush', denseDepartmentRushEnvelope(), 'Resume'],
    ['event', eventEnvelope(), 'Protect the queue'],
  ] as const)(
    'keeps a waiting worker inactive throughout %s service',
    async (_phase, envelope, activeControl) => {
      const user = userEvent.setup();
      window.localStorage.setItem(SAVE_KEY, serializeEnvelope(envelope));
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      renderGame();

      await user.click(screen.getByRole('button', { name: 'Continue autosave' }));
      setItem.mockClear();
      const update = screen.getByRole('button', { name: 'Finish service to update' });

      expect(update).toBeDisabled();
      expect(update).toHaveAccessibleDescription(/service is active/i);
      await user.click(update);
      expect(setItem).not.toHaveBeenCalled();
      expect(serviceWorker.update).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: new RegExp(activeControl, 'i') })).toBeVisible();
    },
  );

  it('blocks activation when browser storage cannot verify the checkpoint', async () => {
    const user = userEvent.setup();
    renderGame();
    serviceWorker.update.mockClear();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is blocked.', 'SecurityError');
    });

    await user.click(screen.getByRole('button', { name: 'Save and update' }));

    expect(serviceWorker.update).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/checkpoint was not verified/i);
  });
});

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}

function eventEnvelope(): SaveEnvelope {
  let state = startRush(createCampaign({ seed: 222 }));
  let safety = 0;
  while (state.phase === 'rush' && safety < 1_000) {
    state = advanceTick(state);
    safety += 1;
  }
  if (state.phase !== 'event') throw new Error('Seed 222 did not produce a service event.');
  return createSaveEnvelope(state);
}
