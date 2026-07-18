import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';

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
