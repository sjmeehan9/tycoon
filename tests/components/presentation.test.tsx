import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/App';
import { GameProvider } from '../../src/app/GameContext';
import { parseEnvelope, SAVE_KEY } from '../../src/persistence/saveStore';

let playMock: ReturnType<typeof vi.fn<() => Promise<void>>>;

describe('pixel presentation and audio consent', () => {
  beforeEach(() => {
    playMock = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  it('renders a fixed-resolution textual scene and stops animation for reduced motion', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Start new campaign' }));
    const scene = screen.getByRole('img', { name: /Coffee Cart in/ });
    expect(scene).toHaveAttribute('width', '320');
    expect(scene).toHaveAttribute('height', '180');
    expect(scene).toHaveAttribute('data-animation', 'still');

    await user.click(screen.getByRole('button', { name: 'Open the cart' }));
    expect(scene).toHaveAttribute('data-animation', 'active');
    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('checkbox', { name: 'Reduce motion' }));
    expect(scene).toHaveAttribute('data-animation', 'still');
  });

  it('keeps audio off initially, then persists independent consent controls', async () => {
    const user = userEvent.setup();
    renderGame();
    expect(playMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Game menu' }));
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    const sounds = screen.getByRole('checkbox', { name: 'Interface sounds' });
    const ambience = screen.getByRole('checkbox', { name: 'Cafe ambience' });
    expect(sounds).not.toBeChecked();
    expect(ambience).not.toBeChecked();
    await user.click(sounds);
    await user.click(ambience);

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(2));
    const saved = parseEnvelope(window.localStorage.getItem(SAVE_KEY) ?? '');
    expect(saved?.preferences).toMatchObject({ soundEnabled: true, ambienceEnabled: true });
  });
});

function renderGame(): void {
  render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}
